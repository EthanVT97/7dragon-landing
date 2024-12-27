import { initChat } from './chat.js';
import { initAdmin } from './admin.js';

// Chat Interface Functions
window.startChat = () => {
    const chatInterface = document.getElementById('chat-interface');
    chatInterface.classList.remove('hidden');
};

window.closeChat = () => {
    const chatInterface = document.getElementById('chat-interface');
    chatInterface.classList.add('hidden');
};

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize chat functionality
    await initChat();

    // Initialize admin panel
    await initAdmin();

    // Add scroll event listener for header
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.style.background = 'rgba(0, 0, 0, 0.9)';
        } else {
            header.style.background = 'rgba(0, 0, 0, 0.8)';
        }
    });

    // Navigation active state
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
});
