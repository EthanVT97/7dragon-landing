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

function toggleChat() {
    const chatContainer = document.getElementById('chatContainer');
    chatOpen = !chatOpen;
    chatContainer.style.display = chatOpen ? 'block' : 'none';
    if (chatOpen && !chatInitialized) {
        initializeChat();
    }
}

let chatInitialized = false;

function initializeChat() {
    chatInitialized = true;
    addMessage("bot", {
        my: "မင်္ဂလာပါ။ 7Dragon မှ ကြိုဆိုပါတယ်။ ကျွန်တော်တို့ ဘယ်လိုကူညီပေးရမလဲ?",
        en: "Welcome to 7Dragon! How can we assist you today?"
    });
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
