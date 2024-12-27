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

// Chat functionality
let chatOpen = false;
let unreadMessages = 1; // Initial notification

function toggleChat() {
    const chatContainer = document.getElementById('chatContainer');
    const notificationBadge = document.getElementById('chatNotification');
    chatOpen = !chatOpen;
    chatContainer.style.display = chatOpen ? 'block' : 'none';
    
    if (chatOpen) {
        // Clear notifications when chat is opened
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
    addMessage("bot", {
        my: "မင်္ဂလာပါ။ 7Dragon မှ ကြိုဆိုပါတယ်။ ကျွန်တော်တို့ ဘယ်လိုကူညီပေးရမလဲ?",
        en: "Welcome to 7Dragon! How can we assist you today?"
    });
    
    // Add quick reply buttons
    addQuickReplies([
        { my: "ဂိမ်းဆော့နည်း", en: "How to Play" },
        { my: "ငွေဖြည့်နည်း", en: "Deposit" },
        { my: "ငွေထုတ်နည်း", en: "Withdraw" }
    ]);
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

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (message) {
        addMessage("user", message);
        input.value = '';
        
        // Simulate bot response
        setTimeout(() => {
            const responses = {
                my: "ကျေးဇူးပြု၍ ခဏစောင့်ပါ။ ကျွန်တော်တို့ရဲ့ ဝန်ထမ်းက အမြန်ဆုံး ပြန်လည်ဖြေကြားပေးပါမယ်။",
                en: "Please wait a moment. Our support team will respond to you shortly."
            };
            addMessage("bot", responses);
        }, 1000);
    }
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

// Handle enter key in chat input
document.getElementById('messageInput')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
