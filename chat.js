import {
    fetchMessages,
    sendMessage,
    subscribeToMessages,
    processBotResponse
} from './supabase.js';

let messagesDiv;
let chatForm;
let messageInput;

// Initialize chat
export const initChat = async () => {
    // Get DOM elements
    messagesDiv = document.getElementById('chatMessages');
    chatForm = document.querySelector('.chat-input');
    messageInput = document.getElementById('messageInput');

    // Load initial messages
    await loadMessages();

    // Subscribe to new messages
    subscribeToMessages(displayMessage);

    // Initialize event listeners
    initializeEventListeners();
};

// Load messages from Supabase
const loadMessages = async () => {
    const { data, error } = await fetchMessages();
    if (!error && data) {
        messagesDiv.innerHTML = '';
        data.forEach(message => displayMessage(message));
        scrollToBottom();
    }
};

// Display a single message
const displayMessage = (message) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.sender === 'user' ? 'sent' : 'received'}`;
    
    const messageText = document.createElement('p');
    messageText.textContent = message.content;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'time';
    timeSpan.textContent = new Date(message.created_at || Date.now()).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.appendChild(messageText);
    messageDiv.appendChild(timeSpan);
    messagesDiv.appendChild(messageDiv);
    
    scrollToBottom();
};

// Initialize event listeners
const initializeEventListeners = () => {
    const sendButton = document.getElementById('sendMessage');
    const clearChatBtn = document.getElementById('clearChat');
    const modeBtns = document.querySelectorAll('.mode-btn');

    // Send message handler
    const sendMessageHandler = async () => {
        const content = messageInput.value.trim();
        if (content) {
            // Send user message
            const { error } = await sendMessage(content, 'user');
            if (!error) {
                messageInput.value = '';

                // If in bot mode, process bot response
                const currentMode = document.querySelector('.mode-btn.active').dataset.mode;
                if (currentMode === 'bot') {
                    await processBotResponse(content);
                }
            }
        }
    };

    // Event listeners
    sendButton.addEventListener('click', sendMessageHandler);
    
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessageHandler();
        }
    });

    // Clear chat
    clearChatBtn.addEventListener('click', () => {
        messagesDiv.innerHTML = '';
    });

    // Chat mode switching
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const chatTitle = document.getElementById('chatTitle');
            const chatMode = document.getElementById('chatMode');
            
            if (mode === 'bot') {
                chatTitle.textContent = 'ChatBot Assistant';
                chatMode.className = 'fas fa-robot';
            } else {
                chatTitle.textContent = 'Customer Support';
                chatMode.className = 'fas fa-headset';
            }
        });
    });

    // Additional features
    const emojiBtn = document.querySelector('.emoji-btn');
    const attachBtn = document.querySelector('.attach-btn');

    emojiBtn.addEventListener('click', () => {
        // Emoji picker implementation can be added here
        console.log('Emoji picker clicked');
    });

    attachBtn.addEventListener('click', () => {
        // File attachment implementation can be added here
        console.log('File attachment clicked');
    });
};

// Utility function to scroll chat to bottom
const scrollToBottom = () => {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
};

// Export functions that need to be accessed from other modules
export const startChat = () => {
    document.querySelector('a[href="#chat"]').click();
};
