import supabase from './supabase.js';
import { createI18n } from 'vue-i18n';
import myTranslations from './src/locales/my.json';
import { sevenDragonService } from './src/services/sevenDragonService';
import { CONTENT_TYPES } from './src/config/sevenDragon';

// Initialize i18n
const i18n = createI18n({
  locale: 'my', // Set Myanmar as default
  fallbackLocale: 'en',
  messages: {
    my: myTranslations
  }
});

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
    
    // Initialize support dashboard
    initSupportDashboard();
    
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

// Support Dashboard Functions
const initSupportDashboard = async () => {
    // Initialize support staff status
    const { data: staffData } = await supabase
        .from('support_staff')
        .select('*')
        .eq('user_id', supabase.auth.user().id)
        .single();

    if (staffData) {
        document.getElementById('toggleSupportStatus').innerHTML = `
            <i class="fas fa-toggle-${staffData.status === 'online' ? 'on' : 'off'}"></i>
            <span>${staffData.status === 'online' ? 'Online' : 'Offline'}</span>
        `;
    }

    // Initialize language selector
    const languageSelector = document.getElementById('supportLanguage');
    languageSelector.value = i18n.locale;
    languageSelector.addEventListener('change', (e) => {
        i18n.locale = e.target.value;
    });

    // Initialize metrics
    await updateSupportMetrics();

    // Initialize emergency queue
    await loadEmergencyQueue();

    // Initialize active chats
    await loadActiveChats();

    // Set up real-time subscriptions
    setupSupportRealtimeListeners();
};

const updateSupportMetrics = async () => {
    const { data: metrics } = await supabase
        .rpc('get_support_metrics');

    if (metrics) {
        document.getElementById('activeChatsCount').textContent = metrics.active_chats;
        document.getElementById('pendingAlertsCount').textContent = metrics.pending_alerts;
        document.getElementById('avgResponseTime').textContent = `${metrics.avg_response_time}s`;
    }
};

const loadEmergencyQueue = async () => {
    const { data: alerts } = await supabase
        .from('support_alerts')
        .select('*')
        .in('status', ['pending', 'assigned'])
        .order('created_at', { ascending: false });

    const emergencyList = document.getElementById('emergencyList');
    emergencyList.innerHTML = alerts?.map(alert => `
        <div class="alert-item ${alert.type}">
            <div class="alert-info">
                <span class="alert-type">${i18n.t(`chat.support.alerts.${alert.type}`)}</span>
                <span class="alert-time">${new Date(alert.created_at).toLocaleTimeString()}</span>
            </div>
            <div class="alert-actions">
                <button onclick="handleAlert('${alert.id}', 'accept')" class="btn-primary">
                    ${i18n.t('chat.support.actions.accept')}
                </button>
            </div>
        </div>
    `).join('') || '';
};

const loadActiveChats = async () => {
    const { data: chats } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    const chatsList = document.getElementById('activeChatsList');
    chatsList.innerHTML = chats?.map(chat => `
        <div class="chat-item" onclick="selectChat('${chat.id}')">
            <div class="chat-info">
                <span class="chat-name">User ${chat.user_id.slice(0, 8)}</span>
                <span class="chat-preview">${chat.last_message || ''}</span>
            </div>
        </div>
    `).join('') || '';
};

const setupSupportRealtimeListeners = () => {
    const supportChannel = supabase
        .channel('support_updates')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'support_alerts' 
        }, () => {
            loadEmergencyQueue();
            updateSupportMetrics();
        })
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'chat_sessions' 
        }, () => {
            loadActiveChats();
            updateSupportMetrics();
        })
        .subscribe();

    return () => {
        supabase.removeChannel(supportChannel);
    };
};

// Chat Interface Functions
const selectChat = async (chatId) => {
    const chatMessages = document.getElementById('chatMessages');
    const currentChatUser = document.getElementById('currentChatUser');
    
    // Load chat history
    const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

    currentChatUser.textContent = `Chat ${chatId.slice(0, 8)}`;
    chatMessages.innerHTML = messages?.map(msg => `
        <div class="message ${msg.sender_type}">
            <div class="message-content">${msg.content}</div>
            <div class="message-time">${new Date(msg.created_at).toLocaleTimeString()}</div>
        </div>
    `).join('') || '';

    // Set up message input
    const messageInput = document.getElementById('messageInput');
    const sendMessage = document.getElementById('sendMessage');

    sendMessage.onclick = async () => {
        if (!messageInput.value.trim()) return;

        await supabase
            .from('chat_messages')
            .insert({
                chat_id: chatId,
                content: messageInput.value,
                sender_type: 'support'
            });

        messageInput.value = '';
    };
};

// Export chat transcript
const exportChatTranscript = async (chatId, format = 'pdf') => {
    try {
        const response = await fetch(`/api/support/export/${format}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ chatId })
        });

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-transcript-${chatId}-${new Date().toISOString()}.${format}`;
        a.click();
    } catch (error) {
        console.error('Failed to export chat transcript:', error);
    }
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

// Landing Page Management Functions
const loadLandingPageContent = async () => {
    try {
        const { data: content, error } = await supabase
            .from('landing_page_content')
            .select('*')
            .order('priority', { ascending: true });

        if (error) throw error;

        // Group content by section
        const marketing = content.filter(item => item.section === 'marketing');
        const promotions = content.filter(item => item.section === 'promotion');
        const games = content.filter(item => item.section === 'games');

        // Render each section
        document.getElementById('marketingItems').innerHTML = renderContentItems(marketing);
        document.getElementById('promotionItems').innerHTML = renderContentItems(promotions);
        document.getElementById('gameItems').innerHTML = renderContentItems(games);

    } catch (error) {
        console.error('Error loading landing page content:', error);
        alert('Failed to load content. Please try again.');
    }
};

const renderContentItems = (items) => {
    return items.map(item => `
        <div class="content-item ${item.status}" data-id="${item.id}">
            <div class="content-preview">
                ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}">` : ''}
                <div class="content-info">
                    <h4>${item.title}</h4>
                    <p>${item.description || ''}</p>
                    ${item.link_url ? `<a href="${item.link_url}" target="_blank">${item.link_url}</a>` : ''}
                </div>
            </div>
            <div class="content-actions">
                <button onclick="editContent('${item.id}')" class="btn-icon">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteContent('${item.id}')" class="btn-icon">
                    <i class="fas fa-trash"></i>
                </button>
                <button onclick="toggleContentStatus('${item.id}')" class="btn-icon">
                    <i class="fas fa-${item.status === 'active' ? 'eye' : 'eye-slash'}"></i>
                </button>
            </div>
        </div>
    `).join('');
};

const addNewContent = () => {
    const modal = document.getElementById('contentEditorModal');
    const form = document.getElementById('contentForm');
    const section = document.getElementById('contentSection').value;
    
    // Reset form
    form.reset();
    document.getElementById('modalTitle').textContent = 'Add New Content';
    form.dataset.mode = 'add';
    form.dataset.section = section;
    
    modal.style.display = 'block';
};

const editContent = async (id) => {
    try {
        const { data: content, error } = await supabase
            .from('landing_page_content')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        const modal = document.getElementById('contentEditorModal');
        const form = document.getElementById('contentForm');

        // Fill form with content data
        document.getElementById('contentTitle').value = content.title;
        document.getElementById('contentDescription').value = content.description || '';
        document.getElementById('contentLink').value = content.link_url || '';
        document.getElementById('contentStatus').value = content.status;
        document.getElementById('startDate').value = content.start_date || '';
        document.getElementById('endDate').value = content.end_date || '';

        // Show image preview if exists
        if (content.image_url) {
            document.getElementById('imagePreview').innerHTML = `
                <img src="${content.image_url}" alt="Preview">
            `;
        }

        form.dataset.mode = 'edit';
        form.dataset.id = id;
        modal.style.display = 'block';

    } catch (error) {
        console.error('Error loading content:', error);
        alert('Failed to load content. Please try again.');
    }
};

const saveContent = async () => {
    const form = document.getElementById('contentForm');
    const mode = form.dataset.mode;
    const id = form.dataset.id;

    try {
        const contentData = {
            title: document.getElementById('contentTitle').value,
            description: document.getElementById('contentDescription').value,
            link_url: document.getElementById('contentLink').value,
            status: document.getElementById('contentStatus').value,
            start_date: document.getElementById('startDate').value || null,
            end_date: document.getElementById('endDate').value || null,
            section: mode === 'add' ? form.dataset.section : undefined
        };

        // Handle image upload
        const imageFile = document.getElementById('imageUpload').files[0];
        if (imageFile) {
            const { data: imageData, error: uploadError } = await supabase.storage
                .from('landing-page-images')
                .upload(`${Date.now()}-${imageFile.name}`, imageFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('landing-page-images')
                .getPublicUrl(imageData.path);

            contentData.image_url = publicUrl;
        }

        let error;
        if (mode === 'add') {
            const { error: insertError } = await supabase
                .from('landing_page_content')
                .insert([contentData]);
            error = insertError;
        } else {
            const { error: updateError } = await supabase
                .from('landing_page_content')
                .update(contentData)
                .eq('id', id);
            error = updateError;
        }

        if (error) throw error;

        // Update 7Dragon Landing Page
        await updateSevenDragonContent(contentData);

        closeModal();
        loadLandingPageContent();
        alert(`Content ${mode === 'add' ? 'added' : 'updated'} successfully!`);

    } catch (error) {
        console.error('Error saving content:', error);
        alert('Failed to save content. Please try again.');
    }
};

// Update 7Dragon Landing Page content
const updateSevenDragonContent = async (contentData) => {
    try {
        const section = contentData.section;
        let updateFunction;

        switch (section) {
            case CONTENT_TYPES.MARKETING:
                updateFunction = sevenDragonService.updateContent;
                break;
            case CONTENT_TYPES.PROMOTION:
                updateFunction = sevenDragonService.updatePromotion;
                break;
            case CONTENT_TYPES.GAME:
                updateFunction = sevenDragonService.updateGame;
                break;
            default:
                throw new Error('Invalid content type');
        }

        await updateFunction(section, contentData);
        
        // Trigger deployment after content update
        await sevenDragonService.triggerDeploy();
        
    } catch (error) {
        console.error('Error updating 7Dragon content:', error);
        throw error;
    }
};

const deleteContent = async (id) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
        const { error } = await supabase
            .from('landing_page_content')
            .delete()
            .eq('id', id);

        if (error) throw error;

        loadLandingPageContent();
        alert('Content deleted successfully!');

    } catch (error) {
        console.error('Error deleting content:', error);
        alert('Failed to delete content. Please try again.');
    }
};

const toggleContentStatus = async (id) => {
    try {
        const { data: content, error: fetchError } = await supabase
            .from('landing_page_content')
            .select('status')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        const newStatus = content.status === 'active' ? 'inactive' : 'active';

        const { error: updateError } = await supabase
            .from('landing_page_content')
            .update({ status: newStatus })
            .eq('id', id);

        if (updateError) throw updateError;

        loadLandingPageContent();

    } catch (error) {
        console.error('Error toggling content status:', error);
        alert('Failed to update content status. Please try again.');
    }
};

const closeModal = () => {
    document.getElementById('contentEditorModal').style.display = 'none';
    document.getElementById('contentForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
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
    
    // Load landing page content
    loadLandingPageContent();
    
    // Load broadcast history
    loadBroadcastHistory();
    
    // Set up analytics refresh interval
    setInterval(() => {
        if (document.getElementById('analyticsPanel').classList.contains('active')) {
            initAnalytics();
        }
    }, 300000); // Refresh every 5 minutes
});
