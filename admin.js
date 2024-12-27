import supabase from './supabase.js';

let adminDashboard;
let adminLoginForm;
let adminUsernameInput;
let adminPasswordInput;

export const initAdmin = async () => {
    // Get DOM elements
    adminDashboard = document.getElementById('admin-dashboard');
    adminLoginForm = document.getElementById('admin-login-form');
    adminUsernameInput = document.getElementById('admin-username');
    adminPasswordInput = document.getElementById('admin-password');

    // Initialize event listeners
    initializeEventListeners();
    
    // Check if admin is already logged in
    const session = localStorage.getItem('admin_session');
    if (session) {
        showDashboard();
    }
};

const initializeEventListeners = () => {
    // Admin Login Form
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleAdminLogin);

    // Logout button
    const logoutBtn = document.getElementById('adminLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // ChatBot config form
    const configForm = document.getElementById('botConfigForm');
    if (configForm) {
        configForm.addEventListener('submit', handleConfigSubmit);
    }
};

const handleAdminLogin = async (e) => {
    e.preventDefault();
    const username = adminUsernameInput.value;
    const password = adminPasswordInput.value;

    try {
        const { data, error } = await supabase
            .from('admins')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error) throw error;

        if (data) {
            // Store admin session
            localStorage.setItem('admin_session', JSON.stringify({
                username: data.username,
                timestamp: new Date().toISOString()
            }));

            showDashboard();
            loadDashboardData();
        } else {
            showError('Invalid login credentials');
        }
    } catch (error) {
        showError('Login failed: ' + error.message);
    }
};

const handleLogout = () => {
    localStorage.removeItem('admin_session');
    hideDashboard();
};

const showDashboard = () => {
    adminLoginForm.style.display = 'none';
    adminDashboard.style.display = 'block';
};

const hideDashboard = () => {
    adminLoginForm.style.display = 'block';
    adminDashboard.style.display = 'none';
};

const loadDashboardData = async () => {
    try {
        // Load messages
        const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        // Load chatbot configs
        const { data: configs } = await supabase
            .from('chatbot_config')
            .select('*')
            .order('created_at', { ascending: false });

        updateDashboardUI(messages, configs);
    } catch (error) {
        showError('Failed to load dashboard data: ' + error.message);
    }
};

const updateDashboardUI = (messages, configs) => {
    // Update messages table
    const messagesTable = document.getElementById('messagesTable');
    if (messagesTable && messages) {
        messagesTable.innerHTML = messages.map(msg => `
            <tr>
                <td>${new Date(msg.created_at).toLocaleString()}</td>
                <td>${msg.sender}</td>
                <td>${msg.content}</td>
            </tr>
        `).join('');
    }

    // Update config table
    const configTable = document.getElementById('configTable');
    if (configTable && configs) {
        configTable.innerHTML = configs.map(config => `
            <tr>
                <td>${config.keyword}</td>
                <td>${config.response}</td>
                <td>
                    <button onclick="editConfig('${config.id}')">Edit</button>
                    <button onclick="deleteConfig('${config.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    // Update statistics
    if (messages) {
        updateStatistics(messages);
    }
};

const updateStatistics = (messages) => {
    const stats = {
        totalMessages: messages.length,
        userMessages: messages.filter(m => m.sender === 'user').length,
        botMessages: messages.filter(m => m.sender === 'bot').length
    };

    // Update stats in UI
    const statsContainer = document.getElementById('statsContainer');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-card">
                <h3>Total Messages</h3>
                <p>${stats.totalMessages}</p>
            </div>
            <div class="stat-card">
                <h3>User Messages</h3>
                <p>${stats.userMessages}</p>
            </div>
            <div class="stat-card">
                <h3>Bot Messages</h3>
                <p>${stats.botMessages}</p>
            </div>
        `;
    }
};

const handleConfigSubmit = async (e) => {
    e.preventDefault();
    const keyword = document.getElementById('configKeyword').value;
    const response = document.getElementById('configResponse').value;

    try {
        const { error } = await supabase
            .from('chatbot_config')
            .insert([{ keyword, response }]);

        if (error) throw error;

        // Reload dashboard data
        loadDashboardData();
        e.target.reset();
    } catch (error) {
        showError('Failed to add config: ' + error.message);
    }
};

const showError = (message) => {
    const errorDiv = document.getElementById('adminError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    } else {
        alert(message);
    }
};

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
