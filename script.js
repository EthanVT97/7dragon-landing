import supabase from './supabase.js';

// Language handling
const setLanguage = (lang) => {
    document.documentElement.lang = lang;
    document.body.setAttribute('data-lang', lang);
    localStorage.setItem('preferredLanguage', lang);

    // Update language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
};

// Navigation handling
const navigateToSection = (sectionId) => {
    const navLinks = document.querySelectorAll('.nav-menu a');
    const sections = document.querySelectorAll('.section');
    
    // Remove active class from all links and sections
    navLinks.forEach(link => link.classList.remove('active'));
    sections.forEach(section => section.classList.remove('active'));
    
    // Add active class to current section and link
    const targetSection = document.getElementById(sectionId);
    const targetLink = document.querySelector(`.nav-menu a[href="#${sectionId}"]`);
    
    if (targetSection && targetLink) {
        targetSection.classList.add('active');
        targetLink.classList.add('active');
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Initialize language
    const savedLang = localStorage.getItem('preferredLanguage') || 'my';
    setLanguage(savedLang);

    // Language switcher
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            setLanguage(lang);
        });
    });

    // Handle navigation clicks
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            navigateToSection(sectionId);
            history.pushState(null, '', `#${sectionId}`);
        });
    });

    // Handle direct URL access with hash
    const handleHashChange = () => {
        const hash = window.location.hash.substring(1) || 'home';
        navigateToSection(hash);
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Handle initial load
    handleHashChange();

    // Login form handling
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;

                if (data.user) {
                    window.location.href = '/admin-dashboard.html';
                }
            } catch (error) {
                const lang = document.documentElement.lang;
                const errorMessage = lang === 'my' 
                    ? 'အကောင့်ဝင်ရောက်မှု မအောင်မြင်ပါ: ' + error.message
                    : 'Login failed: ' + error.message;
                alert(errorMessage);
            }
        });
    }

    // Initialize chat functionality
    initChat();

    // Initialize admin panel
    initAdmin();

    // Add scroll event listener for header
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.style.background = 'rgba(0, 0, 0, 0.9)';
        } else {
            header.style.background = 'rgba(0, 0, 0, 0.8)';
        }
    });

    // Chat functionality
    let isChatOpen = false;

    window.toggleChat = () => {
        const chatInterface = document.getElementById('chat-interface');
        isChatOpen = !isChatOpen;
        chatInterface.classList.toggle('hidden', !isChatOpen);

        if (isChatOpen) {
            // Add welcome message
            const chatMessages = document.getElementById('chatMessages');
            if (chatMessages.children.length === 0) {
                const lang = document.documentElement.lang;
                const welcomeMessage = lang === 'my'
                    ? 'မင်္ဂလာပါ! ကျွန်ုပ်တို့ သင့်အား မည်သို့ ကူညီပေးရမည်နည်း?'
                    : 'Hello! How can I help you today?';
                addMessage('bot', welcomeMessage);
            }
        }
    };

    window.sendMessage = async () => {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message) return;

        // Add user message
        addMessage('user', message);
        messageInput.value = '';

        try {
            // Send message to Supabase
            const { data, error } = await supabase
                .from('messages')
                .insert([
                    { content: message, type: 'user' }
                ]);

            if (error) throw error;

            // Simulate bot response
            setTimeout(() => {
                const lang = document.documentElement.lang;
                const response = lang === 'my'
                    ? 'သင့်မက်ဆေ့ခ်ျအတွက် ကျေးဇူးတင်ပါသည်။ ကျွန်ုပ်တို့၏ အဖွဲ့မှ မကြာမီ ပြန်လည်တုံ့ပြန်ပါမည်။'
                    : 'Thank you for your message. Our team will respond shortly.';
                addMessage('bot', response);
            }, 1000);

        } catch (error) {
            console.error('Error sending message:', error);
            const lang = document.documentElement.lang;
            const errorMessage = lang === 'my'
                ? 'မက်ဆေ့ခ်ျပို့ရန် မအောင်မြင်ပါ။ ထပ်မံကြိုးစားကြည့်ပါ။'
                : 'Failed to send message. Please try again.';
            addMessage('system', errorMessage);
        }
    };

    const addMessage = (type, content) => {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const iconClass = type === 'bot' ? 'robot' : type === 'user' ? 'user' : 'exclamation-circle';
        
        messageDiv.innerHTML = `
            <div class="message-icon">
                <i class="fas fa-${iconClass}"></i>
            </div>
            <div class="message-content">
                <p>${content}</p>
                <span class="message-time">${new Date().toLocaleTimeString()}</span>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };
});
