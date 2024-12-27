import supabase from './supabase.js';

// Global state
let currentSession = null;
let currentAdmin = null;
let messageSubscription = null;
let sessionSubscription = null;

// DOM Elements
const loginContainer = document.getElementById('loginContainer');
const dashboard = document.getElementById('dashboard');
const chatSessions = document.getElementById('chatSessions');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const currentSessionInfo = document.getElementById('currentSessionInfo');

// Login functionality
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const { data, error } = await adminLogin(email, password);
        if (error) throw error;

        currentAdmin = data.user;
        loginContainer.style.display = 'none';
        dashboard.classList.add('active');
        
        // Initialize dashboard
        initializeDashboard();
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
});

// Initialize dashboard
async function initializeDashboard() {
    try {
        // Fetch active sessions
        const { data: sessions, error } = await fetchActiveSessions();
        if (error) throw error;

        // Display sessions
        displaySessions(sessions);

        // Subscribe to new sessions
        subscribeToSessions();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

// Display chat sessions
function displaySessions(sessions) {
    chatSessions.innerHTML = '';
    sessions.forEach(session => {
        const li = document.createElement('li');
        li.className = 'chat-session';
        if (currentSession && currentSession.id === session.id) {
            li.classList.add('active');
        }

        const lastMessage = session.messages[session.messages.length - 1];
        li.innerHTML = `
            <div class="session-header">
                <span>Session #${session.id}</span>
                <span class="status-badge ${session.status}">${session.status}</span>
            </div>
            <div class="session-info">
                <p>${lastMessage ? lastMessage.content.substring(0, 50) + '...' : 'No messages'}</p>
                <small>${new Date(session.created_at).toLocaleString()}</small>
            </div>
        `;

        li.addEventListener('click', () => selectSession(session));
        chatSessions.appendChild(li);
    });
}

// Select a chat session
async function selectSession(session) {
    // Remove active class from previous session
    const previousActive = chatSessions.querySelector('.chat-session.active');
    if (previousActive) {
        previousActive.classList.remove('active');
    }

    // Add active class to new session
    const newActive = chatSessions.querySelector(`[data-session-id="${session.id}"]`);
    if (newActive) {
        newActive.classList.add('active');
    }

    currentSession = session;
    
    // Update session info
    currentSessionInfo.innerHTML = `
        <h3>Session #${session.id}</h3>
        <span class="status-badge ${session.status}">${session.status}</span>
    `;

    // Fetch and display messages
    const { data: messages, error } = await fetchMessages(session.id);
    if (error) {
        console.error('Error fetching messages:', error);
        return;
    }

    displayMessages(messages);

    // Subscribe to new messages for this session
    if (messageSubscription) {
        messageSubscription.unsubscribe();
    }
    messageSubscription = subscribeToMessages(session.id, (message) => {
        appendMessage(message);
    });
}

// Display messages
function displayMessages(messages) {
    chatMessages.innerHTML = '';
    messages.forEach(message => {
        appendMessage(message);
    });
    scrollToBottom();
}

// Append a new message
function appendMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.sender === 'admin' ? 'admin' : ''}`;
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${message.content}</p>
            <span class="message-time">${new Date(message.created_at).toLocaleString()}</span>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Send admin message
async function sendAdminMessage() {
    const content = messageInput.value.trim();
    if (!content || !currentSession) return;

    try {
        const { error } = await sendMessage(content, 'admin', currentSession.id);
        if (error) throw error;
        
        messageInput.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message');
    }
}

// Subscribe to session updates
function subscribeToSessions() {
    if (sessionSubscription) {
        sessionSubscription.unsubscribe();
    }

    sessionSubscription = subscribeToSessions(async (payload) => {
        const { data: sessions, error } = await fetchActiveSessions();
        if (error) {
            console.error('Error fetching sessions:', error);
            return;
        }
        displaySessions(sessions);
    });
}

// Scroll chat to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Logout functionality
async function logout() {
    try {
        const { error } = await adminLogout();
        if (error) throw error;

        // Cleanup
        currentSession = null;
        currentAdmin = null;
        if (messageSubscription) messageSubscription.unsubscribe();
        if (sessionSubscription) sessionSubscription.unsubscribe();

        // Reset UI
        dashboard.classList.remove('active');
        loginContainer.style.display = 'flex';
        
        // Clear form
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
    } catch (error) {
        console.error('Error logging out:', error);
        alert('Failed to logout');
    }
}

// Initialize message input
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAdminMessage();
    }
});

// Export functions that need to be accessed globally
window.editConfig = async (id) => {
    // Implementation for editing config
    console.log('Edit config:', id);
};

window.deleteConfig = async (id) => {
    if (confirm('Are you sure you want to delete this configuration?')) {
        try {
            const { error } = await supabase
                .from('chatbot_config')
                .delete()
                .eq('id', id);

            if (error) throw error;
            loadDashboardData();
        } catch (error) {
            showError('Failed to delete config: ' + error.message);
        }
    }
};

// Helper functions
async function adminLogin(email, password) {
    // Implement admin login logic here
    // For now, just return a dummy response
    return {
        data: {
            user: {
                id: 1,
                name: 'Admin User'
            }
        }
    };
}

async function fetchActiveSessions() {
    // Implement fetch active sessions logic here
    // For now, just return a dummy response
    return {
        data: [
            {
                id: 1,
                status: 'active',
                created_at: new Date(),
                messages: [
                    {
                        content: 'Hello, how can I help you?',
                        sender: 'admin',
                        created_at: new Date()
                    }
                ]
            }
        ]
    };
}

async function fetchMessages(sessionId) {
    // Implement fetch messages logic here
    // For now, just return a dummy response
    return {
        data: [
            {
                content: 'Hello, how can I help you?',
                sender: 'admin',
                created_at: new Date()
            }
        ]
    };
}

async function sendMessage(content, sender, sessionId) {
    // Implement send message logic here
    // For now, just return a dummy response
    return {
        error: null
    };
}

async function subscribeToMessages(sessionId, callback) {
    // Implement subscribe to messages logic here
    // For now, just return a dummy subscription
    return {
        unsubscribe: () => {}
    };
}

async function subscribeToSessions(callback) {
    // Implement subscribe to sessions logic here
    // For now, just return a dummy subscription
    return {
        unsubscribe: () => {}
    };
}

async function adminLogout() {
    // Implement admin logout logic here
    // For now, just return a dummy response
    return {
        error: null
    };
}
