/**
 * Smart Expense Tracker
 * A personal finance management web app for students
 * Uses vanilla JavaScript and localStorage for data persistence
 */

// ============================================
// Authentication Check - Redirect to login if not authenticated
// ============================================
const AUTH_KEYS = {
    USERS: 'expense_tracker_users',
    CURRENT_USER: 'expense_tracker_current_user'
};

/**
 * Check if user is logged in
 * @returns {boolean}
 */
function isLoggedIn() {
    try {
        const data = localStorage.getItem(AUTH_KEYS.CURRENT_USER);
        return data !== null;
    } catch (error) {
        return false;
    }
}

/**
 * Get current logged in user
 * @returns {Object|null}
 */
function getCurrentUser() {
    try {
        const data = localStorage.getItem(AUTH_KEYS.CURRENT_USER);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        return null;
    }
}

/**
 * Get all registered users
 * @returns {Array}
 */
function getUsers() {
    try {
        const data = localStorage.getItem(AUTH_KEYS.USERS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        return [];
    }
}

/**
 * Save users to localStorage
 * @param {Array} users
 */
function saveUsers(users) {
    try {
        localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify(users));
    } catch (error) {
        console.error('Error saving users:', error);
    }
}

/**
 * Update current user's data
 * @param {Object} data - Data to update
 */
function updateCurrentUserData(data) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...data };
        saveUsers(users);
    }
}

/**
 * Logout user
 */
function logout() {
    localStorage.removeItem(AUTH_KEYS.CURRENT_USER);
    window.location.href = 'login.html';
}

// Redirect to login if not authenticated
if (!isLoggedIn()) {
    window.location.href = 'login.html';
}

// ============================================
// Storage Manager - Handles all localStorage operations
// ============================================
const StorageManager = {
    /**
     * Get current user ID for user-specific storage
     * @returns {string|null}
     */
    getCurrentUserId() {
        const user = getCurrentUser();
        return user ? user.id : null;
    },

    /**
     * Get all transactions from user data
     * @returns {Array} Array of transaction objects
     */
    getTransactions() {
        const currentUser = getCurrentUser();
        if (!currentUser) return [];

        const users = getUsers();
        const user = users.find(u => u.id === currentUser.id);
        return user && user.transactions ? user.transactions : [];
    },

    /**
     * Save transactions to user data
     * @param {Array} transactions - Array of transaction objects
     */
    saveTransactions(transactions) {
        updateCurrentUserData({ transactions });
    },

    /**
     * Get budget from user data
     * @returns {number} Budget amount
     */
    getBudget() {
        const currentUser = getCurrentUser();
        if (!currentUser) return 0;

        const users = getUsers();
        const user = users.find(u => u.id === currentUser.id);
        return user && user.budget ? parseFloat(user.budget) : 0;
    },

    /**
     * Save budget to user data
     * @param {number} amount - Budget amount
     */
    saveBudget(amount) {
        updateCurrentUserData({ budget: amount });
    },

    /**
     * Clear all data for current user
     */
    clearAll() {
        updateCurrentUserData({ transactions: [], budget: 0 });
    }
};

// ============================================
// Display User Info
// ============================================
function displayUserInfo() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = currentUser.name || currentUser.email;
        }
    }
}

// ============================================
// Global State
// ============================================
let transactions = [];
let monthlyBudget = 0;
let categoryChart = null;

// ============================================
// Category Icons Mapping
// ============================================
const categoryIcons = {
    'Food': '🍔',
    'Transport': '🚌',
    'Education': '📚',
    'Entertainment': '🎮',
    'Housing': '🏠',
    'Health': '💊',
    'Shopping': '🛍️',
    'Other': '📦'
};

// ============================================
// Utility Functions
// ============================================

/**
 * Format number as currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Generate unique ID
 * @returns {string} Timestamp-based ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ============================================
// Toast Notifications
// ============================================

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: 'success', 'error', 'info'
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// View Navigation
// ============================================

/**
 * Switch between views (SPA navigation)
 * @param {string} viewName - Name of view to show
 */
function switchView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    document.getElementById(viewName).classList.add('active');
    
    // Update sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });
    
    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
    
    // Refresh view-specific content
    if (viewName === 'dashboard') {
        renderDashboard();
    } else if (viewName === 'history') {
        renderHistory();
    } else if (viewName === 'budget') {
        checkBudget();
    }
}

// ============================================
// Dashboard Functions
// ============================================

/**
 * Render dashboard with summary cards and recent transactions
 */
function renderDashboard() {
    // Calculate totals
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expenses;
    
    // Update summary cards
    document.getElementById('totalIncome').textContent = formatCurrency(income);
    document.getElementById('totalExpenses').textContent = formatCurrency(expenses);
    document.getElementById('currentBalance').textContent = formatCurrency(balance);
    
    // Render recent transactions (last 5)
    renderRecentTransactions();
    
    // Render chart
    renderChart();
    
    // Check budget
    checkBudget();
}

/**
 * Render recent transactions in dashboard
 */
function renderRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No transactions yet. Add your first transaction!</p>
            </div>
        `;
        return;
    }
    
    // Sort by date descending and take last 5
    const recent = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    container.innerHTML = recent.map(t => `
        <div class="transaction-item ${t.type}">
            <div class="transaction-info">
                <div class="transaction-category">${categoryIcons[t.category] || '📦'} ${t.category}</div>
                <div class="transaction-description">${t.description}</div>
                <div class="transaction-date">${formatDate(t.date)}</div>
            </div>
            <div class="transaction-amount">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</div>
        </div>
    `).join('');
}

// ============================================
// Chart Functions
// ============================================

/**
 * Render category breakdown chart
 */
function renderChart() {
    const ctx = document.getElementById('categoryChart');
    const emptyState = document.getElementById('chartEmptyState');
    
    // Filter only expenses
    const expenses = transactions.filter(t => t.type === 'expense');
    
    if (expenses.length === 0) {
        ctx.classList.add('hidden');
        emptyState.classList.remove('hidden');
        if (categoryChart) {
            categoryChart.destroy();
            categoryChart = null;
        }
        return;
    }
    
    ctx.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    // Group by category
    const categoryTotals = {};
    expenses.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    
    const labels = Object.keys(categoryTotals).map(cat => `${categoryIcons[cat] || '📦'} ${cat}`);
    const data = Object.values(categoryTotals);
    
    // Chart colors
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#C9CBCF', '#7CFC00'
    ];
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            family: 'Poppins',
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// Transaction Form Functions
// ============================================

/**
 * Validate transaction form
 * @returns {Object|null} Validated data or null if invalid
 */
function validateTransactionForm() {
    const form = document.getElementById('transactionForm');
    const formData = new FormData(form);
    
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    
    let isValid = true;
    const data = {};
    
    // Type validation
    const type = formData.get('type');
    if (!type) {
        isValid = false;
    } else {
        data.type = type;
    }
    
    // Amount validation
    const amount = parseFloat(formData.get('amount'));
    if (!amount || amount <= 0) {
        document.getElementById('amountError').textContent = 'Please enter a valid amount greater than 0';
        document.getElementById('amount').classList.add('error');
        isValid = false;
    } else {
        data.amount = amount;
    }
    
    // Category validation
    const category = formData.get('category');
    if (!category) {
        document.getElementById('categoryError').textContent = 'Please select a category';
        document.getElementById('category').classList.add('error');
        isValid = false;
    } else {
        data.category = category;
    }
    
    // Description validation
    const description = formData.get('description')?.trim();
    if (!description) {
        document.getElementById('descriptionError').textContent = 'Please enter a description';
        document.getElementById('description').classList.add('error');
        isValid = false;
    } else {
        data.description = description;
    }
    
    // Date validation
    const date = formData.get('date');
    if (!date) {
        document.getElementById('dateError').textContent = 'Please select a date';
        document.getElementById('date').classList.add('error');
        isValid = false;
    } else {
        data.date = date;
    }
    
    return isValid ? data : null;
}

/**
 * Add new transaction
 * @param {Event} e - Form submit event
 */
function addTransaction(e) {
    e.preventDefault();
    
    const data = validateTransactionForm();
    if (!data) return;
    
    // Create transaction object
    const transaction = {
        id: generateId(),
        ...data,
        createdAt: new Date().toISOString()
    };
    
    // Add to array
    transactions.push(transaction);
    
    // Save to localStorage
    StorageManager.saveTransactions(transactions);
    
    // Show success message
    showToast('Transaction added successfully!', 'success');
    
    // Reset form
    document.getElementById('transactionForm').reset();
    document.getElementById('date').valueAsDate = new Date();
    
    // Refresh dashboard
    renderDashboard();
}

// ============================================
// History Functions
// ============================================

/**
 * Render transaction history with filters
 */
function renderHistory() {
    const container = document.getElementById('transactionList');
    
    // Get filter values
    const categoryFilter = document.getElementById('filterCategory').value;
    const typeFilter = document.getElementById('filterType').value;
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;
    
    // Filter transactions
    let filtered = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (categoryFilter) {
        filtered = filtered.filter(t => t.category === categoryFilter);
    }
    
    if (typeFilter) {
        filtered = filtered.filter(t => t.type === typeFilter);
    }
    
    if (dateFrom) {
        filtered = filtered.filter(t => t.date >= dateFrom);
    }
    
    if (dateTo) {
        filtered = filtered.filter(t => t.date <= dateTo);
    }
    
    // Render
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No transactions found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(t => `
        <div class="transaction-item ${t.type}">
            <div class="transaction-info">
                <div class="transaction-category">${categoryIcons[t.category] || '📦'} ${t.category}</div>
                <div class="transaction-description">${t.description}</div>
                <div class="transaction-date">${formatDate(t.date)}</div>
            </div>
            <div class="transaction-amount">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</div>
            <div class="transaction-actions">
                <button class="btn btn-danger btn-sm" onclick="deleteTransaction('${t.id}')">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Delete transaction
 * @param {string} id - Transaction ID
 */
function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    transactions = transactions.filter(t => t.id !== id);
    StorageManager.saveTransactions(transactions);
    
    showToast('Transaction deleted successfully!', 'success');
    
    renderHistory();
    renderDashboard();
}

/**
 * Clear all filters
 */
function clearFilters() {
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    renderHistory();
}

// ============================================
// Budget Functions
// ============================================

/**
 * Set monthly budget
 * @param {Event} e - Form submit event
 */
function setBudget(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('budgetAmount').value);
    
    if (!amount || amount < 0) {
        showToast('Please enter a valid budget amount', 'error');
        return;
    }
    
    monthlyBudget = amount;
    StorageManager.saveBudget(monthlyBudget);
    
    showToast('Budget set successfully!', 'success');
    checkBudget();
}

/**
 * Check budget status and update UI
 */
function checkBudget() {
    // Load budget from storage
    monthlyBudget = StorageManager.getBudget();
    
    // Update budget input
    document.getElementById('budgetAmount').value = monthlyBudget || '';
    
    // Calculate expenses
    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const remaining = monthlyBudget - expenses;
    const percentage = monthlyBudget > 0 ? (expenses / monthlyBudget) * 100 : 0;
    
    // Update UI
    document.getElementById('budgetTotal').textContent = formatCurrency(monthlyBudget);
    document.getElementById('budgetExpenses').textContent = formatCurrency(expenses);
    document.getElementById('budgetRemaining').textContent = formatCurrency(remaining);
    document.getElementById('budgetPercentage').textContent = percentage.toFixed(1) + '%';
    
    // Update progress bar
    const progressFill = document.getElementById('budgetProgressFill');
    const progressBar = document.getElementById('budgetProgressBar');
    const clampedPercentage = Math.min(percentage, 100);
    
    progressFill.style.width = clampedPercentage + '%';
    
    // Update progress bar color
    progressFill.classList.remove('warning', 'danger');
    if (percentage >= 100) {
        progressFill.classList.add('danger');
    } else if (percentage >= 80) {
        progressFill.classList.add('warning');
    }
    
    // Update message
    const messageEl = document.getElementById('budgetMessage');
    if (monthlyBudget === 0) {
        messageEl.textContent = 'Set a budget to start tracking';
        messageEl.className = 'progress-message';
    } else if (percentage >= 100) {
        messageEl.textContent = '⚠️ You have exceeded your budget!';
        messageEl.className = 'progress-message text-danger';
    } else if (percentage >= 80) {
        messageEl.textContent = '⚠️ You are close to your budget limit';
        messageEl.className = 'progress-message text-warning';
    } else {
        messageEl.textContent = '✅ You are within budget';
        messageEl.className = 'progress-message text-success';
    }
    
    // Show/hide warning banner
    const warningBanner = document.getElementById('budgetWarning');
    if (percentage >= 80 && monthlyBudget > 0) {
        warningBanner.classList.remove('hidden');
    } else {
        warningBanner.classList.add('hidden');
    }
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize the application
 */
function init() {
    // Display current user info
    displayUserInfo();
    
    // Load data from localStorage
    transactions = StorageManager.getTransactions();
    monthlyBudget = StorageManager.getBudget();
    
    // Set today's date as default
    document.getElementById('date').valueAsDate = new Date();
    
    // Event Listeners
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });
    
    // Mobile menu
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('open');
        document.getElementById('overlay').classList.add('active');
    });
    
    document.getElementById('closeSidebar').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('active');
    });
    
    document.getElementById('overlay').addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('active');
    });
    
    // Forms
    document.getElementById('transactionForm').addEventListener('submit', addTransaction);
    document.getElementById('budgetForm').addEventListener('submit', setBudget);
    
    // Filter change listeners
    document.getElementById('filterCategory').addEventListener('change', renderHistory);
    document.getElementById('filterType').addEventListener('change', renderHistory);
    document.getElementById('filterDateFrom').addEventListener('change', renderHistory);
    document.getElementById('filterDateTo').addEventListener('change', renderHistory);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    
    // Initial render
    renderDashboard();
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
