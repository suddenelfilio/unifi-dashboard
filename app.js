// Use local BFF instead of direct API call to avoid CORS issues
const API_BASE_URL = '/api';

let allSitesData = [];
let selectedSiteIds = new Set();
let autoRefreshInterval = null;
let countdownInterval = null;
let secondsUntilRefresh = 15;
let previousClientCount = null;
let isSoundMuted = false;
let isSiteFilterVisible = true;
let collapsedSiteIds = new Set();

// DOM Elements
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const dashboardStats = document.getElementById('dashboardStats');
const sitesContainer = document.getElementById('sitesContainer');
const siteFilterContainer = document.getElementById('siteFilterContainer');
const autoRefreshToggle = document.getElementById('autoRefreshToggle');
const refreshCountdown = document.getElementById('refreshCountdown');
const muteToggle = document.getElementById('muteToggle');
const notificationContainer = document.getElementById('notificationContainer');

// Event Listeners
autoRefreshToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        startAutoRefresh();
    } else {
        stopAutoRefresh();
    }
});

muteToggle.addEventListener('change', (e) => {
    isSoundMuted = e.target.checked;
});

// Initialize
loadData();
startAutoRefresh();

async function loadData() {
    showLoading();
    hideError();

    try {
        const sites = await fetchSites();

        if (!sites || sites.length === 0) {
            showEmptyState();
            return;
        }

        // Fetch devices and clients for each site in parallel
        const sitesWithData = await Promise.all(
            sites.map(async (site) => {
                const [devices, clients] = await Promise.all([
                    fetchDevices(site.id),
                    fetchClients(site.id)
                ]);

                // Infer site availability based on device status
                const availability = inferSiteAvailability(devices);

                return { ...site, devices, clients, availability };
            })
        );

        allSitesData = sitesWithData;

        // Initialize selected sites on first load
        if (selectedSiteIds.size === 0) {
            allSitesData.forEach(site => selectedSiteIds.add(site.id));
        }

        renderSiteFilters(allSitesData);
        renderDashboard();

        // Restore collapse states after re-render
        restoreCollapseStates();

        // Check for client count changes
        checkClientCountChange(allSitesData);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function checkClientCountChange(sites) {
    const currentClientCount = sites.reduce((sum, site) => sum + site.clients.length, 0);

    if (previousClientCount !== null && previousClientCount !== currentClientCount) {
        const difference = currentClientCount - previousClientCount;
        showClientChangeNotification(difference, currentClientCount);

        if (!isSoundMuted) {
            playNotificationSound();
        }
    }

    previousClientCount = currentClientCount;
}

function showClientChangeNotification(difference, total) {
    const notification = document.createElement('div');
    notification.className = 'notification';

    if (difference > 0) {
        notification.classList.add('notification-increase');
        notification.innerHTML = `
            <span class="notification-icon">📈</span>
            <span class="notification-message">
                <strong>+${difference} client${difference !== 1 ? 's' : ''}</strong> connected
                <span class="notification-total">(Total: ${total})</span>
            </span>
        `;
    } else {
        notification.classList.add('notification-decrease');
        notification.innerHTML = `
            <span class="notification-icon">📉</span>
            <span class="notification-message">
                <strong>${difference} client${difference !== -1 ? 's' : ''}</strong> disconnected
                <span class="notification-total">(Total: ${total})</span>
            </span>
        `;
    }

    notificationContainer.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Flash the client count card
    flashClientCard();

    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function flashClientCard() {
    const clientCards = document.querySelectorAll('.stat-card.clients');
    clientCards.forEach(card => {
        card.classList.add('flash');
        setTimeout(() => card.classList.remove('flash'), 2000);
    });
}

function playNotificationSound() {
    // Create a simple ding sound using Web Audio API
    const AudioContextClass = window.AudioContext || window['webkitAudioContext'];
    if (!AudioContextClass) return; // Browser doesn't support Web Audio API

    const audioContext = new AudioContextClass();

    // Create oscillator for the ding sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure the sound (a pleasant ding)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Higher pitch

    // Create envelope for natural sound
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function inferSiteAvailability(devices) {
    if (!devices || devices.length === 0) {
        return 'UNKNOWN';
    }

    const hasOnlineDevice = devices.some(d => d.state === 'ONLINE');
    return hasOnlineDevice ? 'ONLINE' : 'OFFLINE';
}

function renderDashboard() {
    const filteredSites = allSitesData.filter(site => selectedSiteIds.has(site.id));
    renderDashboardStats(filteredSites);
    renderSites(filteredSites);
}

function startAutoRefresh() {
    stopAutoRefresh(); // Clear any existing intervals
    secondsUntilRefresh = 15;

    autoRefreshInterval = setInterval(() => {
        loadData();
        secondsUntilRefresh = 15;
    }, 15000);

    countdownInterval = setInterval(() => {
        secondsUntilRefresh--;
        updateCountdown();
        if (secondsUntilRefresh <= 0) {
            secondsUntilRefresh = 15;
        }
    }, 1000);

    updateCountdown();
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    refreshCountdown.textContent = '';
}

function resetAutoRefresh() {
    if (autoRefreshToggle.checked) {
        startAutoRefresh();
    }
}

function updateCountdown() {
    if (autoRefreshToggle.checked) {
        refreshCountdown.textContent = `Next refresh in ${secondsUntilRefresh}s`;
    }
}

async function fetchSites() {
    const response = await fetch(`${API_BASE_URL}/sites`);

    if (!response.ok) {
        throw new Error(`Failed to fetch sites: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
}

async function fetchDevices(siteId) {
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${siteId}/devices`);

        if (!response.ok) {
            console.error(`Failed to fetch devices for site ${siteId}`);
            return [];
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error(`Error fetching devices for site ${siteId}:`, error);
        return [];
    }
}

async function fetchClients(siteId) {
    try {
        const response = await fetch(`${API_BASE_URL}/sites/${siteId}/clients`);

        if (!response.ok) {
            console.error(`Failed to fetch clients for site ${siteId}`);
            return [];
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error(`Error fetching clients for site ${siteId}:`, error);
        return [];
    }
}

function renderSiteFilters(sites) {
    const sortedSites = [...sites].sort((a, b) => {
        // Sort by availability (online first), then by name
        if (a.availability !== b.availability) {
            return a.availability === 'ONLINE' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });

    const selectedCount = selectedSiteIds.size;
    const totalCount = sites.length;

    siteFilterContainer.innerHTML = `
        <div class="filter-header">
            <div class="filter-title-section">
                <span class="filter-title">Select Sites</span>
                <span class="filter-count">${selectedCount} of ${totalCount} selected</span>
            </div>
            <div class="filter-header-actions">
                <div class="filter-actions">
                    <button class="filter-btn" onclick="selectAllSites()">All</button>
                    <button class="filter-btn" onclick="selectNoneSites()">None</button>
                    <button class="filter-btn" onclick="selectOnlineSites()">Online Only</button>
                </div>
                <button class="toggle-filter-btn" onclick="toggleSiteFilter()" title="Toggle site filter">
                    <span class="expand-icon">▼</span>
                    <span class="collapse-icon">▲</span>
                </button>
            </div>
        </div>
        <div class="filter-list ${!isSiteFilterVisible ? 'collapsed' : ''}">
            ${sortedSites.map(site => `
                <label class="filter-item">
                    <input
                        type="checkbox"
                        value="${site.id}"
                        ${selectedSiteIds.has(site.id) ? 'checked' : ''}
                        onchange="toggleSite('${site.id}')"
                    />
                    <span class="filter-site-name">${escapeHtml(site.name)}</span>
                    <span class="badge badge-${site.availability.toLowerCase()}">${site.availability}</span>
                </label>
            `).join('')}
        </div>
    `;

    // Update collapsed state
    if (!isSiteFilterVisible) {
        siteFilterContainer.classList.add('filter-collapsed');
    } else {
        siteFilterContainer.classList.remove('filter-collapsed');
    }
}

function toggleSiteFilter() {
    isSiteFilterVisible = !isSiteFilterVisible;
    renderSiteFilters(allSitesData);
}

function toggleSite(siteId) {
    if (selectedSiteIds.has(siteId)) {
        selectedSiteIds.delete(siteId);
    } else {
        selectedSiteIds.add(siteId);
    }
    renderDashboard();
}

function selectAllSites() {
    allSitesData.forEach(site => selectedSiteIds.add(site.id));
    renderSiteFilters(allSitesData);
    renderDashboard();
}

function selectNoneSites() {
    selectedSiteIds.clear();
    renderSiteFilters(allSitesData);
    renderDashboard();
}

function selectOnlineSites() {
    selectedSiteIds.clear();
    allSitesData.forEach(site => {
        if (site.availability === 'ONLINE') {
            selectedSiteIds.add(site.id);
        }
    });
    renderSiteFilters(allSitesData);
    renderDashboard();
}

function renderDashboardStats(sites) {
    const totalSites = sites.length;
    const onlineSites = sites.filter(s => s.availability === 'ONLINE').length;
    const offlineSites = sites.filter(s => s.availability === 'OFFLINE').length;
    const totalDevices = sites.reduce((sum, site) => sum + site.devices.length, 0);
    const totalClients = sites.reduce((sum, site) => sum + site.clients.length, 0);
    const onlineDevices = sites.reduce((sum, site) =>
        sum + site.devices.filter(d => d.state === 'ONLINE').length, 0);
    const offlineDevices = totalDevices - onlineDevices;

    dashboardStats.innerHTML = `
        <div class="stat-card total">
            <div class="stat-card-header">
                <div class="stat-card-title">Sites</div>
                <div class="stat-card-icon">🏢</div>
            </div>
            <div class="stat-card-value">${totalSites}</div>
            <div class="stat-card-detail">
                <div class="stat-detail-item">
                    <div class="stat-detail-value" style="color: #34c759;">${onlineSites}</div>
                    <div class="stat-detail-label">Online</div>
                </div>
                <div class="stat-detail-item">
                    <div class="stat-detail-value" style="color: #ff3b30;">${offlineSites}</div>
                    <div class="stat-detail-label">Offline</div>
                </div>
            </div>
        </div>

        <div class="stat-card total">
            <div class="stat-card-header">
                <div class="stat-card-title">Total Devices</div>
                <div class="stat-card-icon">📡</div>
            </div>
            <div class="stat-card-value">${totalDevices}</div>
            <div class="stat-card-detail">
                <div class="stat-detail-item">
                    <div class="stat-detail-value" style="color: #34c759;">${onlineDevices}</div>
                    <div class="stat-detail-label">Online</div>
                </div>
                <div class="stat-detail-item">
                    <div class="stat-detail-value" style="color: #ff3b30;">${offlineDevices}</div>
                    <div class="stat-detail-label">Offline</div>
                </div>
            </div>
        </div>

        <div class="stat-card clients">
            <div class="stat-card-header">
                <div class="stat-card-title">Connected Clients</div>
                <div class="stat-card-icon">💻</div>
            </div>
            <div class="stat-card-value">${totalClients}</div>
            <div class="stat-card-subtitle">Active connections</div>
        </div>

        <div class="stat-card online">
            <div class="stat-card-header">
                <div class="stat-card-title">Network Health</div>
                <div class="stat-card-icon">✓</div>
            </div>
            <div class="stat-card-value">${totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0}%</div>
            <div class="stat-card-subtitle">Devices online</div>
        </div>
    `;
}

function renderSites(sites) {
    if (sites.length === 0) {
        sitesContainer.innerHTML = '<div class="empty-state">No sites selected. Use the filter above to select sites to view.</div>';
        return;
    }

    sitesContainer.innerHTML = sites.map(site => {
        const totalDevices = site.devices.length;
        const onlineDevices = site.devices.filter(d => d.state === 'ONLINE').length;
        const offlineDevices = totalDevices - onlineDevices;
        const totalClients = site.clients.length;

        const siteId = `site-${site.id}`;

        return `
            <div class="site-card site-${site.availability.toLowerCase()}" id="${siteId}">
                <div class="site-header">
                    <div>
                        <div class="site-name">
                            ${escapeHtml(site.name)}
                            <span class="badge badge-${site.availability.toLowerCase()}" style="margin-left: 12px;">
                                ${site.availability}
                            </span>
                        </div>
                        ${site.internalReference ? `<div class="site-reference">ID: ${escapeHtml(site.internalReference)}</div>` : ''}
                    </div>
                    <button class="toggle-site-btn" onclick="toggleSiteDetails('${siteId}')" title="Toggle site details">
                        <span class="expand-icon">▼</span>
                        <span class="collapse-icon">▲</span>
                    </button>
                </div>

                <div class="site-stats">
                    <div class="site-stat devices">
                        <div class="site-stat-value">${totalDevices}</div>
                        <div class="site-stat-label">Total Devices</div>
                    </div>
                    <div class="site-stat clients">
                        <div class="site-stat-value">${totalClients}</div>
                        <div class="site-stat-label">Connected Clients</div>
                    </div>
                    <div class="site-stat online">
                        <div class="site-stat-value">${onlineDevices}</div>
                        <div class="site-stat-label">Online</div>
                        <div class="site-stat-detail">${totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0}% uptime</div>
                    </div>
                    <div class="site-stat offline">
                        <div class="site-stat-value">${offlineDevices}</div>
                        <div class="site-stat-label">Offline</div>
                        ${offlineDevices > 0 ? `<div class="site-stat-detail">Needs attention</div>` : ''}
                    </div>
                </div>

                <div class="site-details" data-site-id="${siteId}">
                    ${renderDevicesList(site.devices)}
                    ${renderClientsList(site.clients)}
                </div>
            </div>
        `;
    }).join('');
}

function renderDevicesList(devices) {
    if (!devices || devices.length === 0) {
        return `
            <div class="detail-section">
                <div class="detail-section-title">📡 Devices</div>
                <div class="empty-state">No devices</div>
            </div>
        `;
    }

    const listId = `devices-${Math.random().toString(36).substring(2, 11)}`;
    const showAll = devices.length <= 5;

    return `
        <div class="detail-section">
            <div class="detail-section-title">📡 Devices (${devices.length})</div>
            <div class="detail-list" id="${listId}">
                ${devices.slice(0, 5).map(device => `
                    <div class="detail-item">
                        <div class="detail-item-name">${escapeHtml(device.name)}</div>
                        <div class="detail-item-info">
                            <span>${escapeHtml(device.model)}</span>
                            <span class="badge ${device.state === 'ONLINE' ? 'badge-online' : 'badge-offline'}">
                                ${device.state}
                            </span>
                        </div>
                    </div>
                `).join('')}
                ${!showAll ? `
                    <div class="detail-item-hidden" data-list="${listId}">
                        ${devices.slice(5).map(device => `
                            <div class="detail-item">
                                <div class="detail-item-name">${escapeHtml(device.name)}</div>
                                <div class="detail-item-info">
                                    <span>${escapeHtml(device.model)}</span>
                                    <span class="badge ${device.state === 'ONLINE' ? 'badge-online' : 'badge-offline'}">
                                        ${device.state}
                                    </span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="expand-btn" onclick="toggleExpand('${listId}', this)">
                        <span class="expand-text">Show ${devices.length - 5} more devices</span>
                        <span class="collapse-text">Show less</span>
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function renderClientsList(clients) {
    if (!clients || clients.length === 0) {
        return `
            <div class="detail-section">
                <div class="detail-section-title">💻 Clients</div>
                <div class="empty-state">No clients</div>
            </div>
        `;
    }

    const listId = `clients-${Math.random().toString(36).substring(2, 11)}`;
    const showAll = clients.length <= 5;

    return `
        <div class="detail-section">
            <div class="detail-section-title">💻 Clients (${clients.length})</div>
            <div class="detail-list" id="${listId}">
                ${clients.slice(0, 5).map(client => `
                    <div class="detail-item">
                        <div class="detail-item-name">${escapeHtml(client.name)}</div>
                        <div class="detail-item-info">
                            <span>${escapeHtml(client.ipAddress || 'N/A')}</span>
                            ${client.type ? `
                                <span class="badge badge-${client.type.toLowerCase() === 'wireless' ? 'wireless' : 'wired'}">
                                    ${client.type}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
                ${!showAll ? `
                    <div class="detail-item-hidden" data-list="${listId}">
                        ${clients.slice(5).map(client => `
                            <div class="detail-item">
                                <div class="detail-item-name">${escapeHtml(client.name)}</div>
                                <div class="detail-item-info">
                                    <span>${escapeHtml(client.ipAddress || 'N/A')}</span>
                                    ${client.type ? `
                                        <span class="badge badge-${client.type.toLowerCase() === 'wireless' ? 'wireless' : 'wired'}">
                                            ${client.type}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="expand-btn" onclick="toggleExpand('${listId}', this)">
                        <span class="expand-text">Show ${clients.length - 5} more clients</span>
                        <span class="collapse-text">Show less</span>
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function showLoading() {
    loadingDiv.style.display = 'block';
}

function hideLoading() {
    loadingDiv.style.display = 'none';
}

function showError(message) {
    errorDiv.textContent = `Error: ${message}`;
    errorDiv.style.display = 'block';
}

function hideError() {
    errorDiv.style.display = 'none';
}

function showEmptyState() {
    sitesContainer.innerHTML = '<div class="empty-state">No sites found</div>';
}

function toggleExpand(listId, button) {
    const list = document.getElementById(listId);
    const hiddenItems = list.querySelector('.detail-item-hidden');

    if (hiddenItems.classList.contains('expanded')) {
        hiddenItems.classList.remove('expanded');
        button.classList.remove('expanded');
    } else {
        hiddenItems.classList.add('expanded');
        button.classList.add('expanded');
    }
}

function toggleSiteDetails(siteId) {
    const siteCard = document.getElementById(siteId);
    const button = siteCard.querySelector('.toggle-site-btn');

    if (siteCard.classList.contains('collapsed')) {
        siteCard.classList.remove('collapsed');
        button.classList.remove('collapsed');
        collapsedSiteIds.delete(siteId);
    } else {
        siteCard.classList.add('collapsed');
        button.classList.add('collapsed');
        collapsedSiteIds.add(siteId);
    }
}

function restoreCollapseStates() {
    // Restore collapsed state for each site
    collapsedSiteIds.forEach(siteId => {
        const siteCard = document.getElementById(siteId);
        if (siteCard) {
            const button = siteCard.querySelector('.toggle-site-btn');
            siteCard.classList.add('collapsed');
            if (button) {
                button.classList.add('collapsed');
            }
        }
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
