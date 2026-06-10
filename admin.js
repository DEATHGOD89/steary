/* ==========================================================================
   STEARY ADMIN DASHBOARD - JAVASCRIPT
   ========================================================================== */

// Initialize Supabase Client
console.log("admin.js top level executing!");
const SUPABASE_URL = 'https://kmohuqqpfrufkrbtuirt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vSabtm7DCF5PZzcHwO1Mng_fvVCQKwx';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed. admin.js starting...');
    const loginForm = document.getElementById('adminLoginForm');
    const loginError = document.getElementById('loginError');
    console.log('Login Form:', loginForm);

    // Handle Admin Login (Supabase Auth email/password authentication)
    if (loginForm) {
        console.log('Attaching submit listener to login form');
        loginForm.addEventListener('submit', async (e) => {
            console.log('Form submission intercepted');
            e.preventDefault();
            
            const email = document.getElementById('adminId').value;
            const password = document.getElementById('adminPass').value;

            // Authenticate with Supabase Auth
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                // Display error
                loginError.textContent = error.message;
                loginError.classList.remove('hidden');
                loginError.style.display = 'block';
                loginError.style.opacity = '1';
                
                // Shake animation for error
                loginForm.style.transform = 'translateX(-10px)';
                setTimeout(() => loginForm.style.transform = 'translateX(10px)', 100);
                setTimeout(() => loginForm.style.transform = 'translateX(-10px)', 200);
                setTimeout(() => loginForm.style.transform = 'translateX(0)', 300);
            } else {
                loginError.classList.add('hidden');
                // Redirect to dashboard
                window.location.href = 'admin-dashboard.html';
            }
        });
    }

    // Dashboard Guard and Tab switching logic
    const isDashboard = window.location.pathname.includes('admin-dashboard.html');
    if (isDashboard) {
        // Theme Toggle Event Wiring
        const themeToggleBtn = document.getElementById('adminThemeToggleBtn');
        if (themeToggleBtn) {
            const sunIcon = themeToggleBtn.querySelector('.sun-icon');
            const moonIcon = themeToggleBtn.querySelector('.moon-icon');
            
            // Initial toggle button icon synchronization
            const currentTheme = localStorage.getItem('steary.admin.theme') || 'light';
            if (currentTheme === 'dark') {
                if (sunIcon) sunIcon.classList.remove('hidden');
                if (moonIcon) moonIcon.classList.add('hidden');
            } else {
                if (sunIcon) sunIcon.classList.add('hidden');
                if (moonIcon) moonIcon.classList.remove('hidden');
            }

            themeToggleBtn.addEventListener('click', () => {
                const isLight = document.body.classList.contains('light-mode');
                if (isLight) {
                    // Switch to Dark
                    document.body.classList.remove('light-mode');
                    document.documentElement.classList.remove('light-mode');
                    localStorage.setItem('steary.admin.theme', 'dark');
                    if (sunIcon) sunIcon.classList.remove('hidden');
                    if (moonIcon) moonIcon.classList.add('hidden');
                } else {
                    // Switch to Light
                    document.body.classList.add('light-mode');
                    document.documentElement.classList.add('light-mode');
                    localStorage.setItem('steary.admin.theme', 'light');
                    if (sunIcon) sunIcon.classList.add('hidden');
                    if (moonIcon) moonIcon.classList.remove('hidden');
                }
                
                // Re-render charts to adjust text/grid colors for the new theme
                renderDashboardCharts();
                renderAnalyticsGrowthChart();
            });
        }

        // Protect Dashboard: check for active user session
        supabaseClient.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // Not authenticated, kick back to login
                window.location.href = 'admin.html';
            } else {
                // Set admin email text in header dynamically
                const emailEl = document.getElementById('adminEmail');
                if (emailEl && session.user && session.user.email) {
                    emailEl.textContent = session.user.email;
                }
                // Initialize the dashboard CMS components
                initializeDashboardCMS();
            }
        });

        // Tab Switching Router (11 panels routing support)
        const navBtns = document.querySelectorAll('.dashboard-nav-btn[data-tab]');
        const panels = document.querySelectorAll('.dashboard-panel');

        if (navBtns.length > 0 && panels.length > 0) {
            navBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    navBtns.forEach(b => b.classList.remove('active'));
                    panels.forEach(p => p.classList.add('hidden'));

                    btn.classList.add('active');

                    const tabId = btn.getAttribute('data-tab');
                    const activePanel = document.getElementById(`panel-${tabId}`);
                    if (activePanel) {
                        activePanel.classList.remove('hidden');
                    }
                    
                    // Specific tab action triggers
                    if (tabId === 'overview') {
                        renderDashboardCharts();
                        renderAnalyticsGrowthChart();
                    } else if (tabId === 'livepreview') {
                        const iframe = document.getElementById('livePreviewIframe');
                        if (iframe) iframe.src = 'index.html?t=' + Date.now();
                    }
                });
            });
        }

        // Live Preview refresh
        const refreshPreviewBtn = document.getElementById('refreshPreviewBtn');
        const livePreviewIframe = document.getElementById('livePreviewIframe');
        if (refreshPreviewBtn && livePreviewIframe) {
            refreshPreviewBtn.addEventListener('click', () => {
                livePreviewIframe.src = 'index.html?t=' + Date.now();
            });
        }

        // Handle Logout
        const logoutBtn = document.getElementById('adminLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await supabaseClient.auth.signOut();
                window.location.href = 'admin.html';
            });
        }
    }
});

/* ==========================================================================
   Dashboard CMS Integrations (Supabase & localStorage Operations)
   ========================================================================== */
function initializeDashboardCMS() {
    let editState = {
        projectId: null,
        sliderId: null,
        aiId: null,
        toolId: null,
        categoryId: null,
        bestToolId: null
    };

    // Helper: set form edit modes
    function setFormMode(form, button, baseLabel, editId) {
        if (!form || !button) return;
        form.dataset.editId = editId || '';
        
        let itemLabel = baseLabel;
        if (baseLabel.startsWith('Register ')) {
            itemLabel = baseLabel.substring(9);
        } else if (baseLabel.startsWith('Publish ')) {
            itemLabel = baseLabel.substring(8);
        } else if (baseLabel.startsWith('Save ')) {
            itemLabel = baseLabel.substring(5);
        } else {
            const parts = baseLabel.split(' ');
            if (parts.length > 1) {
                itemLabel = parts.slice(1).join(' ');
            }
        }
        
        button.textContent = editId ? `Update ${itemLabel}` : baseLabel;
        
        let cancelBtn = form.querySelector('.btn-cancel');
        if (cancelBtn) {
            cancelBtn.style.display = editId ? 'inline-block' : 'none';
        }
    }

    // Helper: create and insert a cancel button
    function createCancelButton(form, onCancel) {
        if (!form) return null;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-secondary btn-cancel';
        btn.style.display = 'none';
        btn.style.marginLeft = '10px';
        btn.textContent = 'Cancel';
        btn.addEventListener('click', onCancel);
        form.querySelector('.btn-block')?.parentNode.appendChild(btn);
        return btn;
    }

    // Helper: matches search values
    function matchesSearch(item, fields, query) {
        if (!query) return true;
        const q = query.toLowerCase().trim();
        return fields.some(f => (f || '').toLowerCase().includes(q));
    }

    /* ----------------------------------------------------
       0. Load Dashboard Counts & Stats
       ---------------------------------------------------- */
    function getAdminStandardItems() {
        return [
            { name: 'OpenAI', type: 'AI Tool', url: 'https://openai.com' },
            { name: 'Claude', type: 'AI Tool', url: 'https://claude.ai' },
            { name: 'Anthropic', type: 'AI Tool', url: 'https://anthropic.com' },
            { name: 'Gemini', type: 'AI Tool', url: 'https://gemini.google.com' },
            { name: 'Google AI Studio', type: 'AI Tool', url: 'https://aistudio.google.com' },
            { name: 'DeepSeek', type: 'AI Tool', url: 'https://deepseek.com' },
            { name: 'Grok', type: 'AI Tool', url: 'https://x.ai' },
            { name: 'Meta AI', type: 'AI Tool', url: 'https://meta.ai' },
            { name: 'Llama', type: 'AI Tool', url: 'https://llama.meta.com' },
            { name: 'Mistral AI', type: 'AI Tool', url: 'https://mistral.ai' },
            { name: 'Perplexity', type: 'AI Tool', url: 'https://perplexity.ai' },
            { name: 'Qwen', type: 'AI Tool', url: 'https://github.com/QwenLM/Qwen2' },
            { name: 'Microsoft Copilot', type: 'AI Tool', url: 'https://copilot.microsoft.com' },

            { name: 'GitHub', type: 'Dev Tool', url: 'https://github.com' },
            { name: 'VS Code', type: 'Dev Tool', url: 'https://code.visualstudio.com' },
            { name: 'Docker', type: 'Dev Tool', url: 'https://www.docker.com' },
            { name: 'Postman', type: 'Dev Tool', url: 'https://www.postman.com' },
            { name: 'Supabase', type: 'Dev Tool', url: 'https://supabase.com' },
            { name: 'Figma', type: 'Dev Tool', url: 'https://figma.com' },
            { name: 'Vercel', type: 'Dev Tool', url: 'https://vercel.com' },
            { name: 'Netlify', type: 'Dev Tool', url: 'https://netlify.com' },

            { name: 'ResumeSuit', type: 'Project', url: 'https://resumesuit.netlify.app/' },
            { name: 'FreshLinks', type: 'Project', url: 'https://freshlinks.netlify.app/' },
            { name: 'AI Interviewer', type: 'Project', url: 'https://aiinterviwer.netlify.app/' }
        ];
    }

    async function getAdminAllItems() {
        const items = getAdminStandardItems();

        try {
            const localAi = JSON.parse(localStorage.getItem('steary.cms.aihub') || '[]');
            localAi.forEach(item => {
                items.push({ name: item.name, type: 'AI Tool', url: item.url || '#' });
            });
        } catch(e) {}

        try {
            const localDev = JSON.parse(localStorage.getItem('steary.cms.devtools') || '[]');
            localDev.forEach(item => {
                items.push({ name: item.name, type: 'Dev Tool', url: item.url || '#' });
            });
        } catch(e) {}

        try {
            const { data } = await supabaseClient.from('projects').select('*');
            if (data) {
                data.forEach(item => {
                    const isExt = (item.url || '').includes('chrome.google.com') || (item.url || '').includes('webstore') || (item.url || '').includes('.crx');
                    items.push({ name: item.name, type: isExt ? 'Extension' : 'Project', url: item.url || '#' });
                });
            }
        } catch(e) {}

        const uniqueMap = {};
        items.forEach(item => {
            const key = `${item.type}:${item.name}`;
            uniqueMap[key] = item;
        });
        return Object.values(uniqueMap);
    }

    /* ----------------------------------------------------
       0. Load Dashboard Counts & Stats
       ---------------------------------------------------- */
    async function loadDashboardStats() {
        const statTopTrending = document.getElementById('statTopTrending');
        const statTopTrendingScore = document.getElementById('statTopTrendingScore');
        const statSlides = document.getElementById('statSlides');
        const statProjects = document.getElementById('statProjects');
        const statExtensions = document.getElementById('statExtensions');
        const statDevTools = document.getElementById('statDevTools');
        const statCategories = document.getElementById('statCategories');

        let aiCount = 0;
        let projectsCount = 0;
        let extensionsCount = 0;
        let devtoolsCount = 0;
        let categoriesCount = 0;

        // 1. Top Trending Item (Popularity tracker database)
        try {
            const items = await getAdminAllItems();
            const db = JSON.parse(localStorage.getItem('steary.analytics.toppicks') || '{}');
            let topItem = null;
            let maxScore = -1;

            items.forEach(item => {
                const key = `${item.type}:${item.name}`;
                const stats = db[key] || { views: 0, clicks: 0, launches: 0, bookmarks: 0, engagement: 0 };
                const score = stats.views + stats.clicks + stats.launches + stats.bookmarks + stats.engagement;
                if (score > maxScore) {
                    maxScore = score;
                    topItem = { name: item.name, score: score };
                }
            });

            if (statTopTrending && topItem) {
                statTopTrending.textContent = topItem.name;
                if (statTopTrendingScore) statTopTrendingScore.textContent = `Score: ${topItem.score.toLocaleString()}`;
            }
        } catch (e) {
            console.error('Error fetching trending stat:', e);
        }
        
        // 2. Total AI Tools (localStorage count)
        try {
            const aiTools = JSON.parse(localStorage.getItem('steary.cms.aihub') || '[]');
            aiCount = aiTools.length;
            if (statSlides) statSlides.textContent = aiCount;
        } catch (e) {
            console.error('Error fetching AI count:', e);
        }

        // 3. Total Projects & Extensions (Filtered count from Projects table)
        try {
            const { data } = await supabaseClient.from('projects').select('url');
            if (data) {
                extensionsCount = data.filter(p => (p.url || '').includes('chrome.google.com') || (p.url || '').includes('webstore') || (p.url || '').includes('.crx')).length;
                projectsCount = data.length - extensionsCount;
                
                if (statProjects) statProjects.textContent = projectsCount;
                if (statExtensions) statExtensions.textContent = extensionsCount;
            }
        } catch (e) {
            console.error('Error fetching projects/extensions counts:', e);
        }

        // 4. Total Dev Tools (localStorage count)
        try {
            const devTools = JSON.parse(localStorage.getItem('steary.cms.devtools') || '[]');
            devtoolsCount = devTools.length;
            if (statDevTools) statDevTools.textContent = devtoolsCount;
        } catch (e) {
            console.error('Error fetching devtools count:', e);
        }

        // 5. Total Categories (Navbar table in Supabase)
        try {
            const { count } = await supabaseClient.from('navbar').select('*', { count: 'exact', head: true });
            categoriesCount = count !== null ? count : 0;
            if (statCategories) statCategories.textContent = categoriesCount;
        } catch (e) {
            console.error('Error fetching navbar categories count:', e);
        }

        // Update categories chart with live counts
        window.stearyCmsCounts = { aiCount, projectsCount, extensionsCount, devtoolsCount };
        if (categoriesChartInstance) {
            categoriesChartInstance.data.datasets[0].data = [aiCount, projectsCount, extensionsCount, devtoolsCount];
            categoriesChartInstance.update();
        }
    }

    loadDashboardStats();

    /* ----------------------------------------------------
       1. Topbar Controls & Quick Actions
       ---------------------------------------------------- */
    // Topbar Search filter trigger
    const globalSearch = document.getElementById('globalAdminSearch');
    if (globalSearch) {
        globalSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            // Dispatch filter input events dynamically to list containers
            const inputs = ['newsSearch', 'aiHubSearch', 'devtoolsSearch', 'bestToolsSearch', 'projectSearch', 'extensionSearch'];
            inputs.forEach(id => {
                const inp = document.getElementById(id);
                if (inp) {
                    inp.value = query;
                    inp.dispatchEvent(new Event('input'));
                }
            });
        });
    }

    // Quick Actions Dropdown menu toggle
    const quickActionBtn = document.getElementById('quickActionBtn');
    const quickActionMenu = document.getElementById('quickActionMenu');
    if (quickActionBtn && quickActionMenu) {
        quickActionBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            quickActionMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', () => {
            quickActionMenu.classList.add('hidden');
        });
        
        // Route actions
        quickActionMenu.querySelectorAll('button[data-target]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabTarget = btn.dataset.target;
                const sidebarBtn = document.querySelector(`.dashboard-nav-btn[data-tab="${tabTarget}"]`);
                if (sidebarBtn) sidebarBtn.click();
            });
        });
    }

    // Notifications bell toggle
    const adminBellBtn = document.getElementById('adminBellBtn');
    const adminBellDropdown = document.getElementById('adminBellDropdown');
    const clearNotificationsBtn = document.getElementById('clearAdminNotifications');
    if (adminBellBtn && adminBellDropdown) {
        adminBellBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            adminBellDropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', () => {
            adminBellDropdown.classList.add('hidden');
        });
        
        if (clearNotificationsBtn) {
            clearNotificationsBtn.addEventListener('click', () => {
                const list = adminBellDropdown.querySelector('.bell-notification-list');
                if (list) list.innerHTML = '<div class="cms-empty-state">No notifications.</div>';
                const badge = adminBellBtn.querySelector('.bell-badge');
                if (badge) badge.style.display = 'none';
            });
        }
    }

    /* ----------------------------------------------------
       2. Chart.js Dashboard visualizer
       ---------------------------------------------------- */
    renderDashboardCharts();
    renderAnalyticsGrowthChart();

    /* ----------------------------------------------------
       3. Top Picks Analytics Management
       ---------------------------------------------------- */
    async function loadTopPicksAnalytics() {
        const tableBody = document.getElementById('adminTopPicksTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px;">Loading analytics...</td></tr>`;

        try {
            const items = await getAdminAllItems();
            const db = JSON.parse(localStorage.getItem('steary.analytics.toppicks') || '{}');

            const scoredItems = items.map(item => {
                const key = `${item.type}:${item.name}`;
                const stats = db[key] || { views: 0, clicks: 0, launches: 0, bookmarks: 0, engagement: 0 };
                const score = stats.views + stats.clicks + stats.launches + stats.bookmarks + stats.engagement;
                return {
                    ...item,
                    score,
                    stats
                };
            });

            // Sort descending by score
            scoredItems.sort((a, b) => b.score - a.score);

            tableBody.innerHTML = scoredItems.map((item, idx) => {
                return `
                    <tr style="border-bottom: 1px solid var(--border-color);">
                        <td style="padding: 12px 16px; font-weight: 700; color: var(--text-primary);">#${idx + 1}</td>
                        <td style="padding: 12px 16px; font-weight: 700; color: var(--text-primary);">${escapeHtml(item.name)}</td>
                        <td style="padding: 12px 16px;"><span class="admin-badge" style="background: rgba(96, 165, 250, 0.15); color: #60A5FA; border: 1px solid rgba(96, 165, 250, 0.25); padding: 2px 6px; border-radius: 4px; font-size: 11px;">${escapeHtml(item.type)}</span></td>
                        <td style="padding: 12px 16px; text-align: right;">${item.stats.views.toLocaleString()}</td>
                        <td style="padding: 12px 16px; text-align: right;">${item.stats.clicks.toLocaleString()}</td>
                        <td style="padding: 12px 16px; text-align: right;">${item.stats.launches.toLocaleString()}</td>
                        <td style="padding: 12px 16px; text-align: right;">${item.stats.engagement.toLocaleString()}</td>
                        <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: var(--lime);">${item.score.toLocaleString()}</td>
                    </tr>
                `;
            }).join('');
        } catch(e) {
            console.error('Error loading top picks analytics:', e);
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger); padding: 20px;">Failed to load analytics: ${e.message}</td></tr>`;
        }
    }

    // Load initially and wire up tab selection trigger
    loadTopPicksAnalytics();
    const topPicksTabBtn = document.querySelector('.dashboard-nav-btn[data-tab="toppicks"]');
    if (topPicksTabBtn) {
        topPicksTabBtn.addEventListener('click', loadTopPicksAnalytics);
    }

    /* ----------------------------------------------------
       4. AI Hub Management (localStorage Mock CRUD)
       ---------------------------------------------------- */
    const aiHubForm = document.getElementById('aiHubCmsForm');
    if (aiHubForm) {
        const saveBtn = aiHubForm.querySelector('button[type="submit"]');
        const listContainer = document.getElementById('adminAiHubList');
        const searchInput = document.getElementById('aiHubSearch');
        const nameInput = document.getElementById('aiNameInput');
        const descInput = document.getElementById('aiDescInput');
        const logoInput = document.getElementById('aiLogoInput');
        const linkInput = document.getElementById('aiLinkInput');
        
        const cancelBtn = createCancelButton(aiHubForm, clearAiForm);
        let aiQuery = '';

        // Preseed AI list if empty
        if (!localStorage.getItem('steary.cms.aihub')) {
            const preseed = [
                { id: '1', name: 'OpenAI', description: 'Advanced AI research and language models for productivity, coding, and automation.', logo: 'src/assets/ai logo/open ai logo.jpg', url: 'https://openai.com' },
                { id: '2', name: 'Claude', description: 'AI assistant focused on reasoning, analysis, coding, and long-form tasks.', logo: 'src/assets/ai logo/claude logo.jpg', url: 'https://anthropic.com' },
                { id: '3', name: 'Gemini', description: 'Google\'s multimodal AI platform for research, coding, productivity, and content generation.', logo: 'src/assets/ai logo/gemini logo.jpg', url: 'https://gemini.google.com' }
            ];
            localStorage.setItem('steary.cms.aihub', JSON.stringify(preseed));
        }

        function clearAiForm() {
            editState.aiId = null;
            aiHubForm.reset();
            setFormMode(aiHubForm, saveBtn, 'Register AI Card', null);
            updateAiPreview();
        }

        function loadAiList() {
            if (!listContainer) return;
            const data = JSON.parse(localStorage.getItem('steary.cms.aihub') || '[]');
            const filtered = data.filter(item => matchesSearch(item, [item.name, item.description], aiQuery));

            listContainer.innerHTML = filtered.length > 0 ? filtered.map(item => `
                <div class="cms-list-item">
                    <span>🤖 ${escapeHtml(item.name)}</span>
                    <div class="cms-item-actions">
                        <button class="cms-edit-btn edit-btn" data-id="${item.id}" data-name="${escapeHtml(item.name)}" data-desc="${escapeHtml(item.description)}" data-logo="${escapeHtml(item.logo || '')}" data-url="${escapeHtml(item.url || '')}">Edit</button>
                        <button class="delete-btn" data-id="${item.id}">✕</button>
                    </div>
                </div>
            `).join('') : `<div class="cms-empty-state">No AI tools match this search.</div>`;

            // Bind edits
            listContainer.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    editState.aiId = btn.dataset.id;
                    nameInput.value = btn.dataset.name || '';
                    descInput.value = btn.dataset.desc || '';
                    logoInput.value = btn.dataset.logo || '';
                    linkInput.value = btn.dataset.url || '';
                    
                    setFormMode(aiHubForm, saveBtn, 'Register AI Card', editState.aiId);
                });
            });

            // Bind deletes
            listContainer.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (!confirm('Remove this AI tool card?')) return;
                    let items = JSON.parse(localStorage.getItem('steary.cms.aihub') || '[]');
                    items = items.filter(i => i.id !== btn.dataset.id);
                    localStorage.setItem('steary.cms.aihub', JSON.stringify(items));
                    
                    logActivity(`AI card removed`, btn.dataset.id);
                    if (editState.aiId === btn.dataset.id) clearAiForm();
                    loadAiList();
                    loadDashboardStats();
                });
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                aiQuery = searchInput.value;
                loadAiList();
            });
        }

        aiHubForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let items = JSON.parse(localStorage.getItem('steary.cms.aihub') || '[]');
            
            const payload = {
                id: editState.aiId || String(Date.now()),
                name: nameInput.value.trim(),
                description: descInput.value.trim(),
                logo: logoInput.value.trim() || 'src/assets/project1.webp',
                url: linkInput.value.trim() || '#'
            };

            if (editState.aiId) {
                items = items.map(i => i.id === editState.aiId ? payload : i);
            } else {
                items.push(payload);
            }

            localStorage.setItem('steary.cms.aihub', JSON.stringify(items));
            alert(editState.aiId ? 'AI card updated successfully!' : 'AI card registered successfully!');
            logActivity(editState.aiId ? 'AI updated' : 'AI registered', payload.name);
            clearAiForm();
            loadAiList();
            loadDashboardStats();
        });

        loadAiList();
    }

    /* ----------------------------------------------------
       5. Dev Tools Management (localStorage Mock CRUD)
       ---------------------------------------------------- */
    const devtoolsForm = document.getElementById('devtoolsCmsForm');
    if (devtoolsForm) {
        const saveBtn = devtoolsForm.querySelector('button[type="submit"]');
        const listContainer = document.getElementById('adminDevtoolsList');
        const searchInput = document.getElementById('devtoolsSearch');
        const nameInput = document.getElementById('toolNameInput');
        const descInput = document.getElementById('toolDescInput');
        const iconInput = document.getElementById('toolIconInput');
        const linkInput = document.getElementById('toolLinkInput');
        
        const cancelBtn = createCancelButton(devtoolsForm, clearDevtoolsForm);
        let toolQuery = '';

        // Preseed if empty
        if (!localStorage.getItem('steary.cms.devtools')) {
            const preseed = [
                { id: '1', name: 'AI Prompts', description: 'Curated system prompts, code generation templates, and assistant optimization guidelines.', icon: 'prompt', url: 'https://aiopenlibrary.netlify.app/' },
                { id: '2', name: 'CLI Commands', description: 'Essential developer scripts, terminal workflow commands, and command line shortcuts.', icon: 'terminal', url: 'https://github.com' }
            ];
            localStorage.setItem('steary.cms.devtools', JSON.stringify(preseed));
        }

        function clearDevtoolsForm() {
            editState.toolId = null;
            devtoolsForm.reset();
            setFormMode(devtoolsForm, saveBtn, 'Register Tool', null);
            updateDevtoolsPreview();
        }

        function loadDevtoolsList() {
            if (!listContainer) return;
            const data = JSON.parse(localStorage.getItem('steary.cms.devtools') || '[]');
            const filtered = data.filter(item => matchesSearch(item, [item.name, item.description], toolQuery));

            listContainer.innerHTML = filtered.length > 0 ? filtered.map(item => `
                <div class="cms-list-item">
                    <span>🛠️ ${escapeHtml(item.name)}</span>
                    <div class="cms-item-actions">
                        <button class="cms-edit-btn edit-btn" data-id="${item.id}" data-name="${escapeHtml(item.name)}" data-desc="${escapeHtml(item.description)}" data-icon="${escapeHtml(item.icon || '')}" data-url="${escapeHtml(item.url || '')}">Edit</button>
                        <button class="delete-btn" data-id="${item.id}">✕</button>
                    </div>
                </div>
            `).join('') : `<div class="cms-empty-state">No dev tools match this search.</div>`;

            // Bind edits
            listContainer.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    editState.toolId = btn.dataset.id;
                    nameInput.value = btn.dataset.name || '';
                    descInput.value = btn.dataset.desc || '';
                    iconInput.value = btn.dataset.icon || '';
                    if (linkInput) linkInput.value = btn.dataset.url || '';
                    
                    setFormMode(devtoolsForm, saveBtn, 'Register Tool', editState.toolId);
                });
            });

            // Bind deletes
            listContainer.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (!confirm('Remove this dev tool?')) return;
                    let items = JSON.parse(localStorage.getItem('steary.cms.devtools') || '[]');
                    items = items.filter(i => i.id !== btn.dataset.id);
                    localStorage.setItem('steary.cms.devtools', JSON.stringify(items));
                    
                    logActivity(`Dev tool removed`, btn.dataset.id);
                    if (editState.toolId === btn.dataset.id) clearDevtoolsForm();
                    loadDevtoolsList();
                });
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                toolQuery = searchInput.value;
                loadDevtoolsList();
            });
        }

        devtoolsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let items = JSON.parse(localStorage.getItem('steary.cms.devtools') || '[]');
            
            const payload = {
                id: editState.toolId || String(Date.now()),
                name: nameInput.value.trim(),
                description: descInput.value.trim(),
                icon: iconInput.value.trim() || 'settings',
                url: linkInput ? linkInput.value.trim() || '#' : '#'
            };

            if (editState.toolId) {
                items = items.map(i => i.id === editState.toolId ? payload : i);
            } else {
                items.push(payload);
            }

            localStorage.setItem('steary.cms.devtools', JSON.stringify(items));
            alert(editState.toolId ? 'Dev tool updated successfully!' : 'Dev tool registered successfully!');
            logActivity(editState.toolId ? 'Dev tool updated' : 'Dev tool registered', payload.name);
            clearDevtoolsForm();
            loadDevtoolsList();
        });

        loadDevtoolsList();
    }

    /* ----------------------------------------------------
       5.5. Best Tools Management (localStorage Mock CRUD)
       ---------------------------------------------------- */
    const bestToolsForm = document.getElementById('bestToolsCmsForm');
    if (bestToolsForm) {
        const saveBtn = bestToolsForm.querySelector('button[type="submit"]');
        const listContainer = document.getElementById('adminBestToolsList');
        const searchInput = document.getElementById('bestToolsSearch');
        const nameInput = document.getElementById('bestToolNameInput');
        const descInput = document.getElementById('bestToolDescInput');
        const urlInput = document.getElementById('bestToolUrlInput');
        const iconInput = document.getElementById('bestToolIconInput');
        
        const cancelBtn = createCancelButton(bestToolsForm, clearBestToolsForm);
        let bestToolQuery = '';

        // Preseed if empty
        if (!localStorage.getItem('steary.cms.besttools')) {
            const preseed = [
                { id: '1', name: 'GitHub', description: 'Code hosting & collaboration', url: 'https://github.com', icon: 'github' },
                { id: '2', name: 'VS Code', description: 'Powerful code editor', url: 'https://code.visualstudio.com', icon: 'vscode' },
                { id: '3', name: 'Figma', description: 'UI/UX design platform', url: 'https://figma.com', icon: 'figma' },
                { id: '4', name: 'Vercel', description: 'Frontend cloud platform', url: 'https://vercel.com', icon: 'vercel' },
                { id: '5', name: 'Netlify', description: 'Web app deployment', url: 'https://netlify.com', icon: 'netlify' },
                { id: '6', name: 'Supabase', description: 'Open source Firebase alt', url: 'https://supabase.com', icon: 'supabase' }
            ];
            localStorage.setItem('steary.cms.besttools', JSON.stringify(preseed));
        }

        function clearBestToolsForm() {
            editState.bestToolId = null;
            bestToolsForm.reset();
            setFormMode(bestToolsForm, saveBtn, 'Register Best Tool', null);
        }

        function loadBestToolsList() {
            if (!listContainer) return;
            const data = JSON.parse(localStorage.getItem('steary.cms.besttools') || '[]');
            const filtered = data.filter(item => matchesSearch(item, [item.name, item.description], bestToolQuery));

            listContainer.innerHTML = filtered.length > 0 ? filtered.map(item => `
                <div class="cms-list-item">
                    <span>🛠️ ${escapeHtml(item.name)}</span>
                    <div class="cms-item-actions">
                        <button class="cms-edit-btn edit-btn" data-id="${item.id}" data-name="${escapeHtml(item.name)}" data-desc="${escapeHtml(item.description)}" data-url="${escapeHtml(item.url || '')}" data-icon="${escapeHtml(item.icon || '')}">Edit</button>
                        <button class="delete-btn" data-id="${item.id}">✕</button>
                    </div>
                </div>
            `).join('') : `<div class="cms-empty-state">No best tools match this search.</div>`;

            // Bind edits
            listContainer.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    editState.bestToolId = btn.dataset.id;
                    nameInput.value = btn.dataset.name || '';
                    descInput.value = btn.dataset.desc || '';
                    urlInput.value = btn.dataset.url || '';
                    iconInput.value = btn.dataset.icon || '';
                    
                    setFormMode(bestToolsForm, saveBtn, 'Register Best Tool', editState.bestToolId);
                });
            });

            // Bind deletes
            listContainer.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (!confirm('Remove this best tool?')) return;
                    let items = JSON.parse(localStorage.getItem('steary.cms.besttools') || '[]');
                    items = items.filter(i => i.id !== btn.dataset.id);
                    localStorage.setItem('steary.cms.besttools', JSON.stringify(items));
                    
                    logActivity(`Best tool removed`, btn.dataset.id);
                    if (editState.bestToolId === btn.dataset.id) clearBestToolsForm();
                    loadBestToolsList();
                });
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                bestToolQuery = searchInput.value;
                loadBestToolsList();
            });
        }

        bestToolsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let items = JSON.parse(localStorage.getItem('steary.cms.besttools') || '[]');
            
            const payload = {
                id: editState.bestToolId || String(Date.now()),
                name: nameInput.value.trim(),
                description: descInput.value.trim(),
                url: urlInput.value.trim(),
                icon: iconInput.value.trim() || 'default'
            };

            if (editState.bestToolId) {
                items = items.map(i => i.id === editState.bestToolId ? payload : i);
            } else {
                items.push(payload);
            }

            localStorage.setItem('steary.cms.besttools', JSON.stringify(items));
            alert(editState.bestToolId ? 'Best tool updated successfully!' : 'Best tool registered successfully!');
            logActivity(editState.bestToolId ? 'Best tool updated' : 'Best tool registered', payload.name);
            clearBestToolsForm();
            loadBestToolsList();
        });

        loadBestToolsList();
    }

    /* ----------------------------------------------------
       6. Projects & Extensions Management (Supabase Projects DB table)
       ---------------------------------------------------- */
    const projectsForm = document.getElementById('projectsCmsForm');
    if (projectsForm) {
        const saveBtn = projectsForm.querySelector('button[type="submit"]');
        const listContainer = document.getElementById('adminProjectsList');
        const searchInput = document.getElementById('projectSearch');
        const nameInput = document.getElementById('projNameInput');
        const descInput = document.getElementById('projDescInput');
        const urlInput = document.getElementById('projUrlInput');
        const imageInput = document.getElementById('projImageInput');
        const isExtensionCheckbox = document.getElementById('projIsExtension');
        const livePreview = document.getElementById('projectsLivePreview');

        const cancelBtn = createCancelButton(projectsForm, clearProjectsForm);
        let projectQuery = '';

        function updateProjectsPreview() {
            if (!livePreview) return;
            const name = nameInput.value.trim() || 'Project Name';
            const desc = descInput.value.trim() || 'Project description...';
            const image = imageInput.value.trim() || 'src/assets/project1.webp';
            const isExt = isExtensionCheckbox.checked;

            livePreview.innerHTML = `
                <div class="movie-card glass-card" style="width: 100%; max-width: 300px; pointer-events: none; margin: 0;">
                    <div class="movie-poster-container">
                        <img class="movie-poster" src="${escapeHtml(image)}" alt="Preview" style="object-fit: cover;">
                        <div class="movie-poster-overlay"></div>
                        <span class="card-genre-badge glass-panel">${isExt ? 'Extension' : 'AI Tool'}</span>
                        <button class="card-play-btn project-card-btn">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="movie-card-info">
                        <h3 class="movie-title">${escapeHtml(name)}</h3>
                        <p class="movie-desc">${escapeHtml(desc)}</p>
                    </div>
                </div>
            `;
        }

        projectsForm.addEventListener('input', updateProjectsPreview);

        function clearProjectsForm() {
            editState.projectId = null;
            projectsForm.reset();
            if (isExtensionCheckbox) isExtensionCheckbox.checked = false;
            setFormMode(projectsForm, saveBtn, 'Save Card', null);
        }

        async function loadProjectsList() {
            if (!listContainer) return;
            const { data, error } = await supabaseClient
                .from('projects')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error || !data) return;

            const filtered = data.filter(item => matchesSearch(item, [item.name, item.description], projectQuery));

            listContainer.innerHTML = filtered.length > 0 ? filtered.map(item => {
                const isExt = (item.url || '').includes('chrome.google.com') || (item.url || '').includes('webstore') || (item.url || '').includes('.crx');
                const badge = isExt ? '<span class="admin-badge extension-badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid #f59e0b; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-right: 6px;">🧩 Extension</span>' 
                                    : '<span class="admin-badge project-badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid #10b981; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-right: 6px;">💻 Project</span>';
                
                return `
                    <div class="cms-list-item">
                        <span>${badge} ${escapeHtml(item.name)}</span>
                        <div class="cms-item-actions">
                            <button class="cms-edit-btn edit-btn" data-id="${item.id}" data-name="${escapeHtml(item.name)}" data-desc="${escapeHtml(item.description)}" data-url="${escapeHtml(item.url || '')}" data-image="${escapeHtml(item.image_url || '')}" data-is-ext="${isExt}">Edit</button>
                            <button class="delete-btn" data-id="${item.id}">✕</button>
                        </div>
                    </div>
                `;
            }).join('') : `<div class="cms-empty-state">No items match this search.</div>`;

            // Bind edits
            listContainer.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    editState.projectId = btn.dataset.id;
                    nameInput.value = btn.dataset.name || '';
                    descInput.value = btn.dataset.desc || '';
                    urlInput.value = btn.dataset.url || '';
                    imageInput.value = btn.dataset.image || '';
                    if (isExtensionCheckbox) {
                        isExtensionCheckbox.checked = btn.dataset.isExt === 'true';
                    }
                    
                    setFormMode(projectsForm, saveBtn, 'Save Card', editState.projectId);
                });
            });

            // Bind deletes
            listContainer.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('Are you sure you want to delete this project/extension card?')) return;
                    const id = btn.dataset.id;
                    const { error } = await supabaseClient.from('projects').delete().eq('id', id);
                    if (error) alert('Error: ' + error.message);
                    else {
                        logActivity(`Project/Extension deleted`, id);
                        if (editState.projectId === id) clearProjectsForm();
                        loadProjectsList();
                        loadDashboardStats();
                    }
                });
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                projectQuery = searchInput.value;
                loadProjectsList();
            });
        }

        projectsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            let urlVal = urlInput.value.trim();
            if (isExtensionCheckbox && isExtensionCheckbox.checked) {
                if (!urlVal.includes('chrome.google.com') && !urlVal.includes('webstore') && !urlVal.includes('.crx')) {
                    if (urlVal === '#' || !urlVal) {
                        urlVal = 'https://chrome.google.com/webstore';
                    }
                }
            }

            const payload = {
                name: nameInput.value.trim(),
                description: descInput.value.trim(),
                url: urlVal || '#',
                image_url: imageInput.value.trim() || 'src/assets/project1.webp'
            };

            const query = supabaseClient.from('projects');
            const result = editState.projectId 
                ? await query.update(payload).eq('id', editState.projectId)
                : await query.insert([
                    Object.assign(payload, { sort_order: Math.floor(Date.now() / 1000) })
                  ]);

            if (result.error) {
                alert('Database Error: ' + result.error.message);
            } else {
                alert(editState.projectId ? 'Card updated successfully!' : 'Card saved successfully!');
                logActivity(editState.projectId ? 'Card updated' : 'Card created', payload.name);
                clearProjectsForm();
                loadProjectsList();
                loadDashboardStats();
            }
        });

        loadProjectsList();
    }

    /* ----------------------------------------------------
       6.5 Hero Slider Management (Supabase slider DB table CRUD)
       ---------------------------------------------------- */
    const sliderForm = document.getElementById('sliderCmsForm');
    if (sliderForm) {
        const saveBtn = sliderForm.querySelector('button[type="submit"]');
        const listContainer = document.getElementById('adminSliderList');
        const searchInput = document.getElementById('sliderSearch');
        const titleInput = document.getElementById('slideTitleInput');
        const synopsisInput = document.getElementById('slideSynopsisInput');
        const badgeInput = document.getElementById('slideBadgeInput');
        const genresInput = document.getElementById('slideGenresInput');
        const imageInput = document.getElementById('slideImageInput');
        const videoUrlInput = document.getElementById('slideVideoUrlInput');
        const websiteUrlInput = document.getElementById('slideWebsiteUrlInput');
        
        const cancelBtn = createCancelButton(sliderForm, clearSliderForm);
        let sliderQuery = '';

        function clearSliderForm() {
            editState.sliderId = null;
            sliderForm.reset();
            setFormMode(sliderForm, saveBtn, 'Save Banner Slide', null);
        }

        async function loadSliderList() {
            if (!listContainer) return;
            const { data, error } = await supabaseClient
                .from('slider')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error || !data) return;

            const filtered = data.filter(item => matchesSearch(item, [item.title, item.synopsis], sliderQuery));

            listContainer.innerHTML = filtered.length > 0 ? filtered.map(item => `
                <div class="cms-list-item">
                    <span>🎞️ ${escapeHtml(item.title)}</span>
                    <div class="cms-item-actions">
                        <button class="cms-edit-btn edit-btn" data-id="${item.id}" data-title="${escapeHtml(item.title)}" data-synopsis="${escapeHtml(item.synopsis)}" data-badge="${escapeHtml(item.badge || '')}" data-genres="${escapeHtml(Array.isArray(item.genres) ? item.genres.join(', ') : (item.genres || ''))}" data-image="${escapeHtml(item.image_url)}" data-video-url="${escapeHtml((item.video_url || '').split('|||')[0] || '')}" data-website-url="${escapeHtml((item.video_url || '').split('|||')[1] || '')}">Edit</button>
                        <button class="delete-btn" data-id="${item.id}">✕</button>
                    </div>
                </div>
            `).join('') : `<div class="cms-empty-state">No slider banners match this search.</div>`;

            // Bind edits
            listContainer.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    editState.sliderId = btn.dataset.id;
                    titleInput.value = btn.dataset.title || '';
                    synopsisInput.value = btn.dataset.synopsis || '';
                    badgeInput.value = btn.dataset.badge || '';
                    genresInput.value = btn.dataset.genres || '';
                    imageInput.value = btn.dataset.image || '';
                    videoUrlInput.value = btn.dataset.videoUrl || '';
                    websiteUrlInput.value = btn.dataset.websiteUrl || '';
                    
                    setFormMode(sliderForm, saveBtn, 'Save Banner Slide', editState.sliderId);
                });
            });

            // Bind deletes
            listContainer.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('Are you sure you want to delete this slider banner?')) return;
                    const id = btn.dataset.id;
                    const { error } = await supabaseClient.from('slider').delete().eq('id', id);
                    if (error) alert('Error: ' + error.message);
                    else {
                        logActivity(`Slider banner deleted`, id);
                        if (editState.sliderId === id) clearSliderForm();
                        loadSliderList();
                        loadDashboardStats();
                    }
                });
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                sliderQuery = searchInput.value;
                loadSliderList();
            });
        }

        sliderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const genresArr = genresInput.value.split(',').map(s => s.trim()).filter(Boolean);
            const combinedUrl = `${videoUrlInput.value.trim()}|||${websiteUrlInput.value.trim()}`;

            const payload = {
                title: titleInput.value.trim(),
                synopsis: synopsisInput.value.trim(),
                badge: badgeInput.value.trim() || '🔥 Now Trending',
                genres: genresArr,
                image_url: imageInput.value.trim(),
                video_url: combinedUrl
            };

            const query = supabaseClient.from('slider');
            const result = editState.sliderId 
                ? await query.update(payload).eq('id', editState.sliderId)
                : await query.insert([
                    Object.assign(payload, { sort_order: Math.floor(Date.now() / 1000) })
                  ]);

            if (result.error) {
                alert('Database Error: ' + result.error.message);
            } else {
                alert(editState.sliderId ? 'Slider banner updated successfully!' : 'Slider banner created successfully!');
                logActivity(editState.sliderId ? 'Slider banner updated' : 'Slider banner created', payload.title);
                clearSliderForm();
                loadSliderList();
                loadDashboardStats();
            }
        });

        loadSliderList();
    }

    /* ----------------------------------------------------
       7. Categories Management (localStorage CRUD)
       ---------------------------------------------------- */
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        const catNameInput = document.getElementById('catNameInput');
        const catSlugInput = document.getElementById('catSlugInput');
        const listContainer = document.getElementById('adminCategoriesList');

        async function loadCategoriesList() {
            if (!listContainer) return;
            const { data, error } = await supabaseClient
                .from('navbar')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error || !data) {
                listContainer.innerHTML = `<div class="cms-empty-state">Failed to load categories.</div>`;
                return;
            }

            listContainer.innerHTML = data.length > 0 ? data.map(item => `
                <div class="cms-list-item">
                    <span>🏷️ ${escapeHtml(item.title)} (${escapeHtml(item.tab_id)})</span>
                    <button class="delete-btn" data-tabid="${item.tab_id}">✕</button>
                </div>
            `).join('') : `<div class="cms-empty-state">No categories defined yet.</div>`;

            // Bind deletes
            listContainer.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const tabId = btn.dataset.tabid;
                    if (tabId === 'home') {
                        alert('The Home category is protected and cannot be deleted.');
                        return;
                    }
                    if (!confirm(`Are you sure you want to delete the "${tabId}" category?`)) return;

                    const { error } = await supabaseClient
                        .from('navbar')
                        .delete()
                        .eq('tab_id', tabId);

                    if (error) {
                        alert('Error deleting category: ' + error.message);
                    } else {
                        logActivity('Category deleted', tabId);
                        loadCategoriesList();
                    }
                });
            });
        }

        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                title: catNameInput.value.trim(),
                tab_id: catSlugInput.value.trim(),
                sort_order: Math.floor(Date.now() / 1000)
            };

            const { error } = await supabaseClient
                .from('navbar')
                .insert([payload]);

            if (error) {
                alert('Error creating category: ' + error.message);
            } else {
                logActivity('Category created', payload.title);
                categoryForm.reset();
                loadCategoriesList();
                loadDashboardStats();
            }
        });

        loadCategoriesList();
    }

    /* Section 8: Media Library removed */


    /* ----------------------------------------------------
       9. User directory (Mock list loader)
       ---------------------------------------------------- */
    const usersTableBody = document.getElementById('usersTableBody');
    if (usersTableBody) {
        const users = [
            { name: 'Super Admin', email: 'admin@steary.com', role: 'Owner', status: 'online' },
            { name: 'Developer Assistant', email: 'dev@steary.com', role: 'Developer', status: 'offline' },
            { name: 'Content Editor', email: 'editor@steary.com', role: 'Moderator', status: 'offline' }
        ];
        
        usersTableBody.innerHTML = users.map(user => `
            <tr>
                <td>${escapeHtml(user.name)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td><span class="admin-badge" style="background: ${user.role === 'Owner' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)'}; color: ${user.role === 'Owner' ? '#ef4444' : '#3b82f6'}; border: 1px solid ${user.role === 'Owner' ? '#ef4444' : '#3b82f6'};">${user.role}</span></td>
                <td><span class="status-indicator ${user.status}">${user.status === 'online' ? 'Active Now' : 'Offline'}</span></td>
                <td>
                    <button class="cms-edit-btn" ${user.role === 'Owner' ? 'disabled' : ''} onclick="alert('User privileges are protected in demo mode.')">Manage</button>
                </td>
            </tr>
        `).join('');
    }

    /* ----------------------------------------------------
       10. Settings & Footer Settings
       ---------------------------------------------------- */
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        const copyrightInput = document.getElementById('settingsCopyright');
        const twitterInput = document.getElementById('settingsTwitter');
        const discordInput = document.getElementById('settingsDiscord');
        const instagramInput = document.getElementById('settingsInstagram');
        const youtubeInput = document.getElementById('settingsYoutube');

        async function loadSettings() {
            const { data } = await supabaseClient.from('footer').select('*');
            if (data) {
                const settings = {};
                data.forEach(item => {
                    if (item.key) settings[item.key] = item.value;
                });

                if (copyrightInput) copyrightInput.value = settings['footer_copyright'] || '© 2026 Steary Inc. All rights reserved.';
                if (twitterInput) twitterInput.value = settings['social_twitter'] || '';
                if (discordInput) discordInput.value = settings['social_discord'] || '';
                if (instagramInput) instagramInput.value = settings['social_instagram'] || '';
                if (youtubeInput) youtubeInput.value = settings['social_youtube'] || '';
            }
        }

        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = [
                { key: 'footer_copyright', value: copyrightInput.value.trim() },
                { key: 'social_twitter', value: twitterInput.value.trim() },
                { key: 'social_discord', value: discordInput.value.trim() },
                { key: 'social_instagram', value: instagramInput.value.trim() },
                { key: 'social_youtube', value: youtubeInput.value.trim() }
            ];

            const { error } = await supabaseClient.from('footer').upsert(payload, { onConflict: 'key' });
            if (error) {
                alert('Error updating settings: ' + error.message);
            } else {
                alert('Settings saved successfully!');
                logActivity('Settings updated', 'Global config saved');
            }
        });

        loadSettings();
    }

    /* ----------------------------------------------------
       11. Activity logs feed helper
       ---------------------------------------------------- */
    const activityFeedList = document.getElementById('activityFeedList');
    
    // Seed initial activity
    if (!localStorage.getItem('steary.cms.activity')) {
        const preseed = [
            { text: 'Supabase storage connections validated', target: 'Database', time: '10 mins ago' },
            { text: 'Website footer copyright text updated', target: 'Settings', time: '1 hour ago' },
            { text: 'Registered OpenAI brand logo to AI Hub', target: 'AI Hub', time: '3 hours ago' }
        ];
        localStorage.setItem('steary.cms.activity', JSON.stringify(preseed));
    }

    function logActivity(action, target) {
        const logs = JSON.parse(localStorage.getItem('steary.cms.activity') || '[]');
        logs.unshift({
            text: action,
            target: target,
            time: 'Just now'
        });
        // cap at 10 items
        if (logs.length > 10) logs.pop();
        localStorage.setItem('steary.cms.activity', JSON.stringify(logs));
        renderActivityFeed();
    }

    function renderActivityFeed() {
        if (!activityFeedList) return;
        const logs = JSON.parse(localStorage.getItem('steary.cms.activity') || '[]');
        activityFeedList.innerHTML = logs.map(log => `
            <div class="activity-item">
                <div class="activity-icon-wrap">⚡</div>
                <div class="activity-details">
                    <span><strong>${escapeHtml(log.text)}</strong> - ${escapeHtml(log.target)}</span>
                    <small>${escapeHtml(log.time)}</small>
                </div>
            </div>
        `).join('');
    }

    renderActivityFeed();

    // Export Backup JSON
    const exportBtn = document.getElementById('exportBackupBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            try {
                const [navbar, slider, projects, footer] = await Promise.all([
                    fetchTableRows('navbar'),
                    fetchTableRows('slider'),
                    fetchTableRows('projects'),
                    fetchTableRows('footer')
                ]);
                const backupData = { navbar, slider, projects, footer, local_aihub: JSON.parse(localStorage.getItem('steary.cms.aihub') || '[]'), local_devtools: JSON.parse(localStorage.getItem('steary.cms.devtools') || '[]'), local_besttools: JSON.parse(localStorage.getItem('steary.cms.besttools') || '[]') };
                
                const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `steary_cms_backup_${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (e) {
                alert('Export failed: ' + e.message);
            }
        });
    }

    async function fetchTableRows(table) {
        const { data } = await supabaseClient.from(table).select('*');
        return data || [];
    }
}

/* ==========================================================================
   Chart.js Initialization helpers
   ========================================================================== */
let trafficChartInstance = null;
let categoriesChartInstance = null;
let growthChartInstance = null;

function renderDashboardCharts() {
    const trafficCtx = document.getElementById('trafficChart');
    if (trafficCtx) {
        if (trafficChartInstance) trafficChartInstance.destroy();
        
        const ctx = trafficCtx.getContext('2d');
        
        // Dynamic theme configuration
        const isLight = document.body.classList.contains('light-mode');
        const textColor = isLight ? '#4A4D55' : '#D1D5DB';
        const gridColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
        const tooltipBg = isLight ? '#ffffff' : '#16161b';
        const tooltipBorder = isLight ? '#000000' : '#ffffff';
        const secondaryLineColor = isLight ? '#000000' : '#ffffff';
        const pointBgColor = isLight ? '#ffffff' : '#16161b';
        
        // Professional smooth gradients for fills
        const viewFill = ctx.createLinearGradient(0, 0, 0, 300);
        viewFill.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        viewFill.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
        
        const visitorFill = ctx.createLinearGradient(0, 0, 0, 300);
        visitorFill.addColorStop(0, 'rgba(147, 51, 234, 0.4)');
        visitorFill.addColorStop(1, 'rgba(147, 51, 234, 0.0)');

        let trafficData = JSON.parse(localStorage.getItem('steary.analytics.traffic') || '[]');
        if (trafficData.length === 0) {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            trafficData = days.map(d => ({ day: d, views: 0, visitors: 0 }));
        }
        
        const tLabels = trafficData.map(t => t.day);
        const tViews = trafficData.map(t => t.views);
        const tVisitors = trafficData.map(t => t.visitors);

        trafficChartInstance = new Chart(trafficCtx, {
            type: 'line',
            data: {
                labels: tLabels,
                datasets: [
                    {
                        label: 'Page Views',
                        data: tViews,
                        borderColor: '#7c3aed',
                        backgroundColor: 'rgba(124, 58, 237, 0.05)',
                        fill: true,
                        tension: 0,
                        borderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        pointBackgroundColor: pointBgColor,
                        pointBorderColor: '#7c3aed',
                        pointBorderWidth: 2,
                        pointHoverBackgroundColor: '#7c3aed'
                    },
                    {
                        label: 'Unique Visitors',
                        data: tVisitors,
                        borderColor: secondaryLineColor,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                        fill: true,
                        tension: 0,
                        borderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        pointBackgroundColor: pointBgColor,
                        pointBorderColor: secondaryLineColor,
                        pointBorderWidth: 2,
                        pointHoverBackgroundColor: secondaryLineColor
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: { 
                            color: textColor, 
                            font: { family: 'Space Grotesk', size: 11, weight: '700' },
                            usePointStyle: true,
                            boxWidth: 8
                        }
                    },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: tooltipBorder,
                        borderWidth: 2,
                        padding: 12,
                        cornerRadius: 0,
                        displayColors: true,
                        boxPadding: 4,
                        titleFont: { family: 'Space Mono', weight: '700' },
                        bodyFont: { family: 'Space Mono' }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor, font: { family: 'Space Mono', size: 10 } }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { 
                            color: textColor, 
                            font: { family: 'Space Mono', size: 10 },
                            callback: function(value) { return value >= 1000 ? (value/1000) + 'k' : value; }
                        }
                    }
                }
            }
        });
    }

    const categoriesCtx = document.getElementById('categoriesChart');
    if (categoriesCtx) {
        if (categoriesChartInstance) categoriesChartInstance.destroy();
        const counts = window.stearyCmsCounts || { aiCount: 0, projectsCount: 0, extensionsCount: 0, devtoolsCount: 0 };
        
        const isLight = document.body.classList.contains('light-mode');
        const textColor = isLight ? '#000000' : '#ffffff';
        const tooltipBg = isLight ? '#ffffff' : '#16161b';
        const tooltipBorder = isLight ? '#000000' : '#ffffff';

        categoriesChartInstance = new Chart(categoriesCtx, {
            type: 'doughnut',
            data: {
                labels: ['AI Tools', 'Projects', 'Extensions', 'Dev Tools'],
                datasets: [{
                    data: [counts.aiCount, counts.projectsCount, counts.extensionsCount, counts.devtoolsCount],
                    backgroundColor: [
                        '#d4fc34',
                        '#3b82f6',
                        '#f59e0b',
                        '#ec4899'
                    ],
                    borderWidth: 2,
                    borderColor: tooltipBorder,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { 
                            color: textColor, 
                            font: { family: 'Space Grotesk', size: 11, weight: '700' },
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        bodyColor: textColor,
                        borderColor: tooltipBorder,
                        borderWidth: 2,
                        padding: 12,
                        cornerRadius: 0,
                        displayColors: true,
                        bodyFont: { family: 'Space Mono' }
                    }
                }
            }
        });
    }
}

function renderAnalyticsGrowthChart() {
    const growthCtx = document.getElementById('visitorGrowthChart');
    if (growthCtx) {
        if (growthChartInstance) growthChartInstance.destroy();
        
        const ctx = growthCtx.getContext('2d');
        
        // Dynamic theme configuration
        const isLight = document.body.classList.contains('light-mode');
        const textColor = isLight ? '#4A4D55' : '#D1D5DB';
        const gridColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
        const tooltipBg = isLight ? '#ffffff' : '#16161b';
        const tooltipBorder = isLight ? '#000000' : '#ffffff';
        const pointBgColor = isLight ? '#ffffff' : '#16161b';
        
        const fillGlow = ctx.createLinearGradient(0, 0, 0, 300);
        fillGlow.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
        fillGlow.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

        let trafficData = JSON.parse(localStorage.getItem('steary.analytics.traffic') || '[]');
        if (trafficData.length === 0) {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            trafficData = days.map(d => ({ day: d, views: 0, visitors: 0 }));
        }

        // For "Growth", we can just plot the unique visitors data as "New Visitors" proxy
        const tLabels = trafficData.map(t => t.day);
        const tVisitors = trafficData.map(t => t.visitors);

        growthChartInstance = new Chart(growthCtx, {
            type: 'line',
            data: {
                labels: tLabels,
                datasets: [{
                    label: 'New Visitors',
                    data: tVisitors,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    fill: true,
                    tension: 0,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: pointBgColor,
                    pointBorderColor: '#10b981',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#10b981'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: tooltipBg,
                        titleColor: textColor,
                        bodyColor: textColor,
                        borderColor: tooltipBorder,
                        borderWidth: 2,
                        padding: 12,
                        cornerRadius: 0,
                        displayColors: false,
                        titleFont: { family: 'Space Mono', weight: '700' },
                        bodyFont: { family: 'Space Mono' }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor, font: { family: 'Space Mono', size: 10 } }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: { 
                            color: textColor, 
                            font: { family: 'Space Mono', size: 10 },
                            callback: function(value) { return value >= 1000 ? (value/1000) + 'k' : value; }
                        }
                    }
                }
            }
        });
    }
}

