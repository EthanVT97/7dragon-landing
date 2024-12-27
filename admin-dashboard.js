import supabase from './supabase.js';

// Check admin session
const checkSession = () => {
    const session = JSON.parse(localStorage.getItem('admin_session'));
    if (!session || !session.id) {
        window.location.href = 'admin-login.html';
    }
    return session;
};

// Initialize dashboard
const initDashboard = async () => {
    const session = checkSession();
    document.getElementById('adminUsername').textContent = session.username;

    // Initialize charts
    initCharts();
    
    // Load initial data
    await loadDashboardData();
    
    // Set up real-time listeners
    setupRealtimeListeners();
};

// Initialize charts
const initCharts = () => {
    // User Activity Chart
    const userActivityCtx = document.getElementById('userActivityChart').getContext('2d');
    new Chart(userActivityCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Active Users',
                data: [65, 59, 80, 81, 56, 55, 40],
                borderColor: '#00ff7f',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                }
            },
            scales: {
                y: {
                    ticks: { color: '#ffffff' }
                },
                x: {
                    ticks: { color: '#ffffff' }
                }
            }
        }
    });

    // Message Distribution Chart
    const messageDistCtx = document.getElementById('messageDistChart').getContext('2d');
    new Chart(messageDistCtx, {
        type: 'doughnut',
        data: {
            labels: ['User Messages', 'Bot Responses', 'Admin Responses'],
            datasets: [{
                data: [300, 250, 100],
                backgroundColor: ['#00ff7f', '#9b4dca', '#ff6b6b']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#ffffff'
                    }
                }
            }
        }
    });
};

// Load dashboard data
const loadDashboardData = async () => {
    try {
        // Fetch statistics
        const { data: stats, error: statsError } = await supabase
            .from('statistics')
            .select('*')
            .single();

        if (statsError) throw statsError;

        // Update statistics cards
        document.getElementById('totalUsers').textContent = stats.total_users;
        document.getElementById('totalMessages').textContent = stats.total_messages;
        document.getElementById('botResponses').textContent = stats.bot_responses;
        document.getElementById('avgResponseTime').textContent = `${stats.avg_response_time}s`;

        // Load messages
        await loadMessages();

        // Load users
        await loadUsers();

        // Load chatbot config
        await loadChatbotConfig();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Show error notification
    }
};

// Load messages
const loadMessages = async () => {
    try {
        const { data: messages, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        const container = document.getElementById('messagesContainer');
        container.innerHTML = messages.map(msg => `
            <div class="message-item">
                <div class="message-header">
                    <span class="message-user">${msg.user_id}</span>
                    <span class="message-time">${new Date(msg.created_at).toLocaleString()}</span>
                </div>
                <div class="message-content">${msg.content}</div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading messages:', error);
    }
};

// Load users
const loadUsers = async () => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('last_active', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.username}</td>
                <td>${new Date(user.last_active).toLocaleString()}</td>
                <td>${user.message_count}</td>
                <td>
                    <span class="status-badge ${user.status.toLowerCase()}">
                        ${user.status}
                    </span>
                </td>
                <td>
                    <button class="btn-icon" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteUser(${user.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading users:', error);
    }
};

// Load chatbot config
const loadChatbotConfig = async () => {
    try {
        const { data: config, error } = await supabase
            .from('chatbot_config')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('configTableBody');
        tbody.innerHTML = config.map(item => `
            <tr>
                <td>${item.keyword}</td>
                <td>${item.response}</td>
                <td>
                    <button class="btn-icon" onclick="editConfig(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteConfig(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading chatbot config:', error);
    }
};

// Set up real-time listeners
const setupRealtimeListeners = () => {
    const messageChannel = supabase
        .channel('public:messages')
        .on('INSERT', payload => {
            // Update message count
            const totalMessages = document.getElementById('totalMessages');
            totalMessages.textContent = parseInt(totalMessages.textContent) + 1;
            
            // Update message list if messages panel is active
            if (document.getElementById('messagesPanel').classList.contains('active')) {
                loadMessages();
            }
        })
        .subscribe();
};

// Analytics Functions
const initAnalytics = () => {
    // User Engagement Chart
    const engagementCtx = document.getElementById('engagementChart').getContext('2d');
    new Chart(engagementCtx, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
            datasets: [{
                label: 'Active Users',
                data: [30, 25, 35, 50, 45, 40],
                borderColor: '#00ff7f',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                y: { ticks: { color: '#ffffff' } },
                x: { ticks: { color: '#ffffff' } }
            }
        }
    });

    // Response Times Chart
    const responseTimesCtx = document.getElementById('responseTimesChart').getContext('2d');
    new Chart(responseTimesCtx, {
        type: 'bar',
        data: {
            labels: ['<1s', '1-2s', '2-3s', '3-4s', '>4s'],
            datasets: [{
                label: 'Response Time Distribution',
                data: [40, 30, 20, 5, 5],
                backgroundColor: '#9b4dca'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                y: { ticks: { color: '#ffffff' } },
                x: { ticks: { color: '#ffffff' } }
            }
        }
    });

    // Popular Topics Chart
    const topicsCtx = document.getElementById('topicsChart').getContext('2d');
    new Chart(topicsCtx, {
        type: 'radar',
        data: {
            labels: ['Support', 'Sales', 'Technical', 'General', 'Feedback'],
            datasets: [{
                label: 'Topic Distribution',
                data: [80, 60, 70, 50, 40],
                backgroundColor: 'rgba(0, 255, 127, 0.2)',
                borderColor: '#00ff7f'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                r: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: { color: '#ffffff' }
                }
            }
        }
    });

    // User Satisfaction Chart
    const satisfactionCtx = document.getElementById('satisfactionChart').getContext('2d');
    new Chart(satisfactionCtx, {
        type: 'doughnut',
        data: {
            labels: ['Very Satisfied', 'Satisfied', 'Neutral', 'Unsatisfied'],
            datasets: [{
                data: [40, 35, 15, 10],
                backgroundColor: ['#00ff7f', '#9b4dca', '#ffd700', '#ff6b6b']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#ffffff' }
                }
            }
        }
    });
};

// Broadcast Functions
window.newBroadcast = () => {
    document.querySelector('.broadcast-form').style.display = 'block';
};

window.sendBroadcast = async () => {
    const target = document.getElementById('broadcastTarget').value;
    const type = document.getElementById('messageType').value;
    const message = document.getElementById('broadcastMessage').value;
    const scheduleTime = document.getElementById('scheduleTime').value;

    try {
        const { data, error } = await supabase
            .from('broadcasts')
            .insert([{
                target,
                type,
                message,
                schedule_time: scheduleTime,
                status: scheduleTime ? 'scheduled' : 'sent',
                created_at: new Date().toISOString()
            }]);

        if (error) throw error;

        // Show success message
        alert('Broadcast sent successfully!');
        
        // Refresh broadcast history
        loadBroadcastHistory();
        
        // Clear form
        document.getElementById('broadcastMessage').value = '';
        document.getElementById('scheduleTime').value = '';
        
    } catch (error) {
        console.error('Error sending broadcast:', error);
        alert('Failed to send broadcast. Please try again.');
    }
};

const loadBroadcastHistory = async () => {
    try {
        const { data: broadcasts, error } = await supabase
            .from('broadcasts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('broadcastHistory');
        tbody.innerHTML = broadcasts.map(broadcast => `
            <tr>
                <td>${new Date(broadcast.created_at).toLocaleString()}</td>
                <td>${broadcast.type}</td>
                <td>${broadcast.target}</td>
                <td>${broadcast.message}</td>
                <td>
                    <span class="status-badge ${broadcast.status.toLowerCase()}">
                        ${broadcast.status}
                    </span>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading broadcast history:', error);
    }
};

// Export Functions
window.exportAnalytics = async (format) => {
    try {
        const { data, error } = await supabase
            .from('analytics')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (format === 'pdf') {
            // Generate PDF report
            const doc = new jsPDF();
            doc.text('Analytics Report', 10, 10);
            // Add charts and data
            doc.save('analytics-report.pdf');
        } else if (format === 'csv') {
            // Generate CSV
            const csv = Papa.unparse(data);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'analytics-report.csv';
            a.click();
        }
    } catch (error) {
        console.error('Error exporting analytics:', error);
        alert('Failed to export analytics. Please try again.');
    }
};

// Handle navigation
document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active menu item
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Show corresponding panel
            const panels = document.querySelectorAll('.admin-panel');
            panels.forEach(p => p.classList.remove('active'));
            const targetPanel = document.getElementById(`${item.dataset.panel}Panel`);
            targetPanel.classList.add('active');
        });
    });

    // Handle logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('admin_session');
        window.location.href = 'admin-login.html';
    });

    // Initialize dashboard
    initDashboard();
    
    // Initialize analytics
    initAnalytics();
    
    // Load broadcast history
    loadBroadcastHistory();
    
    // Set up analytics refresh interval
    setInterval(() => {
        if (document.getElementById('analyticsPanel').classList.contains('active')) {
            initAnalytics();
        }
    }, 300000); // Refresh every 5 minutes
});
