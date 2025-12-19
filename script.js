// Supabase Configuration
const SUPABASE_URL = 'https://joswjvvaieyeckcpmagc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impvc3dqdnZhaWV5ZWNrY3BtYWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjYwNDIsImV4cCI6MjA4MTc0MjA0Mn0.q6TchK73Blv254YfsSuDy-jjupZ_kZisGCJjsgYDgIQ';

// Initialize Supabase client (with fallback if library not loaded)
let db = null;
try {
    if (window.supabase && window.supabase.createClient) {
        db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn('Supabase library not loaded - using localStorage only');
    }
} catch (e) {
    console.error('Supabase init error:', e);
}

// Admin Configuration
let isAdminUnlocked = false;
let storedPinHash = null;

// SHA-256 Hash function
async function hashPin(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Load PIN hash - stored locally (more secure than database)
function loadPinHash() {
    // Your custom PIN hash - only you know the PIN!
    storedPinHash = '597180d3039f1b7b7dde3ebdc56e13c698ef66dc18cf72ed61a4f79c8a904524';
}

// Project Manager Application
let projects = [];
let currentFilter = 'all';
let editingId = null;
let isOnline = true;

// No sample projects - start clean

// Update sync status indicator
// Sync status removed - function kept for compatibility
function updateSyncStatus(status, message) {
    // Status indicator removed from UI
}

// Update Admin UI based on lock state
function updateAdminUI() {
    const toggleBtn = document.getElementById('adminToggleBtn');
    const addBtn = document.getElementById('addProjectBtn');
    const mobileAdminBtn = document.getElementById('mobileAdminBtn');
    const mobileAddBtn = document.getElementById('mobileAddBtn');
    
    if (!toggleBtn || !addBtn) {
        return;
    }
    
    const lockIcon = toggleBtn.querySelector('.lock-icon');
    const lockText = toggleBtn.querySelector('.lock-text');
    
    if (isAdminUnlocked) {
        toggleBtn.classList.add('unlocked');
        if (lockIcon) lockIcon.textContent = '🔓';
        if (lockText) lockText.textContent = 'Admin';
        addBtn.disabled = false;
        
        // Mobile menu items
        if (mobileAdminBtn) {
            mobileAdminBtn.classList.add('unlocked');
            mobileAdminBtn.innerHTML = '<span class="lock-icon">🔓</span> Unlocked';
        }
        if (mobileAddBtn) mobileAddBtn.disabled = false;
    } else {
        toggleBtn.classList.remove('unlocked');
        if (lockIcon) lockIcon.textContent = '🔒';
        if (lockText) lockText.textContent = 'Locked';
        addBtn.disabled = true;
        
        // Mobile menu items
        if (mobileAdminBtn) {
            mobileAdminBtn.classList.remove('unlocked');
            mobileAdminBtn.innerHTML = '<span class="lock-icon">🔒</span> Admin';
        }
        if (mobileAddBtn) mobileAddBtn.disabled = true;
    }
    
    // Show/hide action buttons in cards
    document.querySelectorAll('.project-actions').forEach(actions => {
        if (isAdminUnlocked) {
            actions.classList.remove('hidden');
        } else {
            actions.classList.add('hidden');
        }
    });
}

// Setup PIN Modal
function setupPinModal() {
    const pinModal = document.getElementById('pinModal');
    const pinInputs = document.querySelectorAll('.pin-digit');
    const pinError = document.getElementById('pinError');
    const pinSubmitBtn = document.getElementById('pinSubmitBtn');
    const closePinModal = document.getElementById('closePinModal');
    const adminToggleBtn = document.getElementById('adminToggleBtn');
    
    // Check if elements exist
    if (!pinModal || !adminToggleBtn) {
        console.error('PIN modal elements not found');
        return;
    }
    
    // Clear PIN inputs helper
    function clearPinInputs() {
        pinInputs.forEach(input => {
            input.value = '';
            input.classList.remove('error');
        });
        if (pinError) pinError.textContent = '';
    }
    
    // Verify PIN helper
    async function verifyPin() {
        const enteredPin = Array.from(pinInputs).map(input => input.value).join('');
        
        if (enteredPin.length !== 4) {
            pinError.textContent = 'Please enter all 4 digits';
            return;
        }
        
        // Hash the entered PIN and compare with stored hash
        pinSubmitBtn.textContent = 'Verifying...';
        pinSubmitBtn.disabled = true;
        
        try {
            const enteredHash = await hashPin(enteredPin);
            
            if (enteredHash === storedPinHash) {
                // Success!
                isAdminUnlocked = true;
                sessionStorage.setItem('adminUnlocked', 'true');
                pinModal.style.display = 'none';
                clearPinInputs();
                updateAdminUI();
                renderProjects();
            } else {
                // Wrong PIN
                pinError.textContent = 'Incorrect PIN. Try again.';
                pinInputs.forEach(inp => inp.classList.add('error'));
                setTimeout(() => {
                    clearPinInputs();
                    pinInputs[0].focus();
                }, 500);
            }
        } catch (error) {
            console.error('PIN verification error:', error);
            pinError.textContent = 'Verification failed. Try again.';
        } finally {
            pinSubmitBtn.textContent = 'Unlock';
            pinSubmitBtn.disabled = false;
        }
    }
    
    // Admin toggle button click
    adminToggleBtn.addEventListener('click', function() {
        if (isAdminUnlocked) {
            // Lock the admin
            isAdminUnlocked = false;
            sessionStorage.removeItem('adminUnlocked');
            updateAdminUI();
            renderProjects();
        } else {
            // Show PIN modal
            pinModal.style.display = 'block';
            clearPinInputs();
            setTimeout(() => pinInputs[0].focus(), 100);
        }
    });
    
    // Close PIN modal
    if (closePinModal) {
        closePinModal.addEventListener('click', function() {
            pinModal.style.display = 'none';
            clearPinInputs();
        });
    }
    
    // Click outside to close
    pinModal.addEventListener('click', function(e) {
        if (e.target === pinModal) {
            pinModal.style.display = 'none';
            clearPinInputs();
        }
    });
    
    // PIN input handling
    pinInputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            const value = e.target.value;
            
            // Only allow numbers
            if (!/^\d*$/.test(value)) {
                e.target.value = '';
                return;
            }
            
            // Move to next input
            if (value && index < pinInputs.length - 1) {
                pinInputs[index + 1].focus();
            }
            
            // Auto-submit when all filled
            if (index === pinInputs.length - 1 && value) {
                setTimeout(verifyPin, 100);
            }
            
            if (pinError) pinError.textContent = '';
            pinInputs.forEach(inp => inp.classList.remove('error'));
        });
        
        // Handle backspace
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                pinInputs[index - 1].focus();
            }
            if (e.key === 'Enter') {
                verifyPin();
            }
        });
        
        // Handle paste
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').slice(0, 4);
            if (/^\d+$/.test(pastedData)) {
                pastedData.split('').forEach((digit, i) => {
                    if (pinInputs[i]) {
                        pinInputs[i].value = digit;
                    }
                });
                if (pastedData.length === 4) {
                    setTimeout(verifyPin, 100);
                }
            }
        });
    });
    
    // Submit button
    if (pinSubmitBtn) {
        pinSubmitBtn.addEventListener('click', verifyPin);
    }
    
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    
    try {
        updateSyncStatus('syncing', '🔄 Connecting...');
        
        // Check if admin was previously unlocked in this session
        isAdminUnlocked = sessionStorage.getItem('adminUnlocked') === 'true';
        updateAdminUI();
        
        // Setup PIN modal first (doesn't need database)
        setupPinModal();
        
        // Setup other event listeners
        setupEventListeners();
        
        // Load PIN hash
        loadPinHash();
        
        // Load projects
        await loadProjects();
        
    } catch (error) {
        console.error('Initialization error:', error);
        updateSyncStatus('error', '⚠️ Error loading');
    }
});

// Load projects from Supabase
async function loadProjects() {
    // If Supabase not available, use localStorage
    if (!db) {
        isOnline = false;
        updateSyncStatus('error', '📁 Local Mode');
        
        projects = JSON.parse(localStorage.getItem('projects')) || [];
        
        updateDashboardStats();
        renderProjects();
        return;
    }
    
    try {
        const { data, error } = await db
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        projects = data || [];
        isOnline = true;

        updateSyncStatus('connected', '☁️ Synced');
        updateDashboardStats();
        renderProjects();

    } catch (error) {
        console.error('Supabase error:', error);
        isOnline = false;
        updateSyncStatus('error', '⚠️ Offline Mode');
        
        // Fall back to localStorage
        projects = JSON.parse(localStorage.getItem('projects')) || [];
        
        updateDashboardStats();
        renderProjects();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.status;
            updateSectionTitle();
            renderProjects();
        });
    });

    // Add project button
    const addProjectBtn = document.getElementById('addProjectBtn');
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', () => {
            openModal();
        });
    }

    // Clear data button
    // Modal close
    document.querySelector('.close').addEventListener('click', closeModal);
    document.querySelector('.cancel-btn').addEventListener('click', closeModal);
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('projectModal');
        if (e.target === modal) {
            closeModal();
        }
    });

    // Form submission
    document.getElementById('projectForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveProject();
    });

    // Status change - show/hide relevant fields
    document.getElementById('projectStatus').addEventListener('change', (e) => {
        updateStatusFields(e.target.value);
    });

    // Progress slider update
    document.getElementById('projectProgress').addEventListener('input', (e) => {
        document.getElementById('progressValue').textContent = e.target.value + '%';
    });
}

// Update which status fields are visible
function updateStatusFields(status) {
    document.querySelectorAll('.status-fields').forEach(el => {
        el.classList.remove('visible');
    });

    const fieldClass = status + '-fields';
    const fields = document.querySelector('.' + fieldClass);
    if (fields) {
        fields.classList.add('visible');
    }
}

// Update dashboard statistics
function updateDashboardStats() {
    const stats = {
        active: projects.filter(p => p.status === 'active').length,
        published: projects.filter(p => p.status === 'published').length,
        planned: projects.filter(p => p.status === 'planned').length,
        dead: projects.filter(p => p.status === 'dead').length,
        total: projects.length
    };

    document.getElementById('statActive').textContent = stats.active;
    document.getElementById('statPublished').textContent = stats.published;
    document.getElementById('statPlanned').textContent = stats.planned;
    document.getElementById('statDead').textContent = stats.dead;
    document.getElementById('statTotal').textContent = stats.total;
}

// Update section title based on filter
function updateSectionTitle() {
    const titleElement = document.getElementById('projectsSectionTitle');
    const titles = {
        'all': 'All Projects',
        'active': 'Active Projects',
        'published': 'Published Projects',
        'planned': 'Planned Projects',
        'dead': 'Dead Projects'
    };
    titleElement.textContent = titles[currentFilter] || 'All Projects';
}

// Generate status-specific HTML
function getStatusDetails(project) {
    switch (project.status) {
        case 'active':
            const progress = project.progress || 0;
            return `
                <div class="project-details">
                    <div class="progress-container">
                        <div class="progress-label">
                            <span>Progress</span>
                            <span>${progress}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </div>
            `;
        
        case 'published':
            let html = '<div class="project-details">';
            if (project.technologies) {
                const techs = project.technologies.split(',').map(t => t.trim());
                html += `<div class="tech-stack">${techs.map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join('')}</div>`;
            }
            html += '<div class="project-links">';
            if (project.link) {
                html += `<a href="${escapeHtml(project.link)}" target="_blank" class="project-link live-link"><span class="link-icon">🌐</span> Live Site</a>`;
            }
            if (project.github) {
                html += `<a href="${escapeHtml(project.github)}" target="_blank" class="project-link github-link"><span class="link-icon">📦</span> GitHub</a>`;
            }
            html += '</div></div>';
            return html;
        
        case 'planned':
            if (project.vision) {
                return `
                    <div class="project-details">
                        <div class="project-vision">
                            <div class="vision-label">💡 Vision</div>
                            <div class="vision-text">${escapeHtml(project.vision)}</div>
                        </div>
                    </div>
                `;
            }
            return '';
        
        case 'dead':
            if (project.reason) {
                return `
                    <div class="project-details">
                        <div class="project-reason">
                            <div class="reason-label">⚰️ Reason</div>
                            <div class="reason-text">${escapeHtml(project.reason)}</div>
                        </div>
                    </div>
                `;
            }
            return '';
        
        default:
            return '';
    }
}

// Render projects based on current filter
function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    const filteredProjects = currentFilter === 'all' 
        ? projects 
        : projects.filter(p => p.status === currentFilter);

    if (filteredProjects.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: white; padding: 40px; background: rgba(255,255,255,0.1); border-radius: 12px; backdrop-filter: blur(10px);">
                <p style="font-size: 1.2rem; margin-bottom: 10px;">No projects found.</p>
                <p style="font-size: 0.9rem; opacity: 0.9;">Click "New Project" to add your first project!</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredProjects.map((project) => `
        <div class="project-card ${project.status}" data-id="${project.id}">
            <div class="project-header">
                <div class="project-name">${escapeHtml(project.name)}</div>
                <span class="project-status ${project.status}">${project.status}</span>
            </div>
            <div class="project-description">${escapeHtml(project.description || 'No description')}</div>
            ${getStatusDetails(project)}
            <div class="project-actions ${!isAdminUnlocked ? 'hidden' : ''}">
                <button class="btn-edit" onclick="editProject('${project.id}')">Edit</button>
                <button class="btn-delete" onclick="deleteProject('${project.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Open modal for adding/editing
function openModal(id = null) {
    const modal = document.getElementById('projectModal');
    const form = document.getElementById('projectForm');
    const title = document.getElementById('modalTitle');
    
    editingId = id;
    
    if (id !== null) {
        title.textContent = 'Edit Project';
        const project = projects.find(p => p.id === id);
        if (!project) return;
        
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectDescription').value = project.description || '';
        document.getElementById('projectStatus').value = project.status;
        
        // Fill status-specific fields
        document.getElementById('projectProgress').value = project.progress || 0;
        document.getElementById('progressValue').textContent = (project.progress || 0) + '%';
        document.getElementById('projectTech').value = project.technologies || '';
        document.getElementById('projectLink').value = project.link || '';
        document.getElementById('projectGithub').value = project.github || '';
        document.getElementById('projectVision').value = project.vision || '';
        document.getElementById('projectReason').value = project.reason || '';
        
        updateStatusFields(project.status);
    } else {
        title.textContent = 'Add New Project';
        form.reset();
        document.getElementById('progressValue').textContent = '0%';
        updateStatusFields('active');
    }
    
    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('projectModal');
    modal.style.display = 'none';
    editingId = null;
    document.getElementById('projectForm').reset();
    document.querySelectorAll('.status-fields').forEach(el => {
        el.classList.remove('visible');
    });
}

// Save project (add or update)
async function saveProject() {
    const name = document.getElementById('projectName').value.trim();
    const description = document.getElementById('projectDescription').value.trim();
    const status = document.getElementById('projectStatus').value;

    if (!name) {
        alert('Please enter a project name');
        return;
    }

    const projectData = {
        name,
        description,
        status,
        progress: null,
        technologies: null,
        link: null,
        github: null,
        vision: null,
        reason: null,
        updated_at: new Date().toISOString()
    };

    // Add status-specific fields
    switch (status) {
        case 'active':
            projectData.progress = parseInt(document.getElementById('projectProgress').value) || 0;
            break;
        case 'published':
            projectData.technologies = document.getElementById('projectTech').value.trim() || null;
            projectData.link = document.getElementById('projectLink').value.trim() || null;
            projectData.github = document.getElementById('projectGithub').value.trim() || null;
            break;
        case 'planned':
            projectData.vision = document.getElementById('projectVision').value.trim() || null;
            break;
        case 'dead':
            projectData.reason = document.getElementById('projectReason').value.trim() || null;
            break;
    }

    updateSyncStatus('syncing', '🔄 Saving...');

    try {
        if (editingId !== null) {
            // Update existing project
            const { error } = await db
                .from('projects')
                .update(projectData)
                .eq('id', editingId);

            if (error) throw error;
        } else {
            // Insert new project
            const { error } = await db
                .from('projects')
                .insert(projectData);

            if (error) throw error;
        }

        await loadProjects();
        closeModal();
        updateSyncStatus('connected', '☁️ Saved!');
        
        setTimeout(() => {
            updateSyncStatus('connected', '☁️ Synced');
        }, 2000);

    } catch (error) {
        console.error('Save error:', error);
        updateSyncStatus('error', '⚠️ Save failed');
        alert('Failed to save project. Please try again.');
    }
}

// Edit project
function editProject(id) {
    if (!isAdminUnlocked) {
        alert('🔒 Admin access required. Click the lock button to unlock.');
        return;
    }
    openModal(id);
}

// Delete project
async function deleteProject(id) {
    if (!isAdminUnlocked) {
        alert('🔒 Admin access required. Click the lock button to unlock.');
        return;
    }
    if (!confirm('Are you sure you want to delete this project?')) return;

    updateSyncStatus('syncing', '🔄 Deleting...');

    try {
        const { error } = await db
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await loadProjects();
        updateSyncStatus('connected', '☁️ Deleted!');
        
        setTimeout(() => {
            updateSyncStatus('connected', '☁️ Synced');
        }, 2000);

    } catch (error) {
        console.error('Delete error:', error);
        updateSyncStatus('error', '⚠️ Delete failed');
        alert('Failed to delete project. Please try again.');
    }
}

// Clear all data
async function clearAllData() {
    if (!isAdminUnlocked) {
        alert('🔒 Admin access required. Click the lock button to unlock.');
        return;
    }
    if (!confirm('Are you sure you want to clear all projects? This action cannot be undone.')) return;

    updateSyncStatus('syncing', '🔄 Clearing...');

    try {
        if (db) {
            // Delete all projects from Supabase
            const { error } = await db
                .from('projects')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');

            if (error) throw error;
        }
        
        // Clear localStorage too
        localStorage.removeItem('projects');
        projects = [];
        
        currentFilter = 'all';
        document.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.remove('active');
            if (b.dataset.status === 'all') b.classList.add('active');
        });
        updateSectionTitle();
        updateDashboardStats();
        renderProjects();
        
        updateSyncStatus('connected', '☁️ Cleared!');
        alert('All projects cleared!');

    } catch (error) {
        console.error('Clear error:', error);
        updateSyncStatus('error', '⚠️ Clear failed');
        alert('Failed to clear data. Please try again.');
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Toggle mobile menu
function toggleMobileMenu() {
    const hamburger = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (hamburger && mobileMenu) {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    }
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const hamburger = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (hamburger && mobileMenu && mobileMenu.classList.contains('active')) {
        if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
        }
    }
});

// Open add project modal - called from mobile menu
function openAddModal() {
    if (!isAdminUnlocked) return;
    
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Add Project';
    document.getElementById('projectName').value = '';
    document.getElementById('projectDescription').value = '';
    document.getElementById('projectStatus').value = 'planned';
    updateStatusFields('planned');
    document.getElementById('projectModal').style.display = 'block';
}

// Toggle admin access - called from onclick
function toggleAdminAccess() {
    const pinModal = document.getElementById('pinModal');
    
    if (isAdminUnlocked) {
        // Lock
        isAdminUnlocked = false;
        sessionStorage.removeItem('adminUnlocked');
        updateAdminUI();
        renderProjects();
    } else {
        // Show PIN modal
        if (pinModal) {
            pinModal.style.display = 'block';
            const firstInput = document.getElementById('pin1');
            if (firstInput) firstInput.focus();
        }
    }
}

// Make functions globally available for onclick handlers
window.editProject = editProject;
window.deleteProject = deleteProject;
window.toggleAdminAccess = toggleAdminAccess;
