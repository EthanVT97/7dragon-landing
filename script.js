import { initChat, startChat } from './chat.js';
import { initAdmin } from './admin.js';

// Language switching functionality
function changeLanguage(lang) {
    document.body.setAttribute('data-lang', lang);
    localStorage.setItem('preferred-language', lang);
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Set initial language
    const savedLang = localStorage.getItem('preferred-language') || 'en';
    changeLanguage(savedLang);

    // Initialize chat functionality
    await initChat();

    // Initialize admin panel
    await initAdmin();

    // Make startChat function available globally
    window.startChat = startChat;
    window.changeLanguage = changeLanguage;
});
