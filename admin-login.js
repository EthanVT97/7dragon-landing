import supabase from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('adminLoginForm');
    const loginError = document.getElementById('loginError');
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');

    // Toggle password visibility
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.querySelector('i').classList.toggle('fa-eye');
        togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
    });

    // Handle login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            // Show loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            submitBtn.disabled = true;

            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .single();

            if (error) throw error;

            if (data) {
                // Store admin session
                const session = {
                    id: data.id,
                    username: data.username,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem('admin_session', JSON.stringify(session));
                
                // Redirect to admin dashboard
                window.location.href = 'admin-dashboard.html';
            } else {
                throw new Error('Invalid credentials');
            }
        } catch (error) {
            loginError.textContent = error.message || 'Login failed. Please try again.';
            loginError.style.display = 'block';
            
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;

            // Hide error after 3 seconds
            setTimeout(() => {
                loginError.style.display = 'none';
            }, 3000);
        }
    });
});
