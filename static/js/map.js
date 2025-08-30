// Map JavaScript for Disaster Relief System

// Global variables
let map = null;
let disasterLayer = null;
let centerLayer = null;
let mapData = null;
let selectedDisaster = null;
let selectedCenter = null;

// Initialize the map
function initializeMap() {
    // Create map centered on continental US
    map = L.map('map', {
        center: [39.8283, -98.5795],
        zoom: 4,
        zoomControl: true,
        attributionControl: true
    });

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
        minZoom: 2
    }).addTo(map);

    // Initialize layer groups
    disasterLayer = L.layerGroup().addTo(map);
    centerLayer = L.layerGroup().addTo(map);

    // Add map controls
    addMapControls();
}

// Add custom map controls
function addMapControls() {
    // Custom control for layer toggle
    const layerControl = L.control({position: 'topright'});
    
    layerControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        div.style.backgroundColor = 'white';
        div.style.padding = '10px';
        div.innerHTML = `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="showDisasters" checked>
                <label class="form-check-label" for="showDisasters">Show Disasters</label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="showCenters" checked>
                <label class="form-check-label" for="showCenters">Show Centers</label>
            </div>
        `;
        
        // Prevent map interaction when using controls
        L.DomEvent.disableClickPropagation(div);
        
        return div;
    };
    
    layerControl.addTo(map);
    
    // Add event listeners for checkboxes
    setTimeout(() => {
        document.getElementById('showDisasters').addEventListener('change', toggleDisasters);
        document.getElementById('showCenters').addEventListener('change', toggleCenters);
    }, 100);
}

// Load map data from API
async function loadMapData() {
    try {
        showMapLoading(true);
        
        const response = await fetch('/api/map_data');
        if (!response.ok) {
            throw new Error('Failed to fetch map data');
        }
        
        mapData = await response.json();
        
        // Clear existing markers
        disasterLayer.clearLayers();
        centerLayer.clearLayers();
        
        // Add disaster markers
        addDisasterMarkers(mapData.disasters);
        
        // Add center markers
        addCenterMarkers(mapData.centers);
        
        showMapLoading(false);
        
    } catch (error) {
        console.error('Error loading map data:', error);
        showMapError('Failed to load map data');
        showMapLoading(false);
    }
}

// Add disaster markers to the map
function addDisasterMarkers(disasters) {
    disasters.forEach(disaster => {
        const severity = disaster.severity;
        const color = getSeverityColor(severity);
        const size = getSeveritySize(severity);
        
        // Create custom disaster icon
        const disasterIcon = L.divIcon({
            className: 'disaster-marker',
            html: `
                <div class="disaster-marker-inner" style="
                    background-color: ${color};
                    width: ${size}px;
                    height: ${size}px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: ${size/3}px;
                ">
                    ${severity}
                </div>
            `,
            iconSize: [size + 6, size + 6],
            iconAnchor: [size/2 + 3, size/2 + 3]
        });
        
        // Create marker
        const marker = L.marker([disaster.latitude, disaster.longitude], {
            icon: disasterIcon,
            title: disaster.name
        });
        
        // Add popup
        const popupContent = `
            <div class="disaster-popup">
                <h6 class="mb-2">${disaster.name}</h6>
                <p class="mb-1"><strong>Type:</strong> ${disaster.type.charAt(0).toUpperCase() + disaster.type.slice(1)}</p>
                <p class="mb-1"><strong>Severity:</strong> Level ${disaster.severity}</p>
                <p class="mb-2"><strong>Affected:</strong> ${formatNumber(disaster.affected_population)} people</p>
                <button class="btn btn-sm btn-primary" onclick="showDisasterModal(${disaster.id})">
                    View Details
                </button>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Add click event
        marker.on('click', function() {
            selectedDisaster = disaster;
        });
        
        // Add to layer
        disasterLayer.addLayer(marker);
    });
}

// Add center markers to the map
function addCenterMarkers(centers) {
    centers.forEach(center => {
        const color = getCenterColor(center.type);
        const occupancyRate = (center.occupancy / center.capacity) * 100;
        
        // Create custom center icon
        const centerIcon = L.divIcon({
            className: 'center-marker',
            html: `
                <div class="center-marker-inner" style="
                    background-color: ${color};
                    width: 24px;
                    height: 24px;
                    border-radius: 3px;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 12px;
                ">
                    <i data-feather="map-pin" style="width: 14px; height: 14px;"></i>
                </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });
        
        // Create marker
        const marker = L.marker([center.latitude, center.longitude], {
            icon: centerIcon,
            title: center.name
        });
        
        // Add popup
        const popupContent = `
            <div class="center-popup">
                <h6 class="mb-2">${center.name}</h6>
                <p class="mb-1"><strong>Type:</strong> ${center.type.charAt(0).toUpperCase() + center.type.slice(1)}</p>
                <p class="mb-1"><strong>Capacity:</strong> ${center.capacity}</p>
                <p class="mb-1"><strong>Occupancy:</strong> ${center.occupancy} (${occupancyRate.toFixed(0)}%)</p>
                <div class="progress mb-2" style="height: 5px;">
                    <div class="progress-bar" style="width: ${occupancyRate}%; background-color: ${getOccupancyColor(occupancyRate)};"></div>
                </div>
                <button class="btn btn-sm btn-success" onclick="showCenterModal(${center.id})">
                    View Details
                </button>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Add click event
        marker.on('click', function() {
            selectedCenter = center;
        });
        
        // Add to layer
        centerLayer.addLayer(marker);
    });
    
    // Update feather icons in popups after adding markers
    setTimeout(() => feather.replace(), 100);
}

// Get color based on disaster severity
function getSeverityColor(severity) {
    const colors = {
        1: '#28a745', // Green
        2: '#ffc107', // Yellow
        3: '#fd7e14', // Orange
        4: '#dc3545', // Red
        5: '#6f42c1'  // Purple
    };
    return colors[severity] || '#dc3545';
}

// Get size based on disaster severity
function getSeveritySize(severity) {
    const sizes = {
        1: 20,
        2: 25,
        3: 30,
        4: 35,
        5: 40
    };
    return sizes[severity] || 30;
}

// Get color based on center type
function getCenterColor(type) {
    const colors = {
        'shelter': '#28a745',      // Green
        'medical': '#ffc107',      // Yellow
        'distribution': '#17a2b8', // Cyan
        'emergency': '#dc3545'     // Red
    };
    return colors[type] || '#17a2b8';
}

// Get color based on occupancy rate
function getOccupancyColor(rate) {
    if (rate < 50) return '#28a745';      // Green
    if (rate < 75) return '#ffc107';      // Yellow
    if (rate < 90) return '#fd7e14';      // Orange
    return '#dc3545';                     // Red
}

// Toggle disaster layer visibility
function toggleDisasters() {
    const checkbox = document.getElementById('showDisasters');
    if (checkbox && checkbox.checked) {
        map.addLayer(disasterLayer);
    } else {
        map.removeLayer(disasterLayer);
    }
}

// Toggle center layer visibility
function toggleCenters() {
    const checkbox = document.getElementById('showCenters');
    if (checkbox && checkbox.checked) {
        map.addLayer(centerLayer);
    } else {
        map.removeLayer(centerLayer);
    }
}

// Refresh map data
function refreshMap() {
    loadMapData();
}

// Show disaster modal
function showDisasterModal(disasterId) {
    if (!mapData || !mapData.disasters) return;
    
    const disaster = mapData.disasters.find(d => d.id === disasterId);
    if (!disaster) return;
    
    selectedDisaster = disaster;
    
    const content = `
        <div class="row">
            <div class="col-md-6">
                <h6>Disaster Details</h6>
                <table class="table table-sm">
                    <tr>
                        <td><strong>Name:</strong></td>
                        <td>${disaster.name}</td>
                    </tr>
                    <tr>
                        <td><strong>Type:</strong></td>
                        <td class="text-capitalize">${disaster.type}</td>
                    </tr>
                    <tr>
                        <td><strong>Severity:</strong></td>
                        <td>
                            <span class="badge bg-${getSeverityBadgeClass(disaster.severity)}">
                                Level ${disaster.severity}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Location:</strong></td>
                        <td>${disaster.latitude.toFixed(4)}, ${disaster.longitude.toFixed(4)}</td>
                    </tr>
                    <tr>
                        <td><strong>Affected Population:</strong></td>
                        <td>${formatNumber(disaster.affected_population)}</td>
                    </tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Quick Actions</h6>
                <div class="d-grid gap-2">
                    <button class="btn btn-outline-primary btn-sm" onclick="allocateResourcesForDisaster(${disaster.id})">
                        <i data-feather="send" class="me-1"></i>
                        Allocate Resources
                    </button>
                    <button class="btn btn-outline-info btn-sm" onclick="predictNeedsForDisaster(${disaster.id})">
                        <i data-feather="trending-up" class="me-1"></i>
                        Predict Needs
                    </button>
                    <button class="btn btn-outline-warning btn-sm" onclick="findNearbyCenters(${disaster.latitude}, ${disaster.longitude})">
                        <i data-feather="map-pin" class="me-1"></i>
                        Find Centers
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('disasterModalContent').innerHTML = content;
    
    const modal = new bootstrap.Modal(document.getElementById('disasterModal'));
    modal.show();
    
    setTimeout(() => feather.replace(), 100);
}

// Show center modal
function showCenterModal(centerId) {
    if (!mapData || !mapData.centers) return;
    
    const center = mapData.centers.find(c => c.id === centerId);
    if (!center) return;
    
    selectedCenter = center;
    
    const occupancyRate = (center.occupancy / center.capacity) * 100;
    
    const content = `
        <div class="row">
            <div class="col-md-6">
                <h6>Center Details</h6>
                <table class="table table-sm">
                    <tr>
                        <td><strong>Name:</strong></td>
                        <td>${center.name}</td>
                    </tr>
                    <tr>
                        <td><strong>Type:</strong></td>
                        <td class="text-capitalize">${center.type}</td>
                    </tr>
                    <tr>
                        <td><strong>Location:</strong></td>
                        <td>${center.latitude.toFixed(4)}, ${center.longitude.toFixed(4)}</td>
                    </tr>
                    <tr>
                        <td><strong>Capacity:</strong></td>
                        <td>${center.capacity}</td>
                    </tr>
                    <tr>
                        <td><strong>Current Occupancy:</strong></td>
                        <td>
                            ${center.occupancy} (${occupancyRate.toFixed(0)}%)
                            <div class="progress mt-1" style="height: 5px;">
                                <div class="progress-bar" style="width: ${occupancyRate}%; background-color: ${getOccupancyColor(occupancyRate)};"></div>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>Quick Actions</h6>
                <div class="d-grid gap-2">
                    <button class="btn btn-outline-success btn-sm" onclick="manageCenter(${center.id})">
                        <i data-feather="settings" class="me-1"></i>
                        Manage Center
                    </button>
                    <button class="btn btn-outline-primary btn-sm" onclick="allocateToCenter(${center.id})">
                        <i data-feather="package" class="me-1"></i>
                        Allocate Resources
                    </button>
                    <button class="btn btn-outline-info btn-sm" onclick="viewCenterHistory(${center.id})">
                        <i data-feather="clock" class="me-1"></i>
                        View History
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('centerModalContent').innerHTML = content;
    
    const modal = new bootstrap.Modal(document.getElementById('centerModal'));
    modal.show();
    
    setTimeout(() => feather.replace(), 100);
}

// Get severity badge class
function getSeverityBadgeClass(severity) {
    const classes = {
        1: 'success',
        2: 'warning',
        3: 'info',
        4: 'danger',
        5: 'dark'
    };
    return classes[severity] || 'danger';
}

// Find nearby centers for a disaster
function findNearbyCenters(lat, lng) {
    if (!mapData || !mapData.centers) return;
    
    // Calculate distances and find nearby centers (within 100km)
    const nearbyCenters = mapData.centers.filter(center => {
        const distance = calculateDistance(lat, lng, center.latitude, center.longitude);
        return distance <= 100; // 100km radius
    }).sort((a, b) => {
        const distA = calculateDistance(lat, lng, a.latitude, a.longitude);
        const distB = calculateDistance(lat, lng, b.latitude, b.longitude);
        return distA - distB;
    });
    
    // Highlight nearby centers on map
    centerLayer.clearLayers();
    addCenterMarkers(nearbyCenters);
    
    // Zoom to show disaster and nearby centers
    if (nearbyCenters.length > 0) {
        const bounds = L.latLngBounds([lat, lng]);
        nearbyCenters.forEach(center => {
            bounds.extend([center.latitude, center.longitude]);
        });
        map.fitBounds(bounds, { padding: [20, 20] });
    }
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Navigation functions
function viewDisasterDetails() {
    if (selectedDisaster) {
        window.location.href = `/disasters?id=${selectedDisaster.id}`;
    }
}

function viewCenterDetails() {
    if (selectedCenter) {
        window.location.href = `/centers?id=${selectedCenter.id}`;
    }
}

function allocateResourcesForDisaster(disasterId) {
    window.location.href = `/allocations?disaster_id=${disasterId}`;
}

function predictNeedsForDisaster(disasterId) {
    window.location.href = `/dashboard?predict=${disasterId}`;
}

function manageCenter(centerId) {
    window.location.href = `/centers?manage=${centerId}`;
}

function allocateToCenter(centerId) {
    window.location.href = `/allocations?center_id=${centerId}`;
}

function viewCenterHistory(centerId) {
    window.location.href = `/centers?history=${centerId}`;
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

function showMapLoading(show) {
    if (show) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'map-loading';
        loadingDiv.className = 'position-absolute top-50 start-50 translate-middle';
        loadingDiv.style.zIndex = '1000';
        loadingDiv.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading map data...</p>
            </div>
        `;
        document.getElementById('map').appendChild(loadingDiv);
    } else {
        const loadingDiv = document.getElementById('map-loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
}

function showMapError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger position-absolute top-0 start-0 w-100';
    errorDiv.style.zIndex = '1000';
    errorDiv.innerHTML = `
        <i data-feather="alert-circle" class="me-2"></i>
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    document.getElementById('map').appendChild(errorDiv);
    
    setTimeout(() => feather.replace(), 100);
}

// Auto-refresh map data every 2 minutes
setInterval(loadMapData, 120000);