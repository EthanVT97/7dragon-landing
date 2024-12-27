// Loading Screen
document.addEventListener('DOMContentLoaded', function() {
    const loadingScreen = document.getElementById('loadingScreen');
    
    // Hide loading screen after all content is loaded
    window.addEventListener('load', function() {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 1000);
    });
});

// Language Switcher
document.addEventListener('DOMContentLoaded', function() {
    const langButtons = document.querySelectorAll('.lang-btn');
    
    langButtons.forEach(button => {
        button.addEventListener('click', () => {
            const lang = button.getAttribute('data-lang');
            document.body.classList.remove('my', 'en');
            document.body.classList.add(lang);
            
            // Update active button
            langButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
});

// Chat State Management
let chatState = {
    isAuthenticated: false,
    username: null,
    gameId: null,
    gamePassword: null,
    supportStatus: 'offline', // online, offline, or away
    lastActivity: null
};

// Support Schedule (24-hour format, UTC+6:30)
const supportHours = {
    start: 9, // 9:00 AM
    end: 21   // 9:00 PM
};

// Check if support is available based on current time
function isSupportAvailable() {
    const now = new Date();
    const hour = now.getHours();
    return hour >= supportHours.start && hour < supportHours.end;
}

// Update support status every minute
setInterval(updateSupportStatus, 60000);

function updateSupportStatus() {
    const wasOnline = chatState.supportStatus === 'online';
    chatState.supportStatus = isSupportAvailable() ? 'online' : 'offline';
    
    // Update status indicator
    const statusIndicator = document.getElementById('supportStatus');
    if (statusIndicator) {
        statusIndicator.className = `status-indicator ${chatState.supportStatus}`;
        statusIndicator.setAttribute('data-status', chatState.supportStatus);
    }
    
    // Notify user if support status changes
    if (wasOnline !== (chatState.supportStatus === 'online')) {
        const statusMessage = {
            online: {
                my: "ဝန်ဆောင်မှု အွန်လိုင်းရောက်ရှိနေပါပြီ။ မည်သို့ကူညီပေးရမလဲ?",
                en: "Support is now online. How can we help you?"
            },
            offline: {
                my: "ဝန်ဆောင်မှု အော့ဖ်လိုင်းဖြစ်နေပါသည်။ နောက်မှ ပြန်လည်ဆက်သွယ်ပါ။",
                en: "Support is now offline. Please try again later."
            }
        };
        
        if (chatInitialized) {
            addMessage("bot", statusMessage[chatState.supportStatus]);
        }
    }
}

// Enhanced Admin Notification System
class AdminNotification {
    constructor() {
        this.pendingNotifications = new Map();
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 5000; // 5 seconds
    }
    
    async notify(type, data) {
        const notificationId = Date.now().toString();
        const notification = {
            id: notificationId,
            type,
            data,
            timestamp: new Date().toISOString(),
            status: 'pending',
            retries: 0
        };
        
        this.pendingNotifications.set(notificationId, notification);
        await this.sendNotification(notification);
        return notificationId;
    }
    
    async sendNotification(notification) {
        try {
            const response = await fetch('https://github.com/EthanVT97/chat18k/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    notification,
                    clientInfo: {
                        userAgent: navigator.userAgent,
                        language: navigator.language,
                        timestamp: new Date().toISOString(),
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            this.handleNotificationSuccess(notification.id, result);
            
        } catch (error) {
            console.error('Error sending notification:', error);
            this.handleNotificationError(notification);
        }
    }
    
    handleNotificationSuccess(notificationId, result) {
        const notification = this.pendingNotifications.get(notificationId);
        if (notification) {
            notification.status = 'sent';
            notification.response = result;
            this.pendingNotifications.delete(notificationId);
            
            // Update UI to show notification was sent
            addMessage("bot", {
                my: "Admin ထံသို့ အကြောင်းကြားပြီးပါပြီ။ အမြန်ဆုံး ပြန်လည်ဆက်သွယ်ပါမည်။",
                en: "Admin has been notified. We'll contact you as soon as possible."
            });
        }
    }
    
    handleNotificationError(notification) {
        if (notification.retries < this.maxRetries) {
            notification.retries++;
            notification.status = 'retrying';
            
            // Exponential backoff
            const delay = this.retryDelay * Math.pow(2, notification.retries - 1);
            
            setTimeout(() => {
                this.sendNotification(notification);
            }, delay);
            
        } else {
            notification.status = 'failed';
            this.pendingNotifications.delete(notification.id);
            
            // Update UI to show notification failed
            addMessage("bot", {
                my: "ဆက်သွယ်မှု မအောင်မြင်ပါ။ ကျေးဇူးပြု၍ ဤနံပါတ်သို့ တိုက်ရိုက်ဆက်သွယ်ပါ: +959123456789",
                en: "Notification failed. Please contact us directly at: +959123456789"
            });
        }
    }
}

const adminNotifier = new AdminNotification();

// Enhanced notifyAdmin function
async function notifyAdmin() {
    const notificationData = {
        type: "new_user_request",
        source: window.location.href,
        supportStatus: chatState.supportStatus,
        userInfo: {
            language: document.body.classList.contains('en') ? 'en' : 'my',
            timestamp: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
    };
    
    // Show immediate feedback
    addMessage("bot", {
        my: "Admin ထံသို့ အကြောင်းကြားနေပါသည်...",
        en: "Notifying admin..."
    });
    
    // Add typing indicator
    const typingIndicator = addTypingIndicator();
    
    try {
        const notificationId = await adminNotifier.notify('new_user', notificationData);
        
        // Remove typing indicator
        typingIndicator.remove();
        
        if (chatState.supportStatus === 'online') {
            addMessage("bot", {
                my: "ကျွန်ုပ်တို့၏ ဝန်ထမ်းများ အွန်လိုင်းရောက်ရှိနေပါသည်။ မကြာမီ ပြန်လည်ဆက်သွယ်ပါမည်။",
                en: "Our support team is online and will assist you shortly."
            });
        } else {
            addMessage("bot", {
                my: `ယခု ဝန်ဆောင်မှု ${chatState.supportStatus === 'offline' ? 'အော့ဖ်လိုင်း' : 'ခဏခွာ'} ဖြစ်နေပါသည်။`,
                en: `Support is currently ${chatState.supportStatus}. Operating hours: ${supportHours.start}:00 AM - ${supportHours.end}:00 PM (MMT)`
            });
        }
        
        // Add contact information
        addMessage("bot", {
            my: "သင့်အား ပိုမိုကောင်းမွန်စွာ ဝန်ဆောင်မှုပေးနိုင်ရန် ဤနေရာတွင် ဆက်သွယ်နိုင်ပါသည်: https://github.com/EthanVT97/chat18k",
            en: "For immediate assistance, you can reach us at: https://github.com/EthanVT97/chat18k"
        });
        
    } catch (error) {
        console.error('Error in notifyAdmin:', error);
        typingIndicator.remove();
        
        addMessage("bot", {
            my: "ဆက်သွယ်မှု မအောင်မြင်ပါ။ ကျေးဇူးပြု၍ နောက်မှ ထပ်စမ်းကြည့်ပါ။",
            en: "There was an issue notifying our team. Please try again later."
        });
    }
}

// Chat functionality
let chatOpen = false;
let unreadMessages = 1;

function toggleChat() {
    const chatContainer = document.getElementById('chatContainer');
    const notificationBadge = document.getElementById('chatNotification');
    chatOpen = !chatOpen;
    chatContainer.style.display = chatOpen ? 'block' : 'none';
    
    if (chatOpen) {
        unreadMessages = 0;
        notificationBadge.style.display = 'none';
        
        if (!chatInitialized) {
            initializeChat();
        }
    }
}

let chatInitialized = false;

function initializeChat() {
    chatInitialized = true;
    
    // Start authentication flow
    addMessage("bot", {
        my: "မင်္ဂလာပါ။ ကျေးဇူးပြု၍ သင့်ရဲ့ Game ID နှင့် Password ကို ပေးပါ။",
        en: "Welcome! Please provide your Game ID and Password."
    });
    
    // Add authentication form
    addAuthenticationForm();
}

function addAuthenticationForm() {
    const messagesContainer = document.getElementById('chatMessages');
    const formDiv = document.createElement('div');
    formDiv.className = 'auth-form';
    formDiv.innerHTML = `
        <input type="text" id="gameId" placeholder="Game ID" class="auth-input">
        <input type="password" id="gamePassword" placeholder="Password" class="auth-input">
        <button onclick="authenticateUser()" class="auth-button">
            <span class="my">အတည်ပြုပါ</span>
            <span class="en">Submit</span>
        </button>
        <button onclick="notifyAdmin()" class="auth-button secondary">
            <span class="my">အကောင့်မရှိပါ</span>
            <span class="en">Don't have an account</span>
        </button>
    `;
    
    messagesContainer.appendChild(formDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function authenticateUser() {
    const gameId = document.getElementById('gameId').value;
    const gamePassword = document.getElementById('gamePassword').value;
    
    if (!gameId || !gamePassword) {
        addMessage("bot", {
            my: "Game ID နှင့် Password ကို ဖြည့်ပေးပါ။",
            en: "Please fill in both Game ID and Password."
        });
        return;
    }
    
    // Simulate authentication (replace with actual authentication)
    chatState.isAuthenticated = true;
    chatState.gameId = gameId;
    chatState.gamePassword = gamePassword;
    
    // Remove authentication form
    const authForm = document.querySelector('.auth-form');
    if (authForm) {
        authForm.remove();
    }
    
    addMessage("bot", {
        my: `ကြိုဆိုပါတယ် ${gameId}! ကျွန်တော်တို့ ဘယ်လိုကူညီပေးရမလဲ?`,
        en: `Welcome ${gameId}! How can we assist you today?`
    });
    
    // Add quick reply buttons for authenticated users
    addQuickReplies([
        { my: "ငွေဖြည့်နည်း", en: "Deposit" },
        { my: "ငွေထုတ်နည်း", en: "Withdraw" },
        { my: "ဂိမ်းဆော့နည်း", en: "How to Play" },
        { my: "အကူအညီ", en: "Help" }
    ]);
}

async function notifyAdmin() {
    const notificationData = {
        type: "new_user_request",
        source: window.location.href,
        supportStatus: chatState.supportStatus,
        userInfo: {
            language: document.body.classList.contains('en') ? 'en' : 'my',
            timestamp: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
    };
    
    // Show immediate feedback
    addMessage("bot", {
        my: "Admin ထံသို့ အကြောင်းကြားနေပါသည်...",
        en: "Notifying admin..."
    });
    
    // Add typing indicator
    const typingIndicator = addTypingIndicator();
    
    try {
        const notificationId = await adminNotifier.notify('new_user', notificationData);
        
        // Remove typing indicator
        typingIndicator.remove();
        
        if (chatState.supportStatus === 'online') {
            addMessage("bot", {
                my: "ကျွန်ုပ်တို့၏ ဝန်ထမ်းများ အွန်လိုင်းရောက်ရှိနေပါသည်။ မကြာမီ ပြန်လည်ဆက်သွယ်ပါမည်။",
                en: "Our support team is online and will assist you shortly."
            });
        } else {
            addMessage("bot", {
                my: `ယခု ဝန်ဆောင်မှု ${chatState.supportStatus === 'offline' ? 'အော့ဖ်လိုင်း' : 'ခဏခွာ'} ဖြစ်နေပါသည်။`,
                en: `Support is currently ${chatState.supportStatus}. Operating hours: ${supportHours.start}:00 AM - ${supportHours.end}:00 PM (MMT)`
            });
        }
        
        // Add contact information
        addMessage("bot", {
            my: "သင့်အား ပိုမိုကောင်းမွန်စွာ ဝန်ဆောင်မှုပေးနိုင်ရန် ဤနေရာတွင် ဆက်သွယ်နိုင်ပါသည်: https://github.com/EthanVT97/chat18k",
            en: "For immediate assistance, you can reach us at: https://github.com/EthanVT97/chat18k"
        });
        
    } catch (error) {
        console.error('Error in notifyAdmin:', error);
        typingIndicator.remove();
        
        addMessage("bot", {
            my: "ဆက်သွယ်မှု မအောင်မြင်ပါ။ ကျေးဇူးပြု၍ နောက်မှ ထပ်စမ်းကြည့်ပါ။",
            en: "There was an issue notifying our team. Please try again later."
        });
    }
}

// Existing functions with emoji support
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (message) {
        // Convert emoji shortcodes to actual emojis
        const messageWithEmojis = convertEmojis(message);
        addMessage("user", messageWithEmojis);
        input.value = '';
        
        handleBotResponse(messageWithEmojis);
    }
}

function convertEmojis(message) {
    const emojiMap = {
        ':)': '😊',
        ':(': '😢',
        ':D': '😃',
        ';)': '😉',
        '<3': '❤️',
        ':p': '😛',
        ':P': '😛',
        'o/': '👋'
    };
    
    return message.replace(/:\)|:\(|:D|;\)|<3|:p|:P|o\//g, match => emojiMap[match]);
}

function handleBotResponse(userMessage) {
    if (!chatState.isAuthenticated) {
        addMessage("bot", {
            my: "ကျေးဇူးပြု၍ ဦးစွာ အကောင့်ဝင်ပါ။",
            en: "Please authenticate first."
        });
        return;
    }
    
    // Add typing indicator
    const typingIndicator = addTypingIndicator();
    
    setTimeout(() => {
        // Remove typing indicator
        typingIndicator.remove();
        
        // Handle different user queries
        if (userMessage.toLowerCase().includes('deposit') || userMessage.toLowerCase().includes('ငွေဖြည့်')) {
            addMessage("bot", {
                my: "ငွေဖြည့်ရန် ကျွန်ုပ်တို့၏ ဝန်ဆောင်မှုဖုန်းနံပါတ်သို့ ဆက်သွယ်ပါ။ 📱",
                en: "Please contact our customer service for deposit information. 📱"
            });
        } else if (userMessage.toLowerCase().includes('withdraw') || userMessage.toLowerCase().includes('ငွေထုတ်')) {
            addMessage("bot", {
                my: "ငွေထုတ်ရန် ကျွန်ုပ်တို့၏ ဝန်ဆောင်မှုဖုန်းနံပါတ်သို့ ဆက်သွယ်ပါ။ 💰",
                en: "Please contact our customer service for withdrawal information. 💰"
            });
        } else {
            addMessage("bot", {
                my: "ကျေးဇူးပြု၍ ခဏစောင့်ပါ။ ကျွန်တော်တို့ရဲ့ ဝန်ထမ်းက အမြန်ဆုံး ပြန်လည်ဖြေကြားပေးပါမယ်။ 🙏",
                en: "Please wait a moment. Our support team will respond to you shortly. 🙏"
            });
        }
    }, 1500);
}

function addTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return typingDiv;
}

function addMessage(type, content) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    if (typeof content === 'object') {
        // For multilingual messages
        messageDiv.innerHTML = `
            <span class="my">${content.my}</span>
            <span class="en">${content.en}</span>
        `;
    } else {
        messageDiv.textContent = content;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addQuickReplies(replies) {
    const messagesContainer = document.getElementById('chatMessages');
    const quickRepliesDiv = document.createElement('div');
    quickRepliesDiv.className = 'quick-replies';
    
    replies.forEach(reply => {
        const button = document.createElement('button');
        button.innerHTML = `
            <span class="my">${reply.my}</span>
            <span class="en">${reply.en}</span>
        `;
        button.onclick = () => handleQuickReply(reply);
        quickRepliesDiv.appendChild(button);
    });
    
    messagesContainer.appendChild(quickRepliesDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function handleQuickReply(reply) {
    // Show user's selection
    addMessage("user", reply.en);
    
    // Simulate bot response
    setTimeout(() => {
        const responses = {
            "How to Play": {
                my: "ဂိမ်းဆော့ရန် https://www.m9asia.com သို့သွားပါ။ Sign Up လုပ်ပြီး ငွေဖြည့်ပါ။",
                en: "Visit https://www.m9asia.com to play. Sign up and make a deposit to start playing."
            },
            "Deposit": {
                my: "ငွေဖြည့်ရန် ကျွန်ုပ်တို့၏ ဝန်ဆောင်မှုဖုန်းနံပါတ်သို့ ဆက်သွယ်ပါ။",
                en: "Please contact our customer service for deposit information."
            },
            "Withdraw": {
                my: "ငွေထုတ်ရန် ကျွန်ုပ်တို့၏ ဝန်ဆောင်မှုဖုန်းနံပါတ်သို့ ဆက်သွယ်ပါ။",
                en: "Please contact our customer service for withdrawal information."
            }
        };
        
        addMessage("bot", responses[reply.en]);
    }, 1000);
}

// Handle enter key in chat input
document.getElementById('messageInput')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
