import { supabase } from '@/supabase';

class ChatBot {
  constructor() {
    this.currentState = 'GREETING';
    this.customerInfo = {
      gameId: null,
      gamePassword: null
    };
    this.responses = new Map();
  }

  async initialize() {
    await this.loadResponses();
  }

  async loadResponses() {
    try {
      const { data, error } = await supabase
        .from('chatbot_responses')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;

      // Index responses by type and keywords
      this.responses.clear();
      data.forEach(response => {
        this.responses.set(response.type, response);
        response.keywords.forEach(keyword => {
          if (!this.responses.has(keyword)) {
            this.responses.set(keyword, response);
          }
        });
      });
    } catch (error) {
      console.error('Error loading chatbot responses:', error);
    }
  }

  async handleMessage(message, sessionId) {
    const lowercaseMsg = message.toLowerCase();

    switch (this.currentState) {
      case 'GREETING':
        this.currentState = 'WAITING_GAME_ID';
        return {
          type: 'bot',
          content: this.getResponse('greeting').response
        };

      case 'WAITING_GAME_ID':
        this.customerInfo.gameId = message;
        this.currentState = 'WAITING_GAME_PASSWORD';
        return {
          type: 'bot',
          content: this.getResponse('password_prompt').response
        };

      case 'WAITING_GAME_PASSWORD':
        this.customerInfo.gamePassword = message;
        this.currentState = 'CHAT';
        
        // Check if customer exists
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('*')
          .eq('game_id', this.customerInfo.gameId)
          .single();

        if (!existingCustomer) {
          // New customer - notify admin
          await this.notifyAdmin(sessionId, 'NEW_CUSTOMER', {
            gameId: this.customerInfo.gameId,
            message: 'New customer registration needed'
          });

          return {
            type: 'bot',
            content: this.getResponse('new_customer').response
          };
        }

        return {
          type: 'bot',
          content: this.getResponse('greeting').response
        };

      case 'CHAT':
        // Find matching response based on keywords
        let matchedResponse = null;
        for (const [keyword, response] of this.responses) {
          if (lowercaseMsg.includes(keyword)) {
            if (!matchedResponse || response.priority > matchedResponse.priority) {
              matchedResponse = response;
            }
          }
        }

        if (matchedResponse) {
          return {
            type: 'bot',
            content: matchedResponse.response
          };
        }

        // If no matching response found, notify admin
        await this.notifyAdmin(sessionId, 'ASSISTANCE_NEEDED', {
          gameId: this.customerInfo.gameId,
          message: message
        });

        return {
          type: 'bot',
          content: this.getResponse('unknown').response
        };
    }
  }

  getResponse(type) {
    return this.responses.get(type) || {
      response: "I'm sorry, I couldn't process that request. Let me connect you with an admin."
    };
  }

  async notifyAdmin(sessionId, type, data) {
    try {
      await supabase
        .from('admin_notifications')
        .insert({
          type,
          session_id: sessionId,
          data,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      // Also notify through WebSocket for real-time updates
      if (window.socket) {
        window.socket.emit('admin_notification', {
          type,
          sessionId,
          data
        });
      }
    } catch (error) {
      console.error('Error notifying admin:', error);
    }
  }

  reset() {
    this.currentState = 'GREETING';
    this.customerInfo = {
      gameId: null,
      gamePassword: null
    };
  }
}

export const chatbot = new ChatBot();
