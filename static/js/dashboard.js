// Dashboard JavaScript for Disaster Relief System

// Global variables
let dashboardData = null;
let refreshTimer = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    initializeEventListeners();
    startAutoRefresh();
});

// Load dashboard statistics and recent data
async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard_stats');
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard data');
        }
        
        dashboardData = await response.json();
        updateStatistics(dashboardData.stats);
        updateRecentDisasters(dashboardData.recent_disasters);
        updateRecentAllocations(dashboardData.recent_allocations);
        
        // Update alert count
        updateAlertCount(dashboardData.stats.pending_allocations);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data');
    }
}

// Update statistics cards
function updateStatistics(stats) {
    document.getElementById('activeDisasters').textContent = stats.active_disasters;
    document.getElementById('affectedPopulation').textContent = formatNumber(stats.total_affected);
    document.getElementById('pendingAllocations').textContent = stats.pending_allocations;
    document.getElementById('operationalCenters').textContent = stats.operational_centers;
    
    // Add animation
    document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.add('fade-in');
    });
}

// Update recent disasters list
function updateRecentDisasters(disasters) {
    const container = document.getElementById('recentDisasters');
    
    if (!disasters || disasters.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i data-feather="info" class="mb-2"></i>
                <p>No recent disasters</p>
            </div>
        `;
        feather.replace();
        return;
    }
    
    const html = disasters.map(disaster => `
        <div class="disaster-item severity-${disaster.severity} fade-in" onclick="viewDisaster(${disaster.id})">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h6 class="mb-1 fw-bold">${disaster.name}</h6>
                    <p class="mb-1 text-muted small">
                        <i data-feather="map-pin" class="me-1" style="width: 14px; height: 14px;"></i>
                        ${disaster.type.charAt(0).toUpperCase() + disaster.type.slice(1)}
                    </p>
                    <div class="d-flex align-items-center">
                        <span class="disaster-severity">Level ${disaster.severity}</span>
                        <span class="text-muted ms-2 small">
                            ${formatNumber(disaster.affected_population)} affected
                        </span>
                    </div>
                </div>
                <div class="text-end">
                    <small class="text-muted">${formatTimeAgo(disaster.created_at)}</small>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
    feather.replace();
}

// Update recent allocations list
function updateRecentAllocations(allocations) {
    const container = document.getElementById('recentAllocations');
    
    if (!allocations || allocations.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i data-feather="info" class="mb-2"></i>
                <p>No recent allocations</p>
            </div>
        `;
        feather.replace();
        return;
    }
    
    const html = allocations.map(allocation => `
        <div class="allocation-item priority-${allocation.priority} fade-in" onclick="viewAllocation(${allocation.id})">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <h6 class="mb-1 fw-bold">${allocation.resource_name}</h6>
                    <p class="mb-1 text-muted small">
                        <i data-feather="arrow-right" class="me-1" style="width: 14px; height: 14px;"></i>
                        ${allocation.center_name}
                    </p>
                    <div class="d-flex align-items-center">
                        <span class="priority-badge priority-${allocation.priority}">
                            Priority ${allocation.priority}
                        </span>
                        <span class="status-badge status-${allocation.status} ms-2">
                            ${allocation.status.charAt(0).toUpperCase() + allocation.status.slice(1)}
                        </span>
                    </div>
                </div>
                <div class="text-end">
                    <div class="fw-bold">${formatNumber(allocation.quantity_requested)}</div>
                    <small class="text-muted">units</small>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
    feather.replace();
}

// Update alert count
function updateAlertCount(count) {
    document.getElementById('alertCount').textContent = count;
    
    if (count > 0) {
        document.getElementById('alertBadge').classList.remove('bg-warning');
        document.getElementById('alertBadge').classList.add('bg-danger');
        
        // Show emergency alert if high priority items
        if (count >= 5) {
            showEmergencyAlert('High number of pending resource allocations require immediate attention');
        }
    } else {
        document.getElementById('alertBadge').classList.remove('bg-danger');
        document.getElementById('alertBadge').classList.add('bg-warning');
    }
}

// Show emergency alert banner
function showEmergencyAlert(message) {
    const alertElement = document.getElementById('emergencyAlert');
    const messageElement = document.getElementById('alertMessage');
    
    messageElement.textContent = message;
    alertElement.style.display = 'block';
    alertElement.classList.add('show');
}

// Initialize event listeners
function initializeEventListeners() {
    // Quick action buttons
    document.querySelectorAll('[onclick^="show"]').forEach(button => {
        button.addEventListener('click', function() {
            this.classList.add('pulse');
            setTimeout(() => this.classList.remove('pulse'), 300);
        });
    });
}

// Start auto-refresh
function startAutoRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
    
    refreshTimer = setInterval(() => {
        loadDashboardData();
    }, 30000); // Refresh every 30 seconds
}

// Load disaster options for prediction modal
async function loadDisasterOptions() {
    try {
        const response = await fetch('/api/disasters?status=active');
        if (!response.ok) throw new Error('Failed to fetch disasters');
        
        const disasters = await response.json();
        const select = document.getElementById('disasterSelect');
        
        select.innerHTML = '<option value="">Select a disaster...</option>';
        
        disasters.forEach(disaster => {
            const option = document.createElement('option');
            option.value = disaster.id;
            option.textContent = `${disaster.name} (${disaster.disaster_type})`;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading disaster options:', error);
    }
}

// Show prediction modal
function showPredictionModal() {
    const modal = new bootstrap.Modal(document.getElementById('predictionModal'));
    modal.show();
}

// Generate AI prediction
async function generatePrediction() {
    const disasterId = document.getElementById('disasterSelect').value;
    
    if (!disasterId) {
        showError('Please select a disaster first');
        return;
    }
    
    try {
        showLoading('Generating AI predictions...');
        
        const response = await fetch('/api/predict_needs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ disaster_id: disasterId })
        });
        
        if (!response.ok) throw new Error('Failed to generate prediction');
        
        const result = await response.json();
        displayPredictionResults(result);
        
    } catch (error) {
        console.error('Error generating prediction:', error);
        showError('Failed to generate prediction');
    } finally {
        hideLoading();
    }
}

// Display prediction results
function displayPredictionResults(result) {
    const container = document.getElementById('predictionContent');
    const resultsDiv = document.getElementById('predictionResults');
    
    if (!result.success) {
        container.innerHTML = '<div class="alert alert-danger">Failed to generate predictions</div>';
        resultsDiv.style.display = 'block';
        return;
    }
    
    let html = `
        <div class="alert alert-info">
            <strong>Disaster:</strong> ${result.disaster_name}<br>
            <strong>Confidence:</strong> ${(result.confidence * 100).toFixed(0)}%
        </div>
        <div class="row">
    `;
    
    Object.entries(result.predictions).forEach(([category, prediction]) => {
        html += `
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title text-capitalize">${category}</h6>
                        <div class="d-flex justify-content-between">
                            <div>
                                <small class="text-muted">Daily Need</small>
                                <div class="fw-bold">${formatNumber(prediction.daily)}</div>
                            </div>
                            <div class="text-end">
                                <small class="text-muted">Weekly Need</small>
                                <div class="fw-bold">${formatNumber(prediction.weekly)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    if (result.factors_considered) {
        html += `
            <div class="mt-3">
                <h6>Factors Considered:</h6>
                <ul class="list-unstyled">
                    ${result.factors_considered.map(factor => `<li class="small text-muted">• ${factor}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    container.innerHTML = html;
    resultsDiv.style.display = 'block';
}

// Navigation functions
function viewDisaster(id) {
    window.location.href = `/disasters?id=${id}`;
}

function viewAllocation(id) {
    window.location.href = `/allocations?id=${id}`;
}

// Utility functions
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
        return 'Just now';
    } else if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    }
}

function showError(message) {
    const toast = `
        <div class="toast align-items-center text-white bg-danger border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i data-feather="alert-circle" class="me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    showToast(toast);
}

function showSuccess(message) {
    const toast = `
        <div class="toast align-items-center text-white bg-success border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i data-feather="check-circle" class="me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    showToast(toast);
}

function showToast(toastHtml) {
    // Create toast container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
    }
    
    container.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = container.lastElementChild;
    const toast = new bootstrap.Toast(toastElement);
    
    feather.replace();
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

function showLoading(message = 'Loading...') {
    const loadingHtml = `
        <div class="loading-overlay" id="loadingOverlay">
            <div class="text-center text-white">
                <div class="loading-spinner"></div>
                <p class="mt-3">${message}</p>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', loadingHtml);
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// Handle page visibility change
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        loadDashboardData();
    } else {
        if (refreshTimer) {
            clearInterval(refreshTimer);
        }
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
});