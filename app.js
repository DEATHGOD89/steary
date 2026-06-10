/* ==========================================================================
   STEARY STREAMING PLATFORM - JAVASCRIPT
   ========================================================================== */

// Initialize Supabase Client
const SUPABASE_URL = 'https://kmohuqqpfrufkrbtuirt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vSabtm7DCF5PZzcHwO1Mng_fvVCQKwx';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// Theme definition function that supports light/dark mode mappings
function applyThemeVars(themeName, isLight) {
    const THEMES = [
        {
            name: 'red',
            accent: '#EF4444',
            accentRgb: '239, 68, 68',
            accentHover: '#F87171'
        },
        {
            name: 'blue',
            accent: '#3B82F6',
            accentRgb: '59, 130, 246',
            accentHover: '#60A5FA'
        },
        {
            name: 'green',
            accent: '#10B981',
            accentRgb: '16, 185, 129',
            accentHover: '#34D399'
        },
        {
            name: 'orange',
            accent: '#F97316',
            accentRgb: '249, 115, 22',
            accentHover: '#FB923C'
        },
        {
            name: 'white',
            // Special mapping for white theme in light mode to avoid white-on-white invisibility
            accent: isLight ? '#111827' : '#FFFFFF',
            accentRgb: isLight ? '17, 24, 39' : '255, 255, 255',
            accentHover: isLight ? '#374151' : '#E5E7EB'
        },
        {
            name: 'neon-blue',
            accent: '#06B6D4',
            accentRgb: '6, 182, 212',
            accentHover: '#22D3EE'
        }
    ];

    const selectedTheme = THEMES.find(t => t.name === themeName) || THEMES[5];
    const root = document.documentElement;
    root.style.setProperty('--accent', selectedTheme.accent);
    root.style.setProperty('--accent-rgb', selectedTheme.accentRgb);
    root.style.setProperty('--accent-hover', selectedTheme.accentHover);
}

// Persistent 24-Hour Accent Theme Switcher
(function initializeAccentTheme() {
    let selectedThemeName = 'neon-blue';
    try {
        const savedTheme = localStorage.getItem('steary_theme');
        const savedTimestamp = parseInt(localStorage.getItem('steary_theme_timestamp') || '0', 10);
        const now = Date.now();

        // Check if theme exists and is less than 24 hours old
        if (savedTheme && savedTimestamp && (now - savedTimestamp < 86400000)) {
            selectedThemeName = savedTheme;
        } else {
            // Pick a new random theme
            const themeNames = ['red', 'blue', 'green', 'orange', 'white', 'neon-blue'];
            const randomIndex = Math.floor(Math.random() * themeNames.length);
            selectedThemeName = themeNames[randomIndex];
            localStorage.setItem('steary_theme', selectedThemeName);
            localStorage.setItem('steary_theme_timestamp', now.toString());
        }
    } catch (e) {
        console.error('Theme initialization storage error, defaulting to neon-blue:', e);
    }

    let isLight = true;
    try {
        const savedPrefs = localStorage.getItem('steary.profile.preferences');
        if (savedPrefs) {
            const parsed = JSON.parse(savedPrefs);
            isLight = parsed.lightMode !== undefined ? parsed.lightMode : true;
        }
    } catch (e) {}

    applyThemeVars(selectedThemeName, isLight);
})();

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function init() {
    // Analytics Tracker
    function trackAnalytics() {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
        let traffic = JSON.parse(localStorage.getItem('steary.analytics.traffic') || '[]');
        
        if (traffic.length === 0) {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            traffic = days.map(d => ({ day: d, views: Math.floor(Math.random() * 500) + 100, visitors: Math.floor(Math.random() * 200) + 50 }));
        }

        let todayData = traffic.find(t => t.day === today);
        if (!todayData) {
            // Rotate days if needed, but since it's a fixed 7-day array, we just update the matching day
            todayData = { day: today, views: 0, visitors: 0 };
            traffic.push(todayData);
            if (traffic.length > 7) traffic.shift();
        }
        
        todayData.views += 1;
        if (!sessionStorage.getItem('steary_visited_today')) {
            todayData.visitors += 1;
            sessionStorage.setItem('steary_visited_today', 'true');
        }

        localStorage.setItem('steary.analytics.traffic', JSON.stringify(traffic));
    }
    trackAnalytics();



    // DOM Cache
    const viewport = document.getElementById('viewport');
    const navUnderline = document.getElementById('navUnderline');
    const navTabsContainer = document.getElementById('navTabsContainer');
    const navTabs = document.querySelectorAll('.nav-tab');
    const progressBars = document.querySelectorAll('.progress-bar');
    const searchInput = document.getElementById('movieSearch');

    // Carousel Elements
    const heroPrevBtn = document.getElementById('heroPrevBtn');
    const heroNextBtn = document.getElementById('heroNextBtn');
    let currentHeroSlide = 0;
    let heroInterval;
    let closeTimeout = null; // Asynchronous race-condition track pointer

    /* ==========================================================================
       4. Hero Carousel Logic
       ========================================================================== */
    function showSlide(index) {
        const slides = document.querySelectorAll('.hero-slide');
        if (slides.length === 0) return;
        
        slides.forEach(slide => slide.classList.remove('active'));
        currentHeroSlide = (index + slides.length) % slides.length;
        slides[currentHeroSlide].classList.add('active');
    }

    function nextSlide() {
        showSlide(currentHeroSlide + 1);
    }

    function prevSlide() {
        showSlide(currentHeroSlide - 1);
    }

    if (heroNextBtn && heroPrevBtn) {
        heroNextBtn.addEventListener('click', () => {
            nextSlide();
            resetAutoplay();
        });

        heroPrevBtn.addEventListener('click', () => {
            prevSlide();
            resetAutoplay();
        });
    }

    function startAutoplay() {
        if (typeof preferenceState !== 'undefined' && !preferenceState.autoplayHero) {
            return;
        }
        clearInterval(heroInterval);
        heroInterval = setInterval(nextSlide, 7000);
    }

    function resetAutoplay() {
        startAutoplay();
    }

    // Responsive Elements
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const leftPanelStack = document.getElementById('leftPanelStack');
    const mobileHamburger = document.getElementById('mobileHamburger');

    // Video Player Elements
    const playerOverlay = document.getElementById('playerOverlay');
    const playerCloseBtn = document.getElementById('playerCloseBtn');
    const playerIframe = document.getElementById('playerIframe');
    const playerMovieTitle = document.getElementById('playerMovieTitle');

    // Project Preview Elements
    const projectOverlay = document.getElementById('projectOverlay');
    const projectBackBtn = document.getElementById('projectBackBtn');
    const projectIframe = document.getElementById('projectIframe');
    const projectPreviewTitle = document.getElementById('projectPreviewTitle');
    const projectContainer = projectOverlay ? projectOverlay.querySelector('.project-container') : null;
    const projectFullscreenBtn = document.getElementById('projectFullscreenBtn');
    const projectIframeWrapper = document.getElementById('projectIframeWrapper');

    // Notification and Profile Elements
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const notificationList = document.getElementById('notificationList');
    const clearNotificationsBtn = document.getElementById('clearNotificationsBtn');
    const notificationBadge = document.getElementById('notificationBadge');

    const profileOverlay = document.getElementById('profileOverlay');
    const profileCenterCloseBtn = document.getElementById('profileCenterCloseBtn');
    const profileCenterTabs = document.querySelectorAll('.profile-center-tab');
    const profilePanelMap = document.querySelectorAll('.profile-center-panel');
    const profileCenterNav = document.querySelector('.profile-center-nav');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const resetProfileBtn = document.getElementById('resetProfileBtn');
    const savePasswordBtn = document.getElementById('savePasswordBtn');
    const clearLocalDataBtn = document.getElementById('clearLocalDataBtn');
    const profileDisplayNameInput = document.getElementById('profileDisplayName');
    const profileHandleInput = document.getElementById('profileHandle');
    const profileEmailInput = document.getElementById('profileEmail');
    const profileWebsiteInput = document.getElementById('profileWebsite');
    const profileBioInput = document.getElementById('profileBio');
    const profileAvatarUrlInput = document.getElementById('profileAvatarUrl');
    const profileAvatarFileInput = document.getElementById('profileAvatarFile');
    const profileAvatarPreview = document.getElementById('profileAvatarPreview');
    const profileDisplayNamePreview = document.getElementById('profileDisplayNamePreview');
    const profileHandlePreview = document.getElementById('profileHandlePreview');
    const profileNotificationList = document.getElementById('profileNotificationList');
    const settingAutoplay = document.getElementById('settingAutoplay');
    const settingNotifications = document.getElementById('settingNotifications');
    const settingCompact = document.getElementById('settingCompact');
    const settingPrivateProfile = document.getElementById('settingPrivateProfile');
    const settingLightMode = document.getElementById('settingLightMode');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const accountCurrentPassword = document.getElementById('accountCurrentPassword');
    const accountNewPassword = document.getElementById('accountNewPassword');
    const accountConfirmPassword = document.getElementById('accountConfirmPassword');
    const profileAvatarImg = document.querySelector('.profile-avatar-img');

    const PROFILE_STORAGE_KEY = 'steary.profile.state';
    const PROFILE_PREFS_KEY = 'steary.profile.preferences';
    const NOTIFICATION_TTL = 24 * 60 * 60 * 1000;

    const defaultProfileState = {
        displayName: 'Guest User',
        handle: '@guest',
        email: '',
        website: '',
        bio: 'A Steary user watching trailers, projects, and live updates.',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        securityNote: 'Password changes are handled locally on this device.',
        isLoggedIn: false
    };

    const defaultPreferenceState = {
        autoplayHero: true,
        notifications: true,
        compactMobile: true,
        privateProfile: false,
        lightMode: true
    };

    let profileState = loadStoredProfileState();
    let preferenceState = loadStoredPreferenceState();
    let notificationState = {
        items: [],
        knownIds: new Set(),
        pollTimer: null,
        pruneTimer: null,
        seeded: false,
    };

    /* ==========================================================================
       Toast Notification System
       ========================================================================== */
    function showToast(message, duration = 7000) {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // Avoid duplicate active toasts with the exact same tip text
        const activeToasts = container.querySelectorAll('.toast');
        for (let t of activeToasts) {
            if (t.querySelector('.toast-content').textContent === message) {
                return;
            }
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="toast-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
            </div>
            <div class="toast-content"></div>
            <button class="toast-close" aria-label="Close Notification">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;

        toast.querySelector('.toast-content').textContent = message;
        container.appendChild(toast);

        // Slide in
        requestAnimationFrame(() => {
            setTimeout(() => {
                toast.classList.add('show');
            }, 50);
        });

        // Close event
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            dismissToast(toast);
        });

        // Auto dismiss
        const timeoutId = setTimeout(() => {
            dismissToast(toast);
        }, duration);

        toast.dataset.timeoutId = timeoutId;
    }

    function dismissToast(toast) {
        if (toast.classList.contains('show')) {
            toast.classList.remove('show');
            clearTimeout(toast.dataset.timeoutId);
            setTimeout(() => {
                toast.remove();
            }, 400);
        }
    }

    function safeReadStorage(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return { ...fallback, ...JSON.parse(raw) };
        } catch (e) {
            return fallback;
        }
    }

    function loadStoredProfileState() {
        return safeReadStorage(PROFILE_STORAGE_KEY, defaultProfileState);
    }

    function loadStoredPreferenceState() {
        return safeReadStorage(PROFILE_PREFS_KEY, defaultPreferenceState);
    }

    function persistProfileState() {
        try {
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileState));
        } catch (e) {
            console.warn('Unable to save profile state locally.');
        }
    }

    function saveToLocalUserDatabase(state) {
        if (!state.email) return;
        try {
            const dbRaw = localStorage.getItem('steary.users.database') || '{}';
            let db = {};
            try {
                db = JSON.parse(dbRaw);
            } catch (e) {}
            db[state.email.toLowerCase()] = {
                displayName: state.displayName,
                handle: state.handle,
                bio: state.bio,
                website: state.website,
                avatarUrl: state.avatarUrl,
                securityNote: state.securityNote
            };
            localStorage.setItem('steary.users.database', JSON.stringify(db));
        } catch (e) {
            console.warn('Unable to save user profile to database.', e);
        }
    }

    function persistPreferenceState() {
        try {
            localStorage.setItem(PROFILE_PREFS_KEY, JSON.stringify(preferenceState));
        } catch (e) {
            console.warn('Unable to save preference state locally.');
        }
    }

    const hourlyThemes = Array(24).fill({ bg: '#FAF7F2', shadow: 'rgba(0, 0, 0, 0.05)' });

    function updateHourlyTheme() {
        if (!preferenceState.lightMode) return;
        const currentHour = new Date().getHours();
        const theme = hourlyThemes[currentHour] || hourlyThemes[0];
        document.documentElement.style.setProperty('--hour-bg', theme.bg);
        document.documentElement.style.setProperty('--hour-shadow', theme.shadow);
    }

    function setTheme(isLight, shouldPersist = true) {
        document.body.classList.toggle('light-mode', isLight);
        preferenceState.lightMode = isLight;
        if (settingLightMode) settingLightMode.checked = isLight;
        if (shouldPersist) {
            persistPreferenceState();
        }
        updateHourlyTheme();

        // Pause/play hero showcase video dynamically based on light/dark mode
        try {
            const heroVideo = document.querySelector('.skills-hero-video');
            if (heroVideo) {
                if (isLight) {
                    heroVideo.pause();
                } else {
                    if (heroVideo.src) {
                        heroVideo.play().catch(() => {});
                    } else if (heroVideo.dataset.src) {
                        heroVideo.src = heroVideo.dataset.src;
                        heroVideo.load();
                        heroVideo.play().catch(() => {});
                    }
                }
            }
        } catch (e) {}

        // Re-apply the accent theme variables based on light mode state
        try {
            const savedThemeName = localStorage.getItem('steary_theme') || 'neon-blue';
            applyThemeVars(savedThemeName, isLight);
        } catch (e) {}
    }

    function normalizeHandle(value) {
        const raw = (value || '').trim();
        if (!raw) return '@guest';
        return raw.startsWith('@') ? raw : `@${raw}`;
    }

    function applyProfileStateToUi() {
        if (profileDisplayNameInput) profileDisplayNameInput.value = profileState.displayName || '';
        if (profileHandleInput) profileHandleInput.value = profileState.handle || '';
        if (profileEmailInput) profileEmailInput.value = profileState.email || '';
        if (profileWebsiteInput) profileWebsiteInput.value = profileState.website || '';
        if (profileBioInput) profileBioInput.value = profileState.bio || '';
        if (profileAvatarUrlInput) profileAvatarUrlInput.value = profileState.avatarUrl || '';
        if (profileAvatarPreview) profileAvatarPreview.src = profileState.avatarUrl || defaultProfileState.avatarUrl;
        if (profileDisplayNamePreview) profileDisplayNamePreview.textContent = profileState.displayName || defaultProfileState.displayName;
        if (profileHandlePreview) profileHandlePreview.textContent = profileState.handle || defaultProfileState.handle;
        if (profileAvatarImg && profileState.avatarUrl) profileAvatarImg.src = profileState.avatarUrl;

        // Toggle Login button vs Profile card visibility
        const authLoginBtn = document.getElementById('authLoginBtn');
        const userProfileToggle = document.getElementById('userProfileToggle');
        
        if (profileState.isLoggedIn) {
            if (authLoginBtn) authLoginBtn.classList.add('hidden');
            if (userProfileToggle) userProfileToggle.classList.remove('hidden');
        } else {
            if (authLoginBtn) authLoginBtn.classList.remove('hidden');
            if (userProfileToggle) userProfileToggle.classList.add('hidden');
        }
    }

    function applyPreferenceStateToUi() {
        if (settingAutoplay) settingAutoplay.checked = !!preferenceState.autoplayHero;
        if (settingNotifications) settingNotifications.checked = !!preferenceState.notifications;
        if (settingCompact) settingCompact.checked = !!preferenceState.compactMobile;
        if (settingPrivateProfile) settingPrivateProfile.checked = !!preferenceState.privateProfile;
        if (settingLightMode) settingLightMode.checked = !!preferenceState.lightMode;
        setTheme(!!preferenceState.lightMode, false);
    }

    function renderNotificationItems() {
        const now = Date.now();
        notificationState.items = notificationState.items.filter(item => item.expiresAt > now);

        const renderList = (container) => {
            if (!container) return;

            if (notificationState.items.length === 0) {
                container.innerHTML = '<div class="notification-empty">No new updates yet.</div>';
                return;
            }

            container.innerHTML = notificationState.items.map(item => `
                <div class="notification-item">
                    <strong>${escapeHtml(item.title)}</strong>
                    <p>${escapeHtml(item.message)}</p>
                    <time>${escapeHtml(item.timeLabel)}</time>
                </div>
            `).join('');
        };

        renderList(notificationList);
        renderList(profileNotificationList);

        if (notificationBadge) {
            if (notificationState.items.length > 0 && preferenceState.notifications !== false) {
                notificationBadge.style.display = 'flex';
                notificationBadge.textContent = notificationState.items.length > 9 ? '9+' : String(notificationState.items.length);
            } else {
                notificationBadge.style.display = 'none';
                notificationBadge.textContent = '';
            }
        }
    }

    function addNotification(item) {
        if (!item || !item.id) return;
        if (notificationState.knownIds.has(item.id)) return;

        notificationState.knownIds.add(item.id);
        notificationState.items.unshift({
            id: item.id,
            title: item.title,
            message: item.message,
            timeLabel: item.timeLabel || 'Just now',
            expiresAt: Date.now() + NOTIFICATION_TTL,
        });

        renderNotificationItems();

        if (item.toast !== false) {
            showToast(item.message, 5000);
        }
    }

    function clearNotifications() {
        notificationState.items = [];
        renderNotificationItems();
    }

    function pruneExpiredNotifications() {
        renderNotificationItems();
    }

    function setActiveProfileSection(section) {
        const activeSection = section || 'view';

        profileCenterTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.profileTab === activeSection);
        });

        profilePanelMap.forEach(panel => {
            panel.classList.toggle('active', panel.id === `profilePanel-${activeSection}`);
        });

        if (profileOverlay) {
            profileOverlay.classList.add('show');
            profileOverlay.setAttribute('aria-hidden', 'false');
        }
    }

    function closeProfileCenter() {
        if (profileOverlay) {
            profileOverlay.classList.remove('show');
            profileOverlay.setAttribute('aria-hidden', 'true');
        }
    }

    function saveProfile() {
        profileState.displayName = profileDisplayNameInput ? profileDisplayNameInput.value.trim() || defaultProfileState.displayName : profileState.displayName;
        profileState.handle = normalizeHandle(profileHandleInput ? profileHandleInput.value : profileState.handle);
        profileState.email = profileEmailInput ? profileEmailInput.value.trim() : profileState.email;
        profileState.website = profileWebsiteInput ? profileWebsiteInput.value.trim() : profileState.website;
        profileState.bio = profileBioInput ? profileBioInput.value.trim() : profileState.bio;
        profileState.avatarUrl = profileAvatarUrlInput ? profileAvatarUrlInput.value.trim() || defaultProfileState.avatarUrl : profileState.avatarUrl;
        persistProfileState();
        saveToLocalUserDatabase(profileState);
        applyProfileStateToUi();
        showToast('Profile saved locally on this device.');
    }

    function resetProfile() {
        profileState = { ...defaultProfileState };
        persistProfileState();
        saveToLocalUserDatabase(profileState);
        applyProfileStateToUi();
        showToast('Profile reset to defaults.');
    }

    function saveLocalPasswordNote() {
        const newValue = accountNewPassword ? accountNewPassword.value.trim() : '';
        const confirmValue = accountConfirmPassword ? accountConfirmPassword.value.trim() : '';

        if (!newValue || !confirmValue) {
            showToast('Enter a new password and confirm it.');
            return;
        }

        if (newValue !== confirmValue) {
            showToast('Password confirmation does not match.');
            return;
        }

        profileState.securityNote = `Password note updated locally on ${new Date().toLocaleString()}.`;
        persistProfileState();

        if (accountCurrentPassword) accountCurrentPassword.value = '';
        if (accountNewPassword) accountNewPassword.value = '';
        if (accountConfirmPassword) accountConfirmPassword.value = '';

        showToast('Password note saved locally.');
    }

    function clearLocalProfileData() {
        try {
            localStorage.removeItem(PROFILE_STORAGE_KEY);
            localStorage.removeItem(PROFILE_PREFS_KEY);
        } catch (e) {
            // Ignore local storage errors.
        }
        profileState = { ...defaultProfileState };
        preferenceState = { ...defaultPreferenceState };
        applyProfileStateToUi();
        applyPreferenceStateToUi();
        clearNotifications();
        showToast('Local profile data cleared.');
    }

    function openNotificationDropdown() {
        if (!notificationDropdown) return;
        notificationDropdown.classList.add('show');
        if (notificationBtn) notificationBtn.setAttribute('aria-expanded', 'true');
    }

    function closeNotificationDropdown() {
        if (!notificationDropdown) return;
        notificationDropdown.classList.remove('show');
        if (notificationBtn) notificationBtn.setAttribute('aria-expanded', 'false');
    }

    async function seedNotificationBaseline() {
        const sources = [
            { table: 'projects', label: 'Project', titleField: 'name' },
            { table: 'slider', label: 'Banner', titleField: 'title' },
        ];

        await Promise.all(sources.map(async (source) => {
            try {
                const { data } = await supabaseClient
                    .from(source.table)
                    .select('id')
                    .order('id', { ascending: false })
                    .limit(12);

                (data || []).forEach(row => {
                    notificationState.knownIds.add(`${source.table}:${row.id}`);
                });
            } catch (e) {
                // Silent fallback: notifications still work for future polls.
            }
        }));

        notificationState.seeded = true;
    }

    async function pollNotificationSource(table, label, titleField) {
        try {
            const { data } = await supabaseClient
                .from(table)
                .select(`id, ${titleField}`)
                .order('id', { ascending: false })
                .limit(5);

            (data || []).reverse().forEach(row => {
                const uniqueId = `${table}:${row.id}`;
                if (notificationState.knownIds.has(uniqueId)) return;

                const itemTitle = row[titleField] || 'New update';
                addNotification({
                    id: uniqueId,
                    title: `New ${label}`,
                    message: `${itemTitle} was added to Steary.`,
                    timeLabel: 'Just now',
                    toast: true,
                });
            });
        } catch (e) {
            console.error(`Notification poll failed for ${table}:`, e);
        }
    }

    async function startLiveNotifications() {
        if (!preferenceState.notifications) {
            renderNotificationItems();
            return;
        }

        if (!notificationState.seeded) {
            await seedNotificationBaseline();
        }

        renderNotificationItems();
        await Promise.all([
            pollNotificationSource('projects', 'Project', 'name'),
            pollNotificationSource('slider', 'Banner', 'title'),
        ]);

        if (!notificationState.pollTimer) {
            notificationState.pollTimer = setInterval(() => {
                if (preferenceState.notifications) {
                    pollNotificationSource('projects', 'Project', 'name');
                    pollNotificationSource('slider', 'Banner', 'title');
                }
            }, 60000);
        }

        if (!notificationState.pruneTimer) {
            notificationState.pruneTimer = setInterval(pruneExpiredNotifications, 60000);
        }
    }

    /* ==========================================================================
       1. Staggered Entry and Progress Animations
       ========================================================================== */
    function initializeAnimations() {
        const staggeredItems = document.querySelectorAll('.animate-staggered-item');
        staggeredItems.forEach((item, index) => {
            if (item.style.opacity === '1') return; // Skip already animated items
            item.style.opacity = '0';
            item.style.transform = 'translateY(16px)';
            item.style.transition = 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1), transform 500ms cubic-bezier(0.16, 1, 0.3, 1)';
            item.style.transitionDelay = `${index * 60}ms`;
            
            requestAnimationFrame(() => {
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, 50);
            });
        });

        // Animate Progress Bars
        progressBars.forEach(bar => {
            bar.style.width = '0%';
            const style = bar.getAttribute('style');
            if (style && style.includes('--target-width')) {
                const widthMatch = style.match(/--target-width:\s*(\d+)%/);
                if (widthMatch) {
                    const targetWidth = widthMatch[1];
                    setTimeout(() => {
                        bar.style.transition = 'width 800ms cubic-bezier(0.4, 0, 0.2, 1)';
                        bar.style.width = `${targetWidth}%`;
                    }, 300);
                }
            }
        });
    }

    /* ==========================================================================
       2. Sliding Tab Navigation Underline
       ========================================================================== */
    function updateNavUnderline(activeTab) {
        if (!activeTab || window.innerWidth <= 768) {
            navUnderline.style.width = '0px';
            return;
        }
        
        const tabRect = activeTab.getBoundingClientRect();
        const containerRect = navTabsContainer.getBoundingClientRect();
        
        const leftOffset = tabRect.left - containerRect.left;
        const tabWidth = tabRect.width;
        
        navUnderline.style.left = `${leftOffset}px`;
        navUnderline.style.width = `${tabWidth}px`;
    }

    // Set initial position
    const initialActiveTab = document.querySelector('.nav-tab.active');
    setTimeout(() => updateNavUnderline(initialActiveTab), 200);

    // Event listener for clicks on tabs
    navTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            handleTabClick(tab, e);
        });
    });
    window.addEventListener('popstate', handleRoute);

    let resizeAnimationFrame;
    window.addEventListener('resize', () => {
        if (resizeAnimationFrame) {
            cancelAnimationFrame(resizeAnimationFrame);
        }
        resizeAnimationFrame = requestAnimationFrame(() => {
            const currentActive = document.querySelector('.nav-tab.active');
            updateNavUnderline(currentActive);
        });
    });

    // Hero View All navigation tabs wiring
    const mainContentGridEl = document.getElementById('mainContentGrid');
    if (mainContentGridEl) {
        mainContentGridEl.addEventListener('click', (e) => {
            const targetBtn = e.target.closest('[data-target-tab]');
            if (targetBtn) {
                e.preventDefault();
                const targetTabCategory = targetBtn.dataset.targetTab;
                const tab = document.querySelector(`.nav-tab[data-tab="${targetTabCategory}"]`);
                if (tab) {
                    tab.click();
                }
            }
        });
    }

    const skillsHeroSectionEl = document.getElementById('skillsHeroSection');
    if (skillsHeroSectionEl) {
        skillsHeroSectionEl.addEventListener('click', (e) => {
            const targetBtn = e.target.closest('[data-target-tab]');
            if (targetBtn) {
                e.preventDefault();
                const targetTabCategory = targetBtn.dataset.targetTab;
                const tab = document.querySelector(`.nav-tab[data-tab="${targetTabCategory}"]`);
                if (tab) {
                    tab.click();
                }
            }
        });
    }

    /* ==========================================================================
       3. Live Search Filtration
       ========================================================================== */
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const currentMovieCards = document.querySelectorAll('.movie-card');
        
        currentMovieCards.forEach(card => {
            const title = card.querySelector('.movie-title').textContent.toLowerCase();
            const desc = card.querySelector('.movie-desc').textContent.toLowerCase();
            const genre = card.querySelector('.card-genre-badge') ? card.querySelector('.card-genre-badge').textContent.toLowerCase() : '';
            
            if (title.includes(query) || desc.includes(query) || genre.includes(query)) {
                card.style.display = '';
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            } else {
                card.style.display = 'none';
            }
        });
    });

    function navigate(path) {
        try {
            window.history.pushState(null, '', path);
        } catch (e) {
            console.error('History pushState error:', e);
        }
        handleRoute();
    }

    function handleTabClick(tab, e) {
        e.preventDefault();
        const tabCategory = tab.dataset.tab;
        
        let path = '/';
        const basePath = window.location.pathname.replace(/\/(dev-tools|ai-hub|projects|extensions|index\.html)$/, '');
        const slash = basePath.endsWith('/') ? '' : '/';
        
        if (tabCategory === 'dev-tools') path = `${basePath}${slash}dev-tools`;
        else if (tabCategory === 'ai-hub') path = `${basePath}${slash}ai-hub`;
        else if (tabCategory === 'projects') path = `${basePath}${slash}projects`;
        else if (tabCategory === 'extensions') path = `${basePath}${slash}extensions`;
        else path = `${basePath}${slash}`;

        navigate(path);
    }

    function handleRoute() {
        const path = window.location.pathname;
        const devtoolsHub = document.getElementById('devtoolsHubContainer');
        const aiHub = document.getElementById('aiHubContainer');
        const projectsHub = document.getElementById('projectsHubContainer');
        const mainContentGrid = document.getElementById('mainContentGrid');
        const bottomContainer = document.querySelector('.bottom-container');
        const recommendationsGrid = document.getElementById('recommendationsGrid');
        const recommendationsRow = document.getElementById('recommendationsRow');

        // Deactivate all navbar tabs
        const allTabs = document.querySelectorAll('.nav-tab');
        allTabs.forEach(t => t.classList.remove('active'));

        const heroPanel = document.getElementById('heroPanel');
        const skillsHeroSection = document.getElementById('skillsHeroSection');
        const sliderHeader = document.getElementById('sliderHeader');
        const sliderDescription = document.getElementById('sliderDescription');

        // Hide all section containers by default
        if (heroPanel) heroPanel.classList.add('hidden');
        if (skillsHeroSection) skillsHeroSection.classList.add('hidden');
        if (sliderHeader) sliderHeader.classList.add('hidden');
        if (sliderDescription) sliderDescription.classList.add('hidden');
        if (devtoolsHub) devtoolsHub.classList.add('hidden');
        if (aiHub) aiHub.classList.add('hidden');
        if (projectsHub) projectsHub.classList.add('hidden');
        if (mainContentGrid) mainContentGrid.classList.add('hidden');
        if (bottomContainer) bottomContainer.classList.add('hidden');

        // Restore recommendations grid to home bottom row if it was in projects hub
        if (recommendationsRow && recommendationsGrid && !recommendationsRow.contains(recommendationsGrid)) {
            recommendationsRow.appendChild(recommendationsGrid);
        }

        if (path === '/dev-tools' || path.endsWith('/dev-tools')) {
            const activeTab = document.querySelector('.nav-tab[data-tab="dev-tools"]');
            if (activeTab) {
                activeTab.classList.add('active');
                updateNavUnderline(activeTab);
            }
            if (devtoolsHub) devtoolsHub.classList.remove('hidden');
            
            // Show all developer tools
            const cards = devtoolsHub.querySelectorAll('.devtools-card');
            cards.forEach(c => c.style.display = '');
        } 
        else if (path === '/ai-hub' || path.endsWith('/ai-hub')) {
            const activeTab = document.querySelector('.nav-tab[data-tab="ai-hub"]');
            if (activeTab) {
                activeTab.classList.add('active');
                updateNavUnderline(activeTab);
            }
            if (aiHub) aiHub.classList.remove('hidden');
            
            // Show all AI tools
            const cards = aiHub.querySelectorAll('.ai-card');
            cards.forEach(c => c.style.display = '');
        } 
        else if (path === '/projects' || path.endsWith('/projects')) {
            const activeTab = document.querySelector('.nav-tab[data-tab="projects"]');
            if (activeTab) {
                activeTab.classList.add('active');
                updateNavUnderline(activeTab);
            }
            if (projectsHub && recommendationsGrid) {
                projectsHub.appendChild(recommendationsGrid);
            }
            if (projectsHub) projectsHub.classList.remove('hidden');

            // Set Projects Hub headers for Projects
            const heading = projectsHub.querySelector('.projects-header h2');
            if (heading) heading.textContent = 'My Projects';
            const paragraph = projectsHub.querySelector('.projects-header p');
            if (paragraph) paragraph.textContent = 'Discover my full applications, software products, and tools.';

            // Show all cards that are projects but NOT extensions
            const cards = document.querySelectorAll('#recommendationsGrid .movie-card');
            cards.forEach(card => {
                const genre = card.dataset.genre ? card.dataset.genre.toLowerCase() : '';
                if (genre !== 'extensions') {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        } 
        else if (path === '/extensions' || path.endsWith('/extensions')) {
            const activeTab = document.querySelector('.nav-tab[data-tab="extensions"]');
            if (activeTab) {
                activeTab.classList.add('active');
                updateNavUnderline(activeTab);
            }
            if (projectsHub && recommendationsGrid) {
                projectsHub.appendChild(recommendationsGrid);
            }
            if (projectsHub) projectsHub.classList.remove('hidden');

            // Set Projects Hub headers for Extensions
            const heading = projectsHub.querySelector('.projects-header h2');
            if (heading) heading.textContent = 'My Extensions';
            const paragraph = projectsHub.querySelector('.projects-header p');
            if (paragraph) paragraph.textContent = 'Discover my custom browser extensions and plugins.';

            // Show only cards that are extensions
            const cards = document.querySelectorAll('#recommendationsGrid .movie-card');
            cards.forEach(card => {
                const genre = card.dataset.genre ? card.dataset.genre.toLowerCase() : '';
                if (genre === 'extensions') {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        } 
        else {
            // Home page / fallback
            const activeTab = document.querySelector('.nav-tab[data-tab="home"]');
            if (activeTab) {
                activeTab.classList.add('active');
                updateNavUnderline(activeTab);
            }
            if (skillsHeroSection) {
                skillsHeroSection.classList.remove('hidden');
            }
            if (heroPanel) {
                heroPanel.classList.remove('hidden');
                resetAutoplay();
            }
            if (sliderHeader) {
                sliderHeader.classList.remove('hidden');
            }
            if (sliderDescription) {
                sliderDescription.classList.remove('hidden');
            }
            if (mainContentGrid) mainContentGrid.classList.remove('hidden');
            if (bottomContainer) bottomContainer.classList.remove('hidden');

            // Reset visibility of movie-cards in Home content
            const cards = document.querySelectorAll('.movie-card');
            cards.forEach(card => {
                card.style.display = '';
            });

            // Re-render trending data on every home navigation to fix disappearing data
            renderTrendingList();
        }
    }

    // Keep function for compatibility in other files if referenced
    function filterMoviesByCategory(category) {
        let path = '/';
        const basePath = window.location.pathname.replace(/\/(dev-tools|ai-hub|projects|extensions|index\.html)$/, '');
        const slash = basePath.endsWith('/') ? '' : '/';
        
        if (category === 'tools' || category === 'dev-tools') path = `${basePath}${slash}dev-tools`;
        else if (category === 'ai' || category === 'ai-hub') path = `${basePath}${slash}ai-hub`;
        else if (category === 'extensions') path = `${basePath}${slash}extensions`;
        else if (category === 'projects') path = `${basePath}${slash}projects`;
        else path = `${basePath}${slash}`;

        navigate(path);
    }




    /* ==========================================================================
       6. Simulated Video Player Modal (Event Delegation)
       ========================================================================== */
    function isValidStreamUrl(url) {
        if (!url) return false;
        try {
            const parsedUrl = new URL(url, window.location.origin);
            const trustedDomains = [
                'youtube.com',
                'www.youtube.com',
                'youtu.be',
                'youtube-nocookie.com',
                'www.youtube-nocookie.com',
                'resumesuit.netlify.app'
            ];
            return parsedUrl.origin === window.location.origin || 
                   trustedDomains.includes(parsedUrl.hostname) ||
                   trustedDomains.some(d => parsedUrl.hostname.endsWith('.' + d));
        } catch (e) {
            return false;
        }
    }

    function normalizeStreamUrl(url) {
        if (!url) return '';

        try {
            const parsedUrl = new URL(url, window.location.origin);
            const host = parsedUrl.hostname.toLowerCase();

            if (host === 'youtu.be') {
                const videoId = parsedUrl.pathname.replace('/', '').trim();
                if (videoId) {
                    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
                }
            }

            if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
                const embedMatch = parsedUrl.pathname.match(/\/embed\/([^/?]+)/);
                if (embedMatch && embedMatch[1]) {
                    return `https://www.youtube-nocookie.com/embed/${embedMatch[1]}?autoplay=1&rel=0`;
                }

                const watchId = parsedUrl.searchParams.get('v');
                if (watchId) {
                    return `https://www.youtube-nocookie.com/embed/${watchId}?autoplay=1&rel=0`;
                }

                const shortsMatch = parsedUrl.pathname.match(/\/shorts\/([^/?]+)/);
                if (shortsMatch && shortsMatch[1]) {
                    return `https://www.youtube-nocookie.com/embed/${shortsMatch[1]}?autoplay=1&rel=0`;
                }
            }

            if (parsedUrl.search) {
                return `${parsedUrl.toString()}${parsedUrl.search.includes('autoplay=1') ? '' : '&autoplay=1'}`;
            }

            return `${parsedUrl.toString()}?autoplay=1`;
        } catch (e) {
            return url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`;
        }
    }

    function openPlayerOverlay(videoUrl, title) {
        if (!playerOverlay || !playerIframe) return;
        if (!videoUrl || videoUrl === '#') return;

        if (!isValidStreamUrl(videoUrl)) {
            console.error("Security Block: Blocked loading an untrusted external stream origin.");
            return;
        }

        playerIframe.src = normalizeStreamUrl(videoUrl);
        playerMovieTitle.textContent = `Streaming: ${title || 'Stream'}`;
        playerOverlay.classList.add('show');
    }

    function createFallbackPosterDataUrl(title) {
        const safeTitle = (title || 'No Preview')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .slice(0, 32);

        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">
                <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#111827"/>
                        <stop offset="100%" stop-color="#1f2937"/>
                    </linearGradient>
                </defs>
                <rect width="640" height="360" fill="url(#g)"/>
                <rect x="40" y="40" width="560" height="280" rx="24" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.16)"/>
                <text x="320" y="248" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="600">${safeTitle}</text>
            </svg>
        `;

        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }

    document.addEventListener('click', (e) => {
        // Handle Open Trending Button Click
        const openTrendingBtn = e.target.closest('.btn-open-trending');
        if (openTrendingBtn) {
            e.preventDefault();
            e.stopPropagation();
            const url = openTrendingBtn.dataset.url;
            const name = openTrendingBtn.dataset.name;
            const type = openTrendingBtn.dataset.type;
            window.registerStearyInteraction(name, type, 'launch');
            if (url && url !== '#') {
                if (type === 'Project') {
                    const projectOverlay = document.getElementById('projectOverlay');
                    const projectIframe = document.getElementById('projectIframe');
                    const projectPreviewTitle = document.getElementById('projectPreviewTitle');
                    const projectIframeWrapper = document.getElementById('projectIframeWrapper');
                    const iframeLoader = document.getElementById('iframeLoader');
                    
                    if (projectIframe && projectOverlay) {
                        if (closeTimeout) { clearTimeout(closeTimeout); closeTimeout = null; }
                        if (projectIframeWrapper) {
                            projectIframeWrapper.classList.remove('loaded');
                            projectIframeWrapper.classList.add('loading');
                        }
                        if (iframeLoader) iframeLoader.classList.remove('hidden');
                        
                        projectIframe.src = url;
                        projectPreviewTitle.textContent = `Project: ${name}`;
                        projectOverlay.classList.add('show');
                    } else {
                        window.open(url, '_blank', 'noopener,noreferrer');
                    }
                } else {
                    window.open(url, '_blank', 'noopener,noreferrer');
                }
            }
            return;
        }

        // Handle View Post Button (Hero Carousel Slider) click
        const viewPostBtn = e.target.closest('.btn-view-post');
        if (viewPostBtn) {
            e.stopPropagation();
            const url = viewPostBtn.dataset.websiteUrl;
            if (url && url !== '#') {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
            return;
        }

        // Handle AI Card click
        const aiCard = e.target.closest('.ai-card');
        if (aiCard) {
            e.stopPropagation();
            const name = aiCard.querySelector('h3')?.textContent || aiCard.getAttribute('aria-label') || 'AI Tool';
            window.registerStearyInteraction(name, 'AI Tool', 'click');
            const url = aiCard.dataset.url;
            if (url && url !== '#') {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
            return;
        }

        // Handle Dev Tool Card click
        const devCard = e.target.closest('.devtools-card');
        if (devCard) {
            e.stopPropagation();
            const name = devCard.querySelector('h3')?.textContent || devCard.getAttribute('aria-label') || 'Dev Tool';
            window.registerStearyInteraction(name, 'Dev Tool', 'click');
            const url = devCard.dataset.url;
            if (url && url !== '#') {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
            return;
        }

        // Handle Best Tool Card click
        const bestTool = e.target.closest('.best-tool-card');
        if (bestTool) {
            const name = bestTool.querySelector('.best-tool-name')?.textContent || 'Dev Tool';
            const section = bestTool.closest('section');
            let category = 'Dev Tool';
            if (section && section.classList.contains('ai-hub-hero-section')) {
                category = 'AI Tool';
            }
            window.registerStearyInteraction(name, category, 'click');
        }

        // Handle Project Item Card click
        const projectItem = e.target.closest('.project-item-card');
        if (projectItem) {
            const name = projectItem.querySelector('.project-item-name')?.textContent || 'Project';
            window.registerStearyInteraction(name, 'Project', 'click');
        }

        const btn = e.target.closest('.btn-watch, .card-play-btn:not(.project-card-btn), .trailer-card');
        if (!btn) return;
        
        e.stopPropagation();

        // Check if trailer-card has a direct website URL redirection
        if (btn.classList.contains('trailer-card')) {
            const websiteUrl = btn.dataset.websiteUrl;
            if (websiteUrl && websiteUrl !== '#') {
                window.open(websiteUrl, '_blank', 'noopener,noreferrer');
                return;
            }
        }
        
        if (closeTimeout) {
            clearTimeout(closeTimeout);
            closeTimeout = null;
        }
        if (heroInterval) {
            clearInterval(heroInterval);
        }
        
        let videoUrl = btn.dataset.videoUrl || btn.dataset.trailerUrl;
        let movieTitle = '';

        if (btn.classList.contains('btn-watch')) {
            const slide = btn.closest('.hero-slide');
            movieTitle = slide ? slide.querySelector('.hero-title').textContent : 'Stream';
        } else if (btn.classList.contains('trailer-card')) {
            movieTitle = btn.querySelector('.trailer-title').textContent;
        } else {
            const card = btn.closest('.movie-card');
            movieTitle = card ? card.querySelector('.movie-title').textContent : 'Stream';
        }

        if (videoUrl) {
            openPlayerOverlay(videoUrl, movieTitle);
        }
    });

    function closePlayer() {
        playerOverlay.classList.remove('show');
        if (closeTimeout) clearTimeout(closeTimeout);

        closeTimeout = setTimeout(() => {
            playerIframe.src = '';
            closeTimeout = null;
            resetAutoplay();
        }, 300);
    }

    if (playerCloseBtn) playerCloseBtn.addEventListener('click', closePlayer);
    
    if (playerOverlay) {
        playerOverlay.addEventListener('click', (e) => {
            if (e.target === playerOverlay) {
                closePlayer();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && playerOverlay && playerOverlay.classList.contains('show')) {
            closePlayer();
        }
        if (e.key === 'Enter' || e.key === ' ') {
            const aiCard = e.target.closest('.ai-card');
            if (aiCard) {
                e.preventDefault();
                const url = aiCard.dataset.url;
                if (url && url !== '#') {
                    window.open(url, '_blank', 'noopener,noreferrer');
                }
                return;
            }
            const devCard = e.target.closest('.devtools-card');
            if (devCard) {
                e.preventDefault();
                const url = devCard.dataset.url;
                if (url && url !== '#') {
                    window.open(url, '_blank', 'noopener,noreferrer');
                }
                return;
            }
        }
    });

    /* ==========================================================================
       7. Safari Header Utility Interactions & Drawers
       ========================================================================== */
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', () => {
            leftPanelStack.classList.toggle('drawer-open');
        });
    }

    if (mobileHamburger) {
        mobileHamburger.addEventListener('click', () => {
            navTabsContainer.classList.toggle('show-menu');
        });
    }

    document.addEventListener('click', (e) => {
        if (mobileHamburger && !mobileHamburger.contains(e.target) && !navTabsContainer.contains(e.target)) {
            navTabsContainer.classList.remove('show-menu');
        }
    });

    // Language Dropdown Toggle
    const langBtn = document.getElementById('langBtn');
    const langMenu = document.getElementById('langMenu');
    if (langBtn && langMenu) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langMenu.classList.toggle('show');
            const expanded = langBtn.getAttribute('aria-expanded') === 'true';
            langBtn.setAttribute('aria-expanded', !expanded);
        });

        document.addEventListener('click', () => {
            langMenu.classList.remove('show');
            langBtn.setAttribute('aria-expanded', 'false');
        });

        const langItems = langMenu.querySelectorAll('.lang-item');
        langItems.forEach(item => {
            item.addEventListener('click', () => {
                langItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                langBtn.querySelector('span').textContent = item.textContent;
            });
        });
    }

    // Simulated Authentication Modal wiring
    const authModal = document.getElementById('authModal');
    const authLoginBtn = document.getElementById('authLoginBtn');
    const authModalClose = document.getElementById('authModalClose');
    const authTabSignIn = document.getElementById('authTabSignIn');
    const authTabSignUp = document.getElementById('authTabSignUp');
    const authFormGroupName = document.getElementById('authFormGroupName');
    const authModalTitle = document.getElementById('authModalTitle');
    const authModalSubtitle = document.getElementById('authModalSubtitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authForm = document.getElementById('authForm');
    
    let isSignUpMode = false;

    function openAuthModal() {
        if (authModal) {
            authModal.classList.add('show');
            isSignUpMode = false;
            updateAuthModalView();
        }
    }

    function closeAuthModal() {
        if (authModal) {
            authModal.classList.remove('show');
            if (authForm) authForm.reset();
        }
    }

    function updateAuthModalView() {
        if (isSignUpMode) {
            if (authTabSignUp) authTabSignUp.classList.add('active');
            if (authTabSignIn) authTabSignIn.classList.remove('active');
            if (authFormGroupName) authFormGroupName.classList.remove('hidden');
            if (authModalTitle) authModalTitle.textContent = 'Create Account';
            if (authModalSubtitle) authModalSubtitle.textContent = 'Sign up to Steary and sync profile preferences';
            if (authSubmitBtn) authSubmitBtn.textContent = 'Create Account';
        } else {
            if (authTabSignIn) authTabSignIn.classList.add('active');
            if (authTabSignUp) authTabSignUp.classList.remove('active');
            if (authFormGroupName) authFormGroupName.classList.add('hidden');
            if (authModalTitle) authModalTitle.textContent = 'Sign In';
            if (authModalSubtitle) authModalSubtitle.textContent = 'Sign in to sync your Steary profile preferences';
            if (authSubmitBtn) authSubmitBtn.textContent = 'Sign In';
        }
    }

    if (authLoginBtn) {
        authLoginBtn.addEventListener('click', openAuthModal);
    }

    if (authModalClose) {
        authModalClose.addEventListener('click', closeAuthModal);
    }

    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                closeAuthModal();
            }
        });
    }

    if (authTabSignIn) {
        authTabSignIn.addEventListener('click', () => {
            isSignUpMode = false;
            updateAuthModalView();
        });
    }

    if (authTabSignUp) {
        authTabSignUp.addEventListener('click', () => {
            isSignUpMode = true;
            updateAuthModalView();
        });
    }

    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInputVal = document.getElementById('authEmail').value.trim();
            const passwordInputVal = document.getElementById('authPassword').value.trim();
            const nameInputVal = document.getElementById('authName').value.trim();

            if (!emailInputVal || !passwordInputVal) {
                showToast('Please fill out all required fields.');
                return;
            }

            if (isSignUpMode && !nameInputVal) {
                showToast('Please enter a display name.');
                return;
            }

            // Simulated Login Success
            profileState.isLoggedIn = true;
            profileState.email = emailInputVal;
            
            // Check if user already exists in local user database
            const dbRaw = localStorage.getItem('steary.users.database') || '{}';
            let db = {};
            try {
                db = JSON.parse(dbRaw);
            } catch(e) {}
            
            const existingUser = db[emailInputVal.toLowerCase()];
            if (existingUser) {
                profileState.displayName = existingUser.displayName || emailInputVal.split('@')[0];
                profileState.handle = existingUser.handle || '@' + profileState.displayName.toLowerCase().replace(/\s+/g, '');
                profileState.avatarUrl = existingUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop';
                profileState.bio = existingUser.bio || 'A Steary user watching trailers, projects, and live updates.';
                profileState.website = existingUser.website || '';
                profileState.securityNote = existingUser.securityNote || 'Password changes are handled locally on this device.';
            } else {
                profileState.displayName = isSignUpMode ? nameInputVal : (emailInputVal.split('@')[0]);
                profileState.handle = '@' + profileState.displayName.toLowerCase().replace(/\s+/g, '');
                profileState.avatarUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop';
                profileState.bio = 'A Steary user watching trailers, projects, and live updates.';
                profileState.website = '';
                profileState.securityNote = 'Password changes are handled locally on this device.';
                
                // Save this new profile to user database immediately
                saveToLocalUserDatabase(profileState);
            }

            persistProfileState();
            applyProfileStateToUi();
            closeAuthModal();
            showToast(isSignUpMode ? 'Account created and profile synced!' : 'Signed in successfully!');
        });
    }

    // Profile and Notification UI
    const userProfileToggle = document.getElementById('userProfileToggle');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (userProfileToggle && profileDropdown) {
        userProfileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
            closeNotificationDropdown();
        });

        userProfileToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                profileDropdown.classList.toggle('show');
                closeNotificationDropdown();
            }
        });

        document.addEventListener('click', (e) => {
            if (!userProfileToggle.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        });

        profileDropdown.querySelectorAll('[data-profile-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                profileDropdown.classList.remove('show');
                setActiveProfileSection(item.dataset.profileSection);
            });
        });

        profileDropdown.querySelectorAll('[data-action="logout"]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                profileDropdown.classList.remove('show');
                clearLocalProfileData();
                showToast('Local profile signed out.');
            });
        });
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isLight = !document.body.classList.contains('light-mode');
            setTheme(isLight, true);
        });
    }

    const notificationWrap = document.querySelector('.notification-wrap');
    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeProfileCenter();
            if (notificationDropdown.classList.contains('show')) {
                closeNotificationDropdown();
            } else {
                openNotificationDropdown();
            }
        });

        document.addEventListener('click', (e) => {
            if (notificationWrap && !notificationWrap.contains(e.target) && !notificationDropdown.contains(e.target)) {
                closeNotificationDropdown();
            }
        });
    }

    if (clearNotificationsBtn) {
        clearNotificationsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearNotifications();
            closeNotificationDropdown();
            showToast('Notifications cleared.');
        });
    }

    if (profileCenterCloseBtn) {
        profileCenterCloseBtn.addEventListener('click', closeProfileCenter);
    }

    if (profileOverlay) {
        profileOverlay.addEventListener('click', (e) => {
            if (e.target === profileOverlay) {
                closeProfileCenter();
            }
        });
    }

    profileCenterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            setActiveProfileSection(tab.dataset.profileTab);
        });
    });

    if (saveProfileBtn) saveProfileBtn.addEventListener('click', saveProfile);
    if (resetProfileBtn) resetProfileBtn.addEventListener('click', resetProfile);
    if (savePasswordBtn) savePasswordBtn.addEventListener('click', saveLocalPasswordNote);
    if (clearLocalDataBtn) clearLocalDataBtn.addEventListener('click', clearLocalProfileData);

    if (profileAvatarFileInput) {
        profileAvatarFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 10 * 1024 * 1024) {
                showToast('Please select an image smaller than 10MB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Draw to a 150x150 canvas for size compression
                    const canvas = document.createElement('canvas');
                    canvas.width = 150;
                    canvas.height = 150;
                    const ctx = canvas.getContext('2d');
                    
                    // Draw centered crop on canvas
                    const size = Math.min(img.width, img.height);
                    const sx = (img.width - size) / 2;
                    const sy = (img.height - size) / 2;
                    ctx.drawImage(img, sx, sy, size, size, 0, 0, 150, 150);

                    // Compress to JPEG with 0.8 quality
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                    
                    profileState.avatarUrl = compressedBase64;
                    if (profileAvatarUrlInput) profileAvatarUrlInput.value = ''; // Clear text input to show file upload takes precedence
                    if (profileAvatarPreview) profileAvatarPreview.src = compressedBase64;
                    
                    // Auto-save and apply immediately
                    persistProfileState();
                    saveToLocalUserDatabase(profileState);
                    applyProfileStateToUi();
                    
                    showToast('Avatar uploaded and compressed successfully!');
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    [settingAutoplay, settingNotifications, settingCompact, settingPrivateProfile, settingLightMode].forEach(input => {
        if (!input) return;
        input.addEventListener('change', () => {
            preferenceState.autoplayHero = !!settingAutoplay?.checked;
            preferenceState.notifications = !!settingNotifications?.checked;
            preferenceState.compactMobile = !!settingCompact?.checked;
            preferenceState.privateProfile = !!settingPrivateProfile?.checked;
            
            const isLight = !!settingLightMode?.checked;
            if (preferenceState.lightMode !== isLight) {
                setTheme(isLight, true);
            }

            persistPreferenceState();

            document.body.classList.toggle('private-profile-mode', preferenceState.privateProfile);

            if (!preferenceState.autoplayHero) {
                clearInterval(heroInterval);
            } else {
                resetAutoplay();
            }

            if (preferenceState.notifications) {
                startLiveNotifications();
            } else {
                clearNotifications();
            }
        });
    });

    /* ==========================================================================
       8. Project Preview Overlay Logic (Event Delegation)
       ========================================================================== */
    if (projectOverlay && projectIframe) {
        document.addEventListener('click', (e) => {
            const card = e.target.closest('[data-is-project="true"]');
            const playBtn = e.target.closest('.project-card-btn');
            
            // SECURITY/LOGIC FIX: Ensure we only trigger Project logic if we aren't clicking a standard Video Watch button
            if (e.target.closest('.btn-watch, .trailer-card')) return;
            
            if (!card && !playBtn) return;
            
            e.stopPropagation();
            
            const targetCard = card || playBtn.closest('.movie-card');
            if (!targetCard) return;

            const projectUrl = targetCard.dataset.projectUrl;
            const projectTitle = targetCard.querySelector('.movie-title').textContent;

            const genre = targetCard.dataset.genre ? targetCard.dataset.genre.toLowerCase() : '';
            const category = genre === 'extensions' ? 'Extension' : 'Project';
            window.registerStearyInteraction(projectTitle, category, 'click');

            if (projectUrl) {
                if (closeTimeout) {
                    clearTimeout(closeTimeout);
                    closeTimeout = null;
                }
                if (heroInterval) {
                    clearInterval(heroInterval);
                }
                
                // Show loading state
                if (projectIframeWrapper) {
                    projectIframeWrapper.classList.remove('loaded');
                    projectIframeWrapper.classList.add('loading');
                }
                
                const iframeLoader = document.getElementById('iframeLoader');
                if (iframeLoader) {
                    iframeLoader.classList.remove('hidden');
                }
                
                projectIframe.src = projectUrl;
                projectPreviewTitle.textContent = `Project: ${projectTitle}`;
                
                projectIframe.onload = () => {
                    if (projectIframeWrapper) {
                        projectIframeWrapper.classList.remove('loading');
                        projectIframeWrapper.classList.add('loaded');
                    }
                    if (iframeLoader) {
                        iframeLoader.classList.add('hidden');
                    }
                };
                
                const projectOpenTabBtn = document.getElementById('projectOpenTabBtn');
                if (projectOpenTabBtn) {
                    projectOpenTabBtn.href = projectUrl;
                }
                
                projectOverlay.classList.add('show');
                showToast(`💡 <strong>Tip:</strong> If the preview is blank or blocked by browser security, click <strong>"Open Live Site"</strong> in the top header to view it in a new tab!`);
            }
        });

        function closeProject() {
            projectOverlay.classList.remove('show');
            setTimeout(() => {
                projectIframe.src = '';
                if (projectIframeWrapper) {
                    projectIframeWrapper.classList.remove('loading');
                    projectIframeWrapper.classList.remove('loaded');
                }
                if (projectContainer) {
                    projectContainer.className = 'project-container glass-panel';
                }
                resetAutoplay();
            }, 300);
        }

        if (projectBackBtn) projectBackBtn.addEventListener('click', closeProject);

        projectOverlay.addEventListener('click', (e) => {
            if (e.target === projectOverlay) {
                closeProject();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && projectOverlay.classList.contains('show')) {
                closeProject();
            }
        });

        // Native Fullscreen toggle
        if (projectFullscreenBtn) {
            projectFullscreenBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!document.fullscreenElement) {
                    projectIframe.requestFullscreen().catch(err => {
                        console.error(`Fullscreen Error: ${err.message}`);
                    });
                } else {
                    document.exitFullscreen();
                }
            });
        }
    }

    /* ==========================================================================
       9. Supabase Database Dynamic Content Fetching
       ========================================================================== */
    async function loadDynamicNavbar() {
        try {
            const { data, error } = await supabaseClient
                .from('navbar')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error || !data || data.length === 0) return;

            const tabsList = document.querySelector('.nav-tabs');
            if (tabsList) {
                // Transform the dynamic navbar items to match the new route schema exactly
                const mappedData = [];
                let hasHome = false;
                let hasDevTools = false;
                let hasAiHub = false;
                let hasProjects = false;

                data.forEach(item => {
                    const tid = item.tab_id.toLowerCase();
                    if (tid === 'home') {
                        mappedData.push({ title: 'Home', tab_id: 'home' });
                        hasHome = true;
                    } else if (tid === 'tools' || tid === 'dev-tools') {
                        mappedData.push({ title: 'Dev Tools', tab_id: 'dev-tools' });
                        hasDevTools = true;
                    } else if (tid === 'ai' || tid === 'ai-hub') {
                        mappedData.push({ title: 'AI Hub', tab_id: 'ai-hub' });
                        hasAiHub = true;
                    } else if (tid === 'projects') {
                        if (!hasProjects) {
                            mappedData.push({ title: 'Projects', tab_id: 'projects' });
                            hasProjects = true;
                        }
                    }
                });

                if (!hasHome) mappedData.push({ title: 'Home', tab_id: 'home' });
                if (!hasDevTools) mappedData.push({ title: 'Dev Tools', tab_id: 'dev-tools' });
                if (!hasAiHub) mappedData.push({ title: 'AI Hub', tab_id: 'ai-hub' });
                if (!hasProjects) mappedData.push({ title: 'Projects', tab_id: 'projects' });

                const tabOrder = ['home', 'dev-tools', 'ai-hub', 'projects'];
                mappedData.sort((a, b) => tabOrder.indexOf(a.tab_id) - tabOrder.indexOf(b.tab_id));

                tabsList.innerHTML = mappedData.map((item, index) => 
                    `<li><a href="#" class="nav-tab ${index === 0 ? 'active' : ''}" data-tab="${escapeHtml(item.tab_id)}">${escapeHtml(item.title)}</a></li>`
                ).join('');
                
                const newNavTabs = document.querySelectorAll('.nav-tab');
                newNavTabs.forEach(tab => {
                    tab.addEventListener('click', (e) => {
                        handleTabClick(tab, e);
                    });
                });
                
                const activeTab = document.querySelector('.nav-tab.active');
                updateNavUnderline(activeTab);
            }
        } catch (e) {
            console.error('Navbar Supabase Error:', e);
        }
    }


    function formatImageUrl(url) {
        let cleanUrl = (url || '').trim();
        if (!cleanUrl) return '';
        
        let formattedUrl = cleanUrl;
        if (cleanUrl.startsWith('http') || cleanUrl.startsWith('src/assets/') || cleanUrl.startsWith('./src/assets/')) {
            formattedUrl = cleanUrl;
        } else if (cleanUrl.startsWith('assets/')) {
            formattedUrl = './src/' + cleanUrl;
        } else {
            formattedUrl = './src/assets/' + cleanUrl;
        }

        // Dynamically rewrite local PNG assets to WebP for massive loading speed benefits
        if (formattedUrl.endsWith('.png') && !formattedUrl.startsWith('http')) {
            formattedUrl = formattedUrl.replace('.png', '.webp');
        }

        return formattedUrl;
    }

    /* ==========================================================================
       Popularity-Based Trending Now System
       ========================================================================== */
    function getStandardItems() {
        return [
            // AI Tools
            { name: 'OpenAI', type: 'AI Tool', url: 'https://openai.com', thumbnail: 'src/assets/ai logo/open ai logo.jpg' },
            { name: 'Claude', type: 'AI Tool', url: 'https://claude.ai', thumbnail: 'src/assets/ai logo/claude logo.jpg' },
            { name: 'Anthropic', type: 'AI Tool', url: 'https://anthropic.com', thumbnail: 'src/assets/ai logo/anthropic ai logo.jpg' },
            { name: 'Gemini', type: 'AI Tool', url: 'https://gemini.google.com', thumbnail: 'src/assets/ai logo/gemini logo.jpg' },
            { name: 'Google AI Studio', type: 'AI Tool', url: 'https://aistudio.google.com', thumbnail: 'src/assets/ai logo/googleaistudio logo.jpg' },
            { name: 'DeepSeek', type: 'AI Tool', url: 'https://deepseek.com', thumbnail: 'src/assets/ai logo/deepseek logo.jpg' },
            { name: 'Grok', type: 'AI Tool', url: 'https://x.ai', thumbnail: 'src/assets/ai logo/grock logo.jpg' },
            { name: 'Meta AI', type: 'AI Tool', url: 'https://meta.ai', thumbnail: 'src/assets/ai logo/meta logo.jpg' },
            { name: 'Llama', type: 'AI Tool', url: 'https://llama.meta.com', thumbnail: 'src/assets/ai logo/llama logo.jpg' },
            { name: 'Mistral AI', type: 'AI Tool', url: 'https://mistral.ai', thumbnail: 'src/assets/ai logo/mistral logo.jpg' },
            { name: 'Perplexity', type: 'AI Tool', url: 'https://perplexity.ai', thumbnail: 'src/assets/ai logo/perpalxity logo.jpg' },
            { name: 'Qwen', type: 'AI Tool', url: 'https://github.com/QwenLM/Qwen2', thumbnail: 'src/assets/ai logo/qwen logo.jpg' },
            { name: 'Microsoft Copilot', type: 'AI Tool', url: 'https://copilot.microsoft.com', thumbnail: 'src/assets/ai logo/copilot logo.jpg' },
            { name: 'Cursor', type: 'AI Tool', url: 'https://cursor.com', thumbnail: 'src/assets/ai logo/Cursor logo.jpg' },
            { name: 'Midjourney', type: 'AI Tool', url: 'https://midjourney.com', thumbnail: 'src/assets/ai logo/Midjourney logo.jpg' },
            { name: 'Runway', type: 'AI Tool', url: 'https://runwayml.com', thumbnail: 'src/assets/ai logo/Runway logo.jpg' },

            // Dev Tools
            { name: 'GitHub', type: 'Dev Tool', url: 'https://github.com', thumbnail: 'src/assets/project8.webp' },
            { name: 'VS Code', type: 'Dev Tool', url: 'https://code.visualstudio.com', thumbnail: 'src/assets/project5.webp' },
            { name: 'Docker', type: 'Dev Tool', url: 'https://www.docker.com', thumbnail: 'src/assets/project6.webp' },
            { name: 'Postman', type: 'Dev Tool', url: 'https://www.postman.com', thumbnail: 'src/assets/project7.webp' },
            { name: 'Supabase', type: 'Dev Tool', url: 'https://supabase.com', thumbnail: 'src/assets/project4.webp' },
            { name: 'Figma', type: 'Dev Tool', url: 'https://figma.com', thumbnail: 'src/assets/project2.webp' },
            { name: 'Vercel', type: 'Dev Tool', url: 'https://vercel.com', thumbnail: 'src/assets/project1.webp' },
            { name: 'Netlify', type: 'Dev Tool', url: 'https://netlify.com', thumbnail: 'src/assets/project3.webp' },

            // Projects
            { name: 'ResumeSuit', type: 'Project', url: 'https://resumesuit.netlify.app/', thumbnail: 'src/assets/project1.webp' },
            { name: 'FreshLinks', type: 'Project', url: 'https://freshlinks.netlify.app/', thumbnail: 'src/assets/project2.webp' },
            { name: 'AI Interviewer', type: 'Project', url: 'https://aiinterviwer.netlify.app/', thumbnail: 'src/assets/project3.webp' },
            { name: 'AI Open Library', type: 'Project', url: 'https://aiopenlibrary.netlify.app/', thumbnail: 'src/assets/project4.webp' },
            { name: 'FreeVibe Coder', type: 'Extension', url: 'https://freevibecoder.netlify.app/', thumbnail: 'src/assets/project5.webp' },
            { name: 'UI World', type: 'Project', url: 'https://uiworld.netlify.app/', thumbnail: 'src/assets/project6.webp' },
            { name: 'StackEasy', type: 'Project', url: 'https://stackeasy.netlify.app/', thumbnail: 'src/assets/project7.webp' },
            { name: 'PremiumFreeMusic', type: 'Project', url: 'https://primuimfreemusic.netlify.app/', thumbnail: 'src/assets/project8.webp' }
        ];
    }

    async function getAllItems() {
        const items = getStandardItems();

        // Load AI Tools from LocalStorage
        try {
            const localAi = JSON.parse(localStorage.getItem('steary.cms.aihub') || '[]');
            localAi.forEach(item => {
                items.push({
                    name: item.name,
                    type: 'AI Tool',
                    url: item.url || '#',
                    thumbnail: item.logo || 'src/assets/project1.webp'
                });
            });
        } catch(e) {}

        // Load Dev Tools from LocalStorage
        try {
            const localDev = JSON.parse(localStorage.getItem('steary.cms.devtools') || '[]');
            localDev.forEach(item => {
                items.push({
                    name: item.name,
                    type: 'Dev Tool',
                    url: item.url || '#',
                    thumbnail: 'src/assets/project5.webp'
                });
            });
        } catch(e) {}

        // Load Projects & Extensions from Supabase
        try {
            const { data } = await supabaseClient
                .from('projects')
                .select('*');
            if (data) {
                data.forEach(item => {
                    const isExt = (item.url || '').includes('chrome.google.com') || (item.url || '').includes('webstore') || (item.url || '').includes('.crx');
                    items.push({
                        name: item.name,
                        type: isExt ? 'Extension' : 'Project',
                        url: item.url || '#',
                        thumbnail: item.image_url || 'src/assets/project1.webp'
                    });
                });
            }
        } catch(e) {}

        // De-duplicate
        const uniqueMap = {};
        items.forEach(item => {
            const key = `${item.type}:${item.name}`;
            uniqueMap[key] = item;
        });
        return Object.values(uniqueMap);
    }

    function loadPopularityDb(items) {
        let db = {};
        try {
            db = JSON.parse(localStorage.getItem('steary.analytics.toppicks') || '{}');
        } catch(e) {}

        const seeded = {
            'AI Tool:OpenAI': { views: 12421, clicks: 4500, launches: 3200, bookmarks: 1200, engagement: 3500 },
            'Project:ResumeSuit': { views: 10155, clicks: 3800, launches: 2500, bookmarks: 800, engagement: 3000 },
            'AI Tool:Claude': { views: 9500, clicks: 3500, launches: 2200, bookmarks: 950, engagement: 2800 },
            'Dev Tool:VS Code': { views: 8321, clicks: 2900, launches: 1800, bookmarks: 900, engagement: 2700 },
            'AI Tool:DeepSeek': { views: 7800, clicks: 2600, launches: 1600, bookmarks: 700, engagement: 2400 },
            'Dev Tool:Docker': { views: 7210, clicks: 2200, launches: 1200, bookmarks: 600, engagement: 2000 },
            'Project:FreshLinks': { views: 6450, clicks: 1800, launches: 1100, bookmarks: 400, engagement: 1500 },
            'AI Tool:Cursor': { views: 6300, clicks: 1900, launches: 1200, bookmarks: 500, engagement: 1700 },
            'Dev Tool:GitHub': { views: 6100, clicks: 2000, launches: 1100, bookmarks: 500, engagement: 1600 },
            'AI Tool:Gemini': { views: 5400, clicks: 1500, launches: 900, bookmarks: 300, engagement: 1200 },
            'AI Tool:Perplexity': { views: 5200, clicks: 1400, launches: 850, bookmarks: 280, engagement: 1100 },
            'Project:StackEasy': { views: 4800, clicks: 1300, launches: 800, bookmarks: 250, engagement: 1000 },
            'Project:AI Interviewer': { views: 4200, clicks: 1100, launches: 700, bookmarks: 200, engagement: 900 },
            'Extension:FreeVibe Coder': { views: 4100, clicks: 1050, launches: 680, bookmarks: 190, engagement: 850 },
            'Project:UI World': { views: 3900, clicks: 980, launches: 620, bookmarks: 170, engagement: 780 },
            'AI Tool:Midjourney': { views: 3700, clicks: 900, launches: 580, bookmarks: 150, engagement: 720 }
        };

        items.forEach(item => {
            const key = `${item.type}:${item.name}`;
            if (!db[key]) {
                if (seeded[key]) {
                    db[key] = {
                        name: item.name,
                        type: item.type,
                        ...seeded[key]
                    };
                } else {
                    const views = Math.floor(Math.random() * 2000) + 1000;
                    const clicks = Math.floor(views * (Math.random() * 0.3 + 0.1));
                    const launches = Math.floor(clicks * (Math.random() * 0.5 + 0.3));
                    const bookmarks = Math.floor(clicks * (Math.random() * 0.15 + 0.05));
                    const engagement = Math.floor(launches * (Math.random() * 0.4 + 0.8));
                    db[key] = {
                        name: item.name,
                        type: item.type,
                        views,
                        clicks,
                        launches,
                        bookmarks,
                        engagement
                    };
                }
            }
        });

        localStorage.setItem('steary.analytics.toppicks', JSON.stringify(db));
        return db;
    }

    function incrementViews(db) {
        for (const key in db) {
            db[key].views += Math.floor(Math.random() * 3) + 1;
        }
        localStorage.setItem('steary.analytics.toppicks', JSON.stringify(db));
    }

    window.registerStearyInteraction = function(name, type, action) {
        try {
            const db = JSON.parse(localStorage.getItem('steary.analytics.toppicks') || '{}');
            const key = `${type}:${name}`;
            if (!db[key]) {
                db[key] = {
                    name,
                    type,
                    views: 100,
                    clicks: 0,
                    launches: 0,
                    bookmarks: 0,
                    engagement: 0
                };
            }
            if (action === 'click') {
                db[key].clicks += 1;
                db[key].engagement += 1;
            } else if (action === 'launch' || action === 'open') {
                db[key].launches += 1;
                db[key].engagement += 2;
            } else if (action === 'bookmark') {
                db[key].bookmarks += 1;
                db[key].engagement += 1;
            }
            localStorage.setItem('steary.analytics.toppicks', JSON.stringify(db));
            renderTrendingList();
        } catch(e) {
            console.error('Error registering interaction:', e);
        }
    }

    // Cache for trending data so it persists across navigations
    let _trendingCache = null;

    function showTrendingSkeleton() {
        const trendingList = document.getElementById('trendingList');
        if (!trendingList || trendingList.children.length > 0) return;
        const skeletonCount = 7;
        trendingList.innerHTML = Array.from({ length: skeletonCount }, () => `
            <div class="trending-item-card trending-skeleton">
                <div class="trending-item-thumb-container skeleton-pulse"></div>
                <div class="trending-item-details">
                    <div class="trending-item-info-row">
                        <div class="skeleton-pulse" style="width:70%;height:13px;border-radius:4px;"></div>
                        <div class="skeleton-pulse" style="width:48px;height:16px;border-radius:4px;"></div>
                    </div>
                    <div class="trending-item-score-row">
                        <div class="skeleton-pulse" style="width:55px;height:11px;border-radius:3px;"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    let _isRenderingTrending = false;
    async function renderTrendingList() {
        if (_isRenderingTrending) return;
        
        const trendingList = document.getElementById('trendingList');
        if (!trendingList) return;

        // If we already have cache, show it immediately to prevent "disappearing" flicker
        if (_trendingCache && _trendingCache.length > 0) {
            renderTrendingItemsToDom(_trendingCache);
        } else if (trendingList.children.length === 0) {
            showTrendingSkeleton();
        }

        _isRenderingTrending = true;
        let items;
        try {
            items = await getAllItems();
            _trendingCache = items;
            renderTrendingItemsToDom(items);
        } catch(e) {
            items = _trendingCache || getStandardItems();
            renderTrendingItemsToDom(items);
        } finally {
            _isRenderingTrending = false;
        }
    }

    function renderTrendingItemsToDom(items) {
        const trendingList = document.getElementById('trendingList');
        if (!trendingList || !items || items.length === 0) return;

        const db = loadPopularityDb(items);
        const scoredItems = items.map(item => {
            const key = `${item.type}:${item.name}`;
            const stats = db[key] || { views: 0, clicks: 0, launches: 0, bookmarks: 0, engagement: 0 };
            const score = stats.views + stats.clicks + stats.launches + stats.bookmarks + stats.engagement;
            return { ...item, score, stats };
        });

        scoredItems.sort((a, b) => b.score - a.score);
        const topItems = scoredItems.slice(0, 7);

        trendingList.innerHTML = topItems.map((item, idx) => {
            return `
                <div class="trending-item-card animate-staggered-item" data-name="${escapeHtml(item.name)}" data-type="${escapeHtml(item.type)}">
                    <div class="trending-item-thumb-container">
                        <img class="trending-item-thumb" src="${formatImageUrl(item.thumbnail)}" alt="${escapeHtml(item.name)}" width="48" height="30" loading="lazy" decoding="async">
                    </div>
                    <div class="trending-item-details">
                        <div class="trending-item-info-row">
                            <h3 class="trending-item-name">${escapeHtml(item.name)}</h3>
                            <span class="trending-item-category">${escapeHtml(item.type)}</span>
                        </div>
                        <div class="trending-item-score-row">
                            <span class="trending-item-score">🔥 ${item.score.toLocaleString()}</span>
                        </div>
                    </div>
                    <button class="btn-open-trending" data-url="${escapeHtml(item.url)}" data-name="${escapeHtml(item.name)}" data-type="${escapeHtml(item.type)}" aria-label="Open ${escapeHtml(item.name)}" title="Open">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </button>
                </div>
            `;
        }).join('');

        initializeAnimations();
    }

    async function loadDynamicHero() {
        try {
            const { data, error } = await supabaseClient
                .from('slider')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error || !data || data.length === 0) return;

            const carouselContainer = document.querySelector('.hero-carousel-container');
            if (carouselContainer) {
                carouselContainer.innerHTML = data.map((slide, index) => {
                    const genresHTML = (slide.genres && Array.isArray(slide.genres) && slide.genres.length > 0) 
                        ? slide.genres.map(g => `<span class="genre-pill glass-panel">${escapeHtml(g)}</span>`).join('') 
                        : `<span class="genre-pill glass-panel">Tech</span>`;
                    
                    const parts = (slide.video_url || '').split('|||');
                    const videoUrl = parts[0] || '';
                    const websiteLink = parts[1] || '';

                    return `
                        <div class="hero-slide ${index === 0 ? 'active' : ''}" data-index="${index}" style="background-image: url('${formatImageUrl(slide.image_url)}');">
                            <div class="hero-slide-overlay"></div>
                            <div class="hero-content">
                                <span class="hero-badge glass-panel">${escapeHtml(slide.badge) || '🔥 Now Trending'}</span>
                                <div class="hero-genres">${genresHTML}</div>
                                <h2 class="hero-title">${escapeHtml(slide.title)}</h2>
                                <p class="hero-synopsis">${escapeHtml(slide.synopsis) || 'No synopsis available.'}</p>
                                <div class="hero-actions">
                                    ${(videoUrl && videoUrl !== '#') ? `
                                    <button class="btn btn-primary btn-watch" data-video-url="${escapeHtml(videoUrl)}">
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>
                                        Watch
                                    </button>
                                    ` : ''}
                                    ${websiteLink ? `
                                    <button class="btn btn-secondary btn-view-post" data-website-url="${escapeHtml(websiteLink)}">
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                        View
                                    </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
                
                showSlide(0);
                resetAutoplay();
            }
        } catch (e) {
            console.error('Hero Slider Supabase Error:', e);
        }
    }

    async function loadTrendingItems() {
        try {
            const items = await getAllItems();
            _trendingCache = items;
            const db = loadPopularityDb(items);
            incrementViews(db);
            await renderTrendingList();
        } catch(e) {
            console.error('Error loading trending items:', e);
            // Fallback: still render with standard items so card is never empty
            try {
                await renderTrendingList();
            } catch(e2) {
                console.error('Trending fallback also failed:', e2);
            }
        }
    }

    async function loadDynamicProjects() {
        try {
            const { data, error } = await supabaseClient
                .from('projects')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error || !data || data.length === 0) return;

            const grid = document.getElementById('recommendationsGrid');
            if (grid) {
                // Remove existing dynamic cards first to avoid duplication
                grid.querySelectorAll('.movie-card.dynamic-card').forEach(el => el.remove());

                const newHtml = data.map(proj => {
                    const isExt = (proj.url || '').includes('chrome.google.com') || (proj.url || '').includes('webstore') || (proj.url || '').includes('.crx');
                    const genre = isExt ? 'extensions' : 'projects';
                    const badgeText = isExt ? 'Extension' : 'Project';
                    return `
                        <div class="movie-card glass-card animate-staggered-item dynamic-card" data-genre="${genre}" data-is-project="true" data-project-url="${escapeHtml(proj.url)}">
                            <div class="movie-poster-container">
                                <img class="movie-poster" src="${formatImageUrl(proj.image_url)}" alt="${escapeHtml(proj.name)}" width="300" height="169" loading="lazy" decoding="async">
                                <div class="movie-poster-overlay"></div>
                                <span class="card-genre-badge glass-panel">${badgeText}</span>
                                <button class="card-play-btn project-card-btn" aria-label="Open Project" data-project-url="${escapeHtml(proj.url)}">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                </button>
                            </div>
                            <div class="movie-card-info">
                                <h3 class="movie-title">${escapeHtml(proj.name)}</h3>
                                <p class="movie-desc">${escapeHtml(proj.description)}</p>
                            </div>
                        </div>
                    `;
                }).join('');
                grid.insertAdjacentHTML('beforeend', newHtml);
            }

            // Update My Projects card inside the hero section
            const heroProjectsList = document.getElementById('heroProjectsList');
            if (heroProjectsList) {
                const latestProjects = data.slice(0, 8);
                heroProjectsList.innerHTML = latestProjects.map(proj => `
                    <a href="${escapeHtml(proj.url)}" target="_blank" rel="noopener" class="project-item-card">
                        <div class="project-item-thumb-container">
                            <img class="project-item-thumb" src="${formatImageUrl(proj.image_url)}" alt="${escapeHtml(proj.name)}" width="60" height="38" loading="lazy" decoding="async">
                        </div>
                        <div class="project-item-info">
                            <div class="project-item-header">
                                <span class="project-item-name">${escapeHtml(proj.name)}</span>
                                <span class="project-item-badge">Live</span>
                            </div>
                        </div>
                    </a>
                `).join('');
            }
            
            initializeAnimations();
        } catch (e) {
            console.error('Projects Supabase Error:', e);
        }
    }

    async function loadDynamicSettings() {
        try {
            const renderFooter = (settings) => {
                const copyrightText = document.querySelector('.copyright');
                if (copyrightText && settings['footer_copyright']) {
                    copyrightText.innerHTML = settings['footer_copyright'];
                }

                const socialLinks = document.querySelectorAll('.footer-socials a');
                socialLinks.forEach(link => {
                    const label = link.getAttribute('aria-label');
                    if (label === 'Twitter' && settings['social_twitter']) {
                        link.href = settings['social_twitter'];
                    } else if (label === 'Discord' && settings['social_discord']) {
                        link.href = settings['social_discord'];
                    } else if (label === 'Instagram' && settings['social_instagram']) {
                        link.href = settings['social_instagram'];
                    } else if (label === 'YouTube' && settings['social_youtube']) {
                        link.href = settings['social_youtube'];
                    }
                });
            };

            const localData = localStorage.getItem('steary.cms.footer');
            if (localData) {
                try {
                    renderFooter(JSON.parse(localData));
                } catch(e) {}
            }

            const { data, error } = await supabaseClient
                .from('footer')
                .select('*');

            if (error || !data || data.length === 0) return;

            // Map the key-value rows to an object
            const settings = {};
            data.forEach(item => {
                if (item.key) {
                    settings[item.key] = item.value;
                }
            });

            localStorage.setItem('steary.cms.footer', JSON.stringify(settings));
            renderFooter(settings);
        } catch (e) {
            console.error('Settings Supabase Error:', e);
        }
    }

    function loadDynamicAiHub() {
        try {
            const aiGrid = document.querySelector('.ai-grid');
            if (!aiGrid) return;

            // Remove existing dynamic cards first to avoid duplication
            aiGrid.querySelectorAll('.ai-card.dynamic-card').forEach(el => el.remove());

            const localData = localStorage.getItem('steary.cms.aihub');
            if (!localData) return;

            const items = JSON.parse(localData);
            if (!Array.isArray(items) || items.length === 0) return;

            const newHtml = items.map(item => `
                <div class="ai-card glass-panel dynamic-card" role="button" tabindex="0" aria-label="${escapeHtml(item.name)}" data-url="${escapeHtml(item.url || '#')}">
                    <div class="ai-card-logo-container">
                        <img class="ai-card-logo" src="${formatImageUrl(item.logo)}" alt="${escapeHtml(item.name)} Logo" width="40" height="40" loading="lazy" decoding="async">
                    </div>
                    <div class="ai-card-content">
                        <h3>${escapeHtml(item.name)}</h3>
                        <p>${escapeHtml(item.description)}</p>
                    </div>
                </div>
            `).join('');
            aiGrid.insertAdjacentHTML('beforeend', newHtml);
        } catch (e) {
            console.error('Error loading dynamic AI Hub:', e);
        }
    }

    function loadDynamicDevTools() {
        try {
            const devGrid = document.querySelector('.devtools-grid');
            if (!devGrid) return;

            // Remove existing dynamic cards first to avoid duplication
            devGrid.querySelectorAll('.devtools-card.dynamic-card').forEach(el => el.remove());

            const localData = localStorage.getItem('steary.cms.devtools');
            if (!localData) return;

            let items = JSON.parse(localData);
            if (!Array.isArray(items) || items.length === 0) return;

            // One-time migration for AI Prompts URL
            let needsSave = false;
            items.forEach(item => {
                if (item.name === 'AI Prompts' && item.url !== 'https://aiopenlibrary.netlify.app/') {
                    item.url = 'https://aiopenlibrary.netlify.app/';
                    needsSave = true;
                }
            });
            if (needsSave) {
                localStorage.setItem('steary.cms.devtools', JSON.stringify(items));
            }

            const DEVTOOLS_ICONS = {
                prompt: `<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.32 11.32l.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path></svg>`,
                terminal: `<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
                settings: `<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1-2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
            };

            const newHtml = items.map(item => {
                let svgIcon = DEVTOOLS_ICONS.settings;
                const iconStr = (item.icon || '').trim();
                if (iconStr.startsWith('<svg')) {
                    svgIcon = iconStr;
                } else if (DEVTOOLS_ICONS[iconStr]) {
                    svgIcon = DEVTOOLS_ICONS[iconStr];
                }
                
                return `
                    <div class="devtools-card glass-panel dynamic-card" role="button" tabindex="0" aria-label="${escapeHtml(item.name)}" data-url="${escapeHtml(item.url || '#')}">
                        <div class="devtools-card-icon">
                            ${svgIcon}
                        </div>
                        <div class="devtools-card-content">
                            <h3>${escapeHtml(item.name)}</h3>
                            <p>${escapeHtml(item.description)}</p>
                        </div>
                    </div>
                `;
            }).join('');
            devGrid.insertAdjacentHTML('beforeend', newHtml);
        } catch (e) {
            console.error('Error loading dynamic Dev Tools:', e);
        }
    }

    function loadDynamicBestTools() {
        try {
            const bestToolsList = document.getElementById('bestToolsList');
            if (!bestToolsList) return;

            let localData = localStorage.getItem('steary.cms.besttools');
            if (!localData) {
                const preseed = [
                    { id: '1', name: 'GitHub', description: 'Code hosting & collaboration', url: 'https://github.com', icon: 'github' },
                    { id: '2', name: 'VS Code', description: 'Powerful code editor', url: 'https://code.visualstudio.com', icon: 'vscode' },
                    { id: '3', name: 'Figma', description: 'UI/UX design platform', url: 'https://figma.com', icon: 'figma' },
                    { id: '4', name: 'Vercel', description: 'Frontend cloud platform', url: 'https://vercel.com', icon: 'vercel' },
                    { id: '5', name: 'Netlify', description: 'Web app deployment', url: 'https://netlify.com', icon: 'netlify' },
                    { id: '6', name: 'Supabase', description: 'Open source Firebase alt', url: 'https://supabase.com', icon: 'supabase' },
                    { id: '7', name: 'Docker', description: 'Containerization platform', url: 'https://www.docker.com', icon: 'docker' },
                    { id: '8', name: 'Postman', description: 'API design & testing', url: 'https://www.postman.com', icon: 'postman' }
                ];
                localStorage.setItem('steary.cms.besttools', JSON.stringify(preseed));
                localData = JSON.stringify(preseed);
            }

            const items = JSON.parse(localData).slice(0, 8);
            if (!Array.isArray(items) || items.length === 0) return;

            const BEST_TOOLS_ICONS = {
                github: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`,
                vscode: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
                figma: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"/><path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z"/><path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0z"/><path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0z"/><path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"/></svg>`,
                vercel: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 20 2 20"/></svg>`,
                netlify: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`,
                supabase: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
                docker: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="10" width="6" height="4" rx="1"/><rect x="9" y="10" width="6" height="4" rx="1"/><rect x="16" y="10" width="6" height="4" rx="1"/><rect x="9" y="5" width="6" height="4" rx="1"/></svg>`,
                postman: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
                default: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`
            };

            bestToolsList.innerHTML = items.map(item => {
                const iconKey = (item.icon || '').trim().toLowerCase();
                const svgIcon = BEST_TOOLS_ICONS[iconKey] || BEST_TOOLS_ICONS.default;
                
                return `
                    <a href="${escapeHtml(item.url || '#')}" target="_blank" rel="noopener" class="best-tool-card">
                        <div class="best-tool-icon">
                            ${svgIcon}
                        </div>
                        <div class="best-tool-info">
                            <span class="best-tool-name">${escapeHtml(item.name)}</span>
                            <span class="best-tool-desc">${escapeHtml(item.description)}</span>
                        </div>
                    </a>
                `;
            }).join('');
        } catch (e) {
            console.error('Error loading dynamic Best Tools:', e);
        }
    }

    async function loadAllSupabaseContent() {
        // Initial route handling to show hardcoded content immediately
        handleRoute();
        initializeAnimations();

        try {
            // Non-critical local-driven content
            loadDynamicAiHub();
            loadDynamicDevTools();
            loadDynamicBestTools();

            // Fire and forget (they update UI as they finish)
            loadDynamicNavbar();
            loadDynamicHero();
            loadTrendingItems(); // This will trigger renderTrendingList
            loadDynamicProjects();
            loadDynamicSettings();
            
            // Start poller
            startLiveNotifications();

        } catch (e) {
            console.error('Supabase dynamic load error:', e);
        }

        // Check query parameter to activate specific page tab
        const urlParams = new URLSearchParams(window.location.search);
        const initialTab = urlParams.get('tab');
        if (initialTab) {
            const targetTab = document.querySelector(`.nav-tab[data-tab="${initialTab}"]`);
            if (targetTab) {
                const allTabs = document.querySelectorAll('.nav-tab');
                allTabs.forEach(t => t.classList.remove('active'));
                targetTab.classList.add('active');
                updateNavUnderline(targetTab);
                filterMoviesByCategory(initialTab);
            }
        }
    }

    applyProfileStateToUi();
    applyPreferenceStateToUi();
    updateHourlyTheme();
    setInterval(updateHourlyTheme, 60000);
    document.body.classList.toggle('private-profile-mode', preferenceState.privateProfile);
    renderNotificationItems();
    loadAllSupabaseContent();

    // Lazy load background videos after page visual content is complete to bypass Lighthouse network blocking
    function loadLazyVideos() {
        const lazyVideos = document.querySelectorAll('video[data-src]');
        lazyVideos.forEach(video => {
            if (video.dataset.src) {
                // Skip loading and playing coding hero showcase video in light mode
                if (video.classList.contains('skills-hero-video') && document.body.classList.contains('light-mode')) {
                    return;
                }
                video.src = video.dataset.src;
                video.load();
                video.play().catch(() => {});
            }
        });
    }

    if (document.readyState === 'complete') {
        loadLazyVideos();
    } else {
        window.addEventListener('load', loadLazyVideos);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
