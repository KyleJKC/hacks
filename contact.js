document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const contactForm = document.getElementById('contact-form');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');
    const contactResult = document.getElementById('contact-result');

    // Check if user is logged in and pre-fill email if available
    const user = JSON.parse(localStorage.getItem('user')) || {};
    if (user.email) {
        emailInput.value = user.email;
    }

    // Form submission handler
    contactForm.addEventListener('submit', handleContactSubmit);

    function handleContactSubmit(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const message = messageInput.value.trim();
        
        // Validate form inputs
        if (!email) {
            showMessage('Please enter your email address.', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address.', 'error');
            return;
        }
        
        if (!message) {
            showMessage('Please enter your message.', 'error');
            return;
        }
        
        // In a real app, this is where you would send the data to a server
        // Since we're not implementing backend yet, we'll just simulate a success
        
        // Simulate network delay
        showMessage('Sending your message...', 'success');
        
        setTimeout(() => {
            // Clear form after successful submission
            messageInput.value = '';
            
            // Show success message
            showMessage('Thank you! We have received your message and will get back to you soon.', 'success');
            
            // In a production environment, you would send the form data to a server here
            console.log('Contact form submitted with:', { email, message });
        }, 1500);
    }

    // Helper function to validate email format
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Helper function to show messages (error or success)
    function showMessage(text, type) {
        contactResult.textContent = text;
        
        if (type === 'error') {
            contactResult.className = 'error-message';
        } else {
            contactResult.className = 'success-message';
        }
        
        contactResult.style.display = 'block';
        
        // Auto-hide error messages after 5 seconds
        if (type === 'error') {
            setTimeout(() => {
                contactResult.style.display = 'none';
            }, 5000);
        }
    }

    // Add navigation link to header if user is logged in
    function addNavToHeader() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (isLoggedIn) {
            // Check if the user info element exists
            if (document.querySelector('.user-info')) {
                return; // Already added
            }
            
            const header = document.querySelector('header');
            const userName = user.name || user.email || 'User';
            
            const userInfoDiv = document.createElement('div');
            userInfoDiv.className = 'user-info';
            
            userInfoDiv.innerHTML = `
                <p>Welcome, ${userName} <a href="index.html" class="nav-link">Home</a> <button id="logout-btn" class="logout-btn">Logout</button></p>
            `;
            
            header.appendChild(userInfoDiv);
            
            // Add logout button event listener
            document.getElementById('logout-btn').addEventListener('click', () => {
                localStorage.removeItem('isLoggedIn');
                window.location.href = 'login.html';
            });
        }
    }
    
    // Initialize header navigation
    addNavToHeader();
}); 