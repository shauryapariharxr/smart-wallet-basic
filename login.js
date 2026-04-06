/**
 * Login System for Smart Expense Tracker
 * Handles user authentication using localStorage
 */

// ============================================
// Storage Keys
// ============================================
const AUTH_KEYS = {
    USERS: 'expense_tracker_users',
    CURRENT_USER: 'expense_tracker_current_user',
    REMEMBER_ME: 'expense_tracker_remember_me'
};

// ============================================
// User Authentication Manager
// ============================================
const AuthManager = {
    /**
     * Get all registered users
     * @returns {Array} Array of user objects
     */
    getUsers() {
        try {
            const data = localStorage.getItem(AUTH_KEYS.USERS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading users:', error);
            return [];
        }
    },

    /**
     * Save users to localStorage
     * @param {Array} users - Array of user objects
     */
    saveUsers(users) {
        try {
            localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify(users));
        } catch (error) {
            console.error('Error saving users:', error);
        }
    },

    /**
     * Register a new user
     * @param {Object} userData - User data object
     * @returns {Object} Result object with success status and message
     */
    register(userData) {
        const users = this.getUsers();
        
        // Check if email already exists
        if (users.find(u => u.email === userData.email)) {
            return { success: false, message: 'Email already registered. Please sign in.' };
        }

        // Create new user object
        const newUser = {
            id: Date.now().toString(),
            name: userData.name,
            email: userData.email,
            password: this.hashPassword(userData.password),
            createdAt: new Date().toISOString(),
            transactions: [],
            budget: 0
        };

        users.push(newUser);
        this.saveUsers(users);

        return { success: true, message: 'Account created successfully!' };
    },

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} Result object with success status, message, and user data
     */
    login(email, password) {
        const users = this.getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            return { success: false, message: 'Email not found. Please register first.' };
        }

        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: 'Incorrect password. Please try again.' };
        }

        // Set current user session
        this.setCurrentUser(user);

        return { success: true, message: 'Login successful!', user: user };
    },

    /**
     * Logout current user
     */
    logout() {
        localStorage.removeItem(AUTH_KEYS.CURRENT_USER);
        localStorage.removeItem(AUTH_KEYS.REMEMBER_ME);
    },

    /**
     * Get current logged in user
     * @returns {Object|null} Current user object or null
     */
    getCurrentUser() {
        try {
            const data = localStorage.getItem(AUTH_KEYS.CURRENT_USER);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            return null;
        }
    },

    /**
     * Set current user session
     * @param {Object} user - User object
     */
    setCurrentUser(user) {
        const sessionData = {
            id: user.id,
            name: user.name,
            email: user.email,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem(AUTH_KEYS.CURRENT_USER, JSON.stringify(sessionData));
    },

    /**
     * Check if user is logged in
     * @returns {boolean}
     */
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    },

    /**
     * Simple password hashing (for demo purposes)
     * In production, use proper hashing like bcrypt
     * @param {string} password - Plain text password
     * @returns {string} Hashed password
     */
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    },

    /**
     * Update user data (transactions, budget)
     * @param {string} userId - User ID
     * @param {Object} data - Data to update
     */
    updateUserData(userId, data) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...data };
            this.saveUsers(users);
        }
    },

    /**
     * Get user by ID
     * @param {string} userId - User ID
     * @returns {Object|null} User object or null
     */
    getUserById(userId) {
        const users = this.getUsers();
        return users.find(u => u.id === userId) || null;
    }
};

// ============================================
// Toast Notification System
// ============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============================================
// Form View Management
// ============================================
function showLogin() {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('forgotPasswordForm').classList.remove('active');
}

function showRegister() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
    document.getElementById('forgotPasswordForm').classList.remove('active');
}

function showForgotPassword() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('forgotPasswordForm').classList.add('active');
}

// ============================================
// Password Toggle
// ============================================
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.toggle-password i');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.classList.remove('fa-eye');
        button.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        button.classList.remove('fa-eye-slash');
        button.classList.add('fa-eye');
    }
}

// ============================================
// Form Handlers
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    if (AuthManager.isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    // Login Form Handler
    document.getElementById('loginFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Basic validation
        if (!email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        
        // Attempt login
        const result = AuthManager.login(email, password);
        
        if (result.success) {
            if (rememberMe) {
                localStorage.setItem(AUTH_KEYS.REMEMBER_ME, 'true');
            }
            showToast(result.message, 'success');
            
            // Redirect to main app after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showToast(result.message, 'error');
        }
    });

    // Register Form Handler
    document.getElementById('registerFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation
        if (!name || !email || !password || !confirmPassword) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        
        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        
        // Email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }
        
        // Attempt registration
        const result = AuthManager.register({ name, email, password });
        
        if (result.success) {
            showToast(result.message, 'success');
            
            // Clear form and switch to login
            document.getElementById('registerFormElement').reset();
            setTimeout(() => {
                showLogin();
            }, 1500);
        } else {
            showToast(result.message, 'error');
        }
    });

    // Forgot Password Form Handler
    document.getElementById('forgotPasswordFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('forgotEmail').value.trim();
        
        if (!email) {
            showToast('Please enter your email', 'error');
            return;
        }
        
        // Check if email exists
        const users = AuthManager.getUsers();
        const user = users.find(u => u.email === email);
        
        if (user) {
            // In a real app, this would send an email
            // For demo, we'll just show a success message
            showToast('Password reset instructions sent to your email!', 'success');
            document.getElementById('forgotPasswordFormElement').reset();
            setTimeout(() => {
                showLogin();
            }, 2000);
        } else {
            showToast('Email not found. Please check your email or register.', 'error');
        }
    });
});
