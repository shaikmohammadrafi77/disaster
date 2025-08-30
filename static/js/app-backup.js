// Global variables
let currentPeriod = 'today';
let currentData = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadData('today');
});

// Initialize event listeners
function initializeEventListeners() {
    // Period toggle buttons
    const periodButtons = document.querySelectorAll('.btn-period');
    periodButtons.forEach(button => {
        button.addEventListener('click', function() {
            const period = this.dataset.period;
            switchPeriod(period);
        });
    });

    // Form submission enhancement
    const form = document.querySelector('.custom-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            const amount = document.getElementById('waterAmount').value;
            if (!amount || amount <= 0) {
                e.preventDefault();
                showToast('Please enter a valid amount', 'error');
                return;
            }
        });
    }
}

// Set amount in the input field (from quick buttons)
function setAmount(amount) {
    const input = document.getElementById('waterAmount');
    if (input) {
        input.value = amount;
        input.focus();
    }
}

// Switch period and reload data
function switchPeriod(period) {
    currentPeriod = period;
    
    // Update active button
    document.querySelectorAll('.btn-period').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelector(`[data-period="${period}"]`).classList.add('active');
    
    // Update history title
    const titles = {
        'today': "Today's History",
        'week': "This Week's History",
        'month': "This Month's History"
    };
    
    document.getElementById('historyTitle').textContent = titles[period];
    
    // Load new data
    loadData(period);
}

// Load data from the server
async function loadData(period) {
    try {
        const response = await fetch(`/api/entries?period=${period}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();
        currentData = data;
        
        updateProgressCircle(data.goal_progress);
        updateTotalIntake(data.total_intake);
        updateHistory(data.entries);
        
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Failed to load data', 'error');
    }
}

// Update progress circle
function updateProgressCircle(percentage) {
    const circle = document.getElementById('progressCircle');
    const percentageText = document.getElementById('progressPercentage');
    
    if (circle && percentageText) {
        // Update the conic gradient
        const degrees = (percentage / 100) * 360;
        circle.style.background = `conic-gradient(var(--primary-color) ${degrees}deg, var(--gray-200) ${degrees}deg)`;
        
        // Update percentage text
        percentageText.textContent = `${Math.round(percentage)}%`;
        
        // Add animation class
        circle.classList.add('fade-in');
        setTimeout(() => circle.classList.remove('fade-in'), 300);
    }
}

// Update total intake display
function updateTotalIntake(amount) {
    const totalElement = document.getElementById('totalIntake');
    if (totalElement) {
        totalElement.textContent = amount;
        totalElement.classList.add('fade-in');
        setTimeout(() => totalElement.classList.remove('fade-in'), 300);
    }
}

// Update history section
function updateHistory(entries) {
    const historyContent = document.getElementById('historyContent');
    
    if (!historyContent) return;
    
    if (!entries || entries.length === 0) {
        historyContent.innerHTML = `
            <div class="empty-state">
                <i data-feather="droplet" class="empty-icon"></i>
                <p>No water intake logged yet</p>
                <small>Start logging your water intake above!</small>
            </div>
        `;
    } else {
        const historyHTML = entries
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map((entry, index) => `
                <div class="history-item fade-in">
                    <div class="history-info">
                        <div class="history-icon">
                            <i data-feather="droplet"></i>
                        </div>
                        <div class="history-details">
                            <h6>${entry.amount}ml</h6>
                            <small>${formatDateTime(entry.timestamp)}</small>
                        </div>
                    </div>
                    <button class="btn-delete" onclick="deleteEntry(${index})" title="Delete entry">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
            `).join('');
        
        historyContent.innerHTML = historyHTML;
    }
    
    // Re-initialize Feather icons
    feather.replace();
}

// Delete an entry
async function deleteEntry(index) {
    if (!confirm('Are you sure you want to delete this entry?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/delete_entry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ index: index })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Entry deleted successfully', 'success');
            loadData(currentPeriod); // Reload data
        } else {
            showToast(result.message || 'Failed to delete entry', 'error');
        }
        
    } catch (error) {
        console.error('Error deleting entry:', error);
        showToast('Failed to delete entry', 'error');
    }
}

// Format datetime for display
function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const entryDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const timeStr = date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    
    if (entryDate.getTime() === today.getTime()) {
        return `Today at ${timeStr}`;
    } else if (entryDate.getTime() === today.getTime() - 86400000) {
        return `Yesterday at ${timeStr}`;
    } else {
        return `${date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        })} at ${timeStr}`;
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toastId = 'toast_' + Date.now();
    const toastHTML = `
        <div class="toast toast-${type}" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <i data-feather="${type === 'success' ? 'check-circle' : 'alert-circle'}" class="me-2"></i>
                <strong class="me-auto">${type === 'success' ? 'Success' : 'Error'}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 4000
    });
    
    // Initialize Feather icons for the toast
    feather.replace();
    
    toast.show();
    
    // Remove toast element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

// Utility function to refresh data periodically
function startAutoRefresh() {
    setInterval(() => {
        loadData(currentPeriod);
    }, 30000); // Refresh every 30 seconds
}

// Start auto-refresh when the page is loaded
document.addEventListener('DOMContentLoaded', function() {
    startAutoRefresh();
});

// Handle visibility change to refresh when tab becomes active
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        loadData(currentPeriod);
    }
});
