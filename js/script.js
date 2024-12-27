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
    gamePassword: null
};

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
    const adminNotification = {
        type: "new_user_request",
        timestamp: new Date().toISOString(),
        source: window.location.href
    };
    
    // Send notification to admin (replace with actual API call)
    try {
        const response = await fetch('https://github.com/EthanVT97/chat18k', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(adminNotification)
        });
        
        addMessage("bot", {
            my: "Admin ထံသို့ အကြောင်းကြားပြီးပါပြီ။ ကျေးဇူးပြု၍ ခဏစောင့်ပါ။",
            en: "We've notified our admin. Please wait for assistance."
        });
        
        // Add contact information
        addMessage("bot", {
            my: "သင့်အား ပိုမိုကောင်းမွန်စွာ ဝန်ဆောင်မှုပေးနိုင်ရန် ဤနေရာတွင် ဆက်သွယ်နိုင်ပါသည်: https://github.com/EthanVT97/chat18k",
            en: "For better assistance, you can reach us at: https://github.com/EthanVT97/chat18k"
        });
    } catch (error) {
        console.error('Error notifying admin:', error);
        addMessage("bot", {
            my: "ဝန်ဆောင်မှုတွင် ပြဿနာရှိနေပါသည်။ နောက်မှ ထပ်စမ်းကြည့်ပါ။",
            en: "There was an issue with the service. Please try again later."
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
