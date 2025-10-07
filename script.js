// Ultimate Task Manager with Password Authentication
class UltimateTaskManager {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.currentProject = 'inbox';
        this.currentFilter = 'all';
        this.currentView = 'list';
        this.searchQuery = '';
        this.calendarDate = new Date();
        this.timer = {
            active: false,
            time: 25 * 60, // 25 minutes in seconds
            originalTime: 25 * 60,
            interval: null,
            currentTask: null
        };
        this.notifications = [];
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupTheme();
        this.setupEventListeners();
        this.startClock();
        this.checkDueTasks();
    }

    // Enhanced Authentication with Password
    loadUsers() {
        return JSON.parse(localStorage.getItem('ultimateTaskManagerUsers')) || {};
    }

    saveUsers() {
        localStorage.setItem('ultimateTaskManagerUsers', JSON.stringify(this.users));
    }

    // Simple password hashing (for demonstration - in real app use proper hashing)
    hashPassword(password) {
        return btoa(password); // Simple base64 encoding for demo
    }

    createUser(username, password) {
        if (!username.trim() || !password.trim()) {
            this.showAuthError('Please enter both username and password');
            return false;
        }
        
        if (this.users[username]) {
            this.showAuthError('Username already exists');
            return false;
        }
        
        if (password.length < 4) {
            this.showAuthError('Password must be at least 4 characters');
            return false;
        }
        
        this.users[username] = {
            password: this.hashPassword(password),
            tasks: [],
            projects: ['inbox', 'work', 'personal', 'shopping'],
            settings: { theme: 'light' },
            stats: {
                level: 1,
                xp: 0,
                tasksCompleted: 0,
                timeTracked: 0,
                streak: 0,
                lastActive: new Date().toDateString()
            },
            achievements: [],
            createdAt: new Date().toISOString()
        };
        
        this.saveUsers();
        this.login(username);
        this.showAuthSuccess('Account created successfully!');
        return true;
    }

    loginUser(username, password) {
        if (!username.trim() || !password.trim()) {
            this.showAuthError('Please enter both username and password');
            return false;
        }
        
        const user = this.users[username];
        if (!user) {
            this.showAuthError('User not found');
            return false;
        }
        
        if (user.password !== this.hashPassword(password)) {
            this.showAuthError('Invalid password');
            return false;
        }
        
        this.login(username);
        return true;
    }

    login(username) {
        this.currentUser = username;
        localStorage.setItem('currentUser', username);
        this.showApp();
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showLogin();
        this.clearAuthMessages();
    }

    changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showNotification('Please fill all password fields', 'error');
            return;
        }
        
        if (newPassword.length < 4) {
            this.showNotification('New password must be at least 4 characters', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showNotification('New passwords do not match', 'error');
            return;
        }
        
        const user = this.users[this.currentUser];
        if (user.password !== this.hashPassword(currentPassword)) {
            this.showNotification('Current password is incorrect', 'error');
            return;
        }
        
        user.password = this.hashPassword(newPassword);
        this.saveUsers();
        this.hideChangePassword();
        this.showNotification('Password changed successfully!', 'success');
    }

    checkAuth() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser && this.users[savedUser]) {
            this.login(savedUser);
        } else {
            this.showLogin();
        }
    }

    // Auth UI Helpers
    showAuthError(message) {
        this.clearAuthMessages();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const currentForm = document.getElementById('loginForm').classList.contains('hidden') 
            ? document.getElementById('signupForm') 
            : document.getElementById('loginForm');
        currentForm.appendChild(errorDiv);
    }

    showAuthSuccess(message) {
        this.clearAuthMessages();
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        const currentForm = document.getElementById('loginForm').classList.contains('hidden') 
            ? document.getElementById('signupForm') 
            : document.getElementById('loginForm');
        currentForm.appendChild(successDiv);
    }

    clearAuthMessages() {
        const forms = [document.getElementById('loginForm'), document.getElementById('signupForm')];
        forms.forEach(form => {
            const messages = form.querySelectorAll('.error-message, .success-message');
            messages.forEach(msg => msg.remove());
        });
    }

    // Theme System
    setupTheme() {
        const savedTheme = this.getUserSettings().theme || 'light';
        this.setTheme(savedTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const icon = document.querySelector('#themeToggle i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        this.updateUserSettings({ theme });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    // User Settings
    getUserSettings() {
        return this.users[this.currentUser]?.settings || {};
    }

    updateUserSettings(settings) {
        if (this.currentUser) {
            this.users[this.currentUser].settings = { 
                ...this.getUserSettings(), 
                ...settings 
            };
            this.saveUsers();
        }
    }

    // Time and Clock Functions
    startClock() {
        const updateTime = () => {
            const now = new Date();
            document.getElementById('currentTime').textContent = 
                now.toLocaleTimeString('en-US', { 
                    hour12: true, 
                    hour: '2-digit', 
                    minute: '2-digit'
                });
        };
        
        updateTime();
        setInterval(updateTime, 1000);
    }

    // Timer System - Fixed to Focus Timer
    startFocusTimer() {
        this.timer.time = 25 * 60;
        this.timer.originalTime = 25 * 60;
        this.timer.currentTask = null;
        document.getElementById('timerTaskName').textContent = 'Focus Timer';
        document.getElementById('timerSection').classList.remove('hidden');
        this.updateTimerDisplay();
    }

    timerControl(action) {
        switch (action) {
            case 'start':
                this.startTimer();
                break;
            case 'pause':
                this.pauseTimer();
                break;
            case 'stop':
                this.stopTimer();
                break;
        }
    }

    startTimer() {
        if (this.timer.active) return;
        
        this.timer.active = true;
        this.timer.interval = setInterval(() => {
            this.timer.time--;
            this.updateTimerDisplay();
            
            if (this.timer.time <= 0) {
                this.timerComplete();
            }
        }, 1000);
        
        document.getElementById('timerStart').classList.add('hidden');
        document.getElementById('timerPause').classList.remove('hidden');
    }

    pauseTimer() {
        if (!this.timer.active) return;
        
        clearInterval(this.timer.interval);
        this.timer.active = false;
        document.getElementById('timerStart').classList.remove('hidden');
        document.getElementById('timerPause').classList.add('hidden');
    }

    stopTimer() {
        this.pauseTimer();
        this.timer.time = this.timer.originalTime;
        this.updateTimerDisplay();
        document.getElementById('timerSection').classList.add('hidden');
        this.timer.currentTask = null;
    }

    timerComplete() {
        this.stopTimer();
        this.showNotification('Focus Timer Complete!', 'Time to take a break!', 'success');
        
        if (this.timer.currentTask) {
            this.trackTime(this.timer.currentTask.id, this.timer.originalTime / 60);
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer.time / 60);
        const seconds = this.timer.time % 60;
        document.getElementById('timerDisplay').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Time Tracking
    trackTime(taskId, minutes) {
        const user = this.users[this.currentUser];
        user.stats.timeTracked += minutes;
        
        const task = user.tasks.find(t => t.id === taskId);
        if (task) {
            task.timeTracked = (task.timeTracked || 0) + minutes;
        }
        
        this.saveUsers();
        this.updateStats();
    }

    // Due Date Management
    checkDueTasks() {
        const now = new Date();
        const tasks = this.getTasks().filter(task => 
            !task.completed && 
            task.dueDateTime && 
            new Date(task.dueDateTime) <= new Date(now.getTime() + 60 * 60 * 1000)
        );

        tasks.forEach(task => {
            const dueDate = new Date(task.dueDateTime);
            const timeUntilDue = dueDate - now;
            const minutesUntilDue = Math.floor(timeUntilDue / (60 * 1000));
            
            if (minutesUntilDue <= 60 && minutesUntilDue > 0 && !task.notified) {
                this.showNotification(
                    'Task Due Soon!',
                    `"${task.text}" is due in ${minutesUntilDue} minutes`,
                    minutesUntilDue <= 15 ? 'urgent' : 'warning'
                );
                task.notified = true;
                this.saveTasks(this.getTasks());
            }
        });

        // Check every minute
        setTimeout(() => this.checkDueTasks(), 60000);
    }

    // Project Management
    getProjects() {
        return this.users[this.currentUser]?.projects || [];
    }

    addProject() {
        const input = document.getElementById('newProjectInput');
        const name = input.value.trim();
        
        if (name && !this.getProjects().includes(name)) {
            this.users[this.currentUser].projects.push(name);
            this.saveUsers();
            this.updateProjectSelect();
            input.value = '';
        }
    }

    changeProject(project) {
        this.currentProject = project;
        this.render();
    }

    updateProjectSelect() {
        const select = document.getElementById('projectSelect');
        const projects = this.getProjects();
        
        select.innerHTML = projects.map(project => 
            `<option value="${project}" ${project === this.currentProject ? 'selected' : ''}>
                ${this.getProjectIcon(project)} ${this.capitalize(project)}
            </option>`
        ).join('');
    }

    getProjectIcon(project) {
        const icons = {
            inbox: '📥',
            work: '💼',
            personal: '🏠',
            shopping: '🛒'
        };
        return icons[project] || '📁';
    }

    // Task Management
    getTasks() {
        return this.users[this.currentUser]?.tasks || [];
    }

    saveTasks(tasks) {
        if (this.currentUser) {
            this.users[this.currentUser].tasks = tasks;
            this.saveUsers();
        }
    }

    addTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();
        
        if (!text) return;

        const dueDate = document.getElementById('dueDateInput').value;
        const dueTime = document.getElementById('dueTimeInput').value;
        const dueDateTime = dueDate && dueTime ? `${dueDate}T${dueTime}` : null;

        const task = {
            id: Date.now() + Math.random(),
            text: text,
            project: this.currentProject,
            priority: document.getElementById('prioritySelect').value,
            dueDateTime: dueDateTime,
            timeEstimate: parseInt(document.getElementById('timeEstimateSelect').value) || null,
            tags: document.getElementById('tagsInput').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
            timeTracked: 0,
            status: 'todo'
        };

        const tasks = this.getTasks();
        tasks.push(task);
        this.saveTasks(tasks);

        // Reset form
        input.value = '';
        document.getElementById('dueDateInput').value = '';
        document.getElementById('dueTimeInput').value = '';
        document.getElementById('tagsInput').value = '';
        document.getElementById('timeEstimateSelect').value = '';

        this.addXp(5);
        this.render();
    }

    addQuickTask() {
        const input = document.getElementById('quickTaskInput');
        const text = input.value.trim();
        
        if (!text) return;

        const task = {
            id: Date.now() + Math.random(),
            text: text,
            project: this.currentProject,
            priority: document.getElementById('quickPriority').value,
            dueDateTime: document.getElementById('quickDueDateTime').value || null,
            tags: [],
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
            timeTracked: 0,
            status: 'todo'
        };

        const tasks = this.getTasks();
        tasks.push(task);
        this.saveTasks(tasks);

        input.value = '';
        this.hideQuickTaskModal();
        this.addXp(5);
        this.render();
    }

    toggleTask(id) {
        const tasks = this.getTasks().map(task => {
            if (task.id === id) {
                const completed = !task.completed;
                if (completed) {
                    this.addXp(10);
                    this.users[this.currentUser].stats.tasksCompleted++;
                }
                return {
                    ...task,
                    completed: completed,
                    completedAt: completed ? new Date().toISOString() : null
                };
            }
            return task;
        });
        
        this.saveTasks(tasks);
        this.render();
    }

    deleteTask(id) {
        const tasks = this.getTasks().filter(task => task.id !== id);
        this.saveTasks(tasks);
        this.render();
    }

    // View Management
    changeView(view) {
        this.currentView = view;
        
        // Update tab states
        document.querySelectorAll('.view-tab').forEach(tab => tab.classList.remove('active'));
        event.target.classList.add('active');
        
        // Show/hide views
        document.getElementById('listView').classList.toggle('hidden', view !== 'list');
        document.getElementById('calendarView').classList.toggle('hidden', view !== 'calendar');
        document.getElementById('boardView').classList.toggle('hidden', view !== 'board');
        
        this.render();
    }

    // Calendar System
    changeCalendarMonth(direction) {
        this.calendarDate.setMonth(this.calendarDate.getMonth() + direction);
        this.renderCalendar();
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const monthYear = document.getElementById('calendarMonthYear');
        
        // Set month/year header
        monthYear.textContent = this.calendarDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });

        // Get first day of month and number of days
        const firstDay = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth(), 1);
        const lastDay = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Create calendar header (day names)
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let calendarHTML = dayNames.map(day => 
            `<div class="calendar-day-header">${day}</div>`
        ).join('');

        // Add empty cells for days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            const date = new Date(firstDay);
            date.setDate(date.getDate() - (firstDay.getDay() - i));
            calendarHTML += `<div class="calendar-day other-month">${date.getDate()}</div>`;
        }

        // Add days of current month
        const today = new Date();
        const tasks = this.getTasks();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth(), day);
            const isToday = date.toDateString() === today.toDateString();
            const dayTasks = tasks.filter(task => 
                task.dueDateTime && 
                new Date(task.dueDateTime).toDateString() === date.toDateString()
            );

            calendarHTML += `
                <div class="calendar-day ${isToday ? 'today' : ''}">
                    <div class="calendar-date">${day}</div>
                    ${dayTasks.map(task => `
                        <div class="calendar-task ${task.priority}-priority" 
                             onclick="app.toggleTask(${task.id})"
                             title="${task.text}">
                            ${task.text.substring(0, 15)}...
                        </div>
                    `).join('')}
                </div>
            `;
        }

        calendarGrid.innerHTML = calendarHTML;
    }

    // Board View
    renderBoard() {
        const tasks = this.getFilteredTasks();
        
        const todoTasks = tasks.filter(task => task.status === 'todo' && !task.completed);
        const inProgressTasks = tasks.filter(task => task.status === 'inprogress' && !task.completed);
        const doneTasks = tasks.filter(task => task.completed || task.status === 'done');

        document.getElementById('todoTasks').innerHTML = todoTasks.map(task => 
            this.renderBoardTask(task)
        ).join('');
        
        document.getElementById('inProgressTasks').innerHTML = inProgressTasks.map(task => 
            this.renderBoardTask(task)
        ).join('');
        
        document.getElementById('doneTasks').innerHTML = doneTasks.map(task => 
            this.renderBoardTask(task)
        ).join('');

        this.makeTasksDraggable();
    }

    renderBoardTask(task) {
        const isOverdue = task.dueDateTime && new Date(task.dueDateTime) < new Date() && !task.completed;
        
        return `
            <div class="board-task" draggable="true" data-task-id="${task.id}">
                <div class="task-text">${this.escapeHtml(task.text)}</div>
                ${task.dueDateTime ? `
                    <div class="task-due-date ${isOverdue ? 'overdue' : ''}">
                        <i class="fas fa-clock"></i> ${new Date(task.dueDateTime).toLocaleString()}
                    </div>
                ` : ''}
                <div class="task-actions">
                    <button class="icon-btn" onclick="app.deleteTask(${task.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    makeTasksDraggable() {
        // Simplified drag & drop - you can enhance this later
        const tasks = document.querySelectorAll('.board-task');
        tasks.forEach(task => {
            task.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', task.dataset.taskId);
            });
        });

        const columns = document.querySelectorAll('.board-column');
        columns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                const taskId = parseInt(e.dataTransfer.getData('text/plain'));
                const newStatus = column.dataset.status;
                
                const tasks = this.getTasks().map(task => 
                    task.id === taskId ? { ...task, status: newStatus } : task
                );
                this.saveTasks(tasks);
                this.render();
            });
        });
    }

    // Filtering and Searching
    getFilteredTasks() {
        let tasks = this.getTasks().filter(task => 
            task.project === this.currentProject
        );

        // Apply search
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            tasks = tasks.filter(task => 
                task.text.toLowerCase().includes(query) ||
                task.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Apply filters
        const now = new Date();
        const today = new Date().toDateString();
        
        switch (this.currentFilter) {
            case 'today':
                tasks = tasks.filter(task => 
                    task.dueDateTime && new Date(task.dueDateTime).toDateString() === today
                );
                break;
            case 'urgent':
                tasks = tasks.filter(task => 
                    task.priority === 'urgent' && !task.completed
                );
                break;
            case 'completed':
                tasks = tasks.filter(task => task.completed);
                break;
            case 'pending':
                tasks = tasks.filter(task => !task.completed);
                break;
        }

        return tasks;
    }

    filterTasks(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        this.render();
    }

    searchTasks(query) {
        this.searchQuery = query;
        this.render();
    }

    // Bulk Actions
    clearCompleted() {
        const tasks = this.getTasks().filter(task => !task.completed);
        this.saveTasks(tasks);
        this.render();
    }

    markAllCompleted() {
        const tasks = this.getTasks().map(task => ({
            ...task,
            completed: true,
            completedAt: task.completed ? task.completedAt : new Date().toISOString()
        }));
        this.saveTasks(tasks);
        this.addXp(tasks.filter(t => !t.completed).length * 10);
        this.render();
    }

    // Statistics
    getStats() {
        const tasks = this.getTasks();
        const now = new Date();
        
        return {
            total: tasks.length,
            completed: tasks.filter(task => task.completed).length,
            overdue: tasks.filter(task => 
                task.dueDateTime && new Date(task.dueDateTime) < now && !task.completed
            ).length,
            urgent: tasks.filter(task => 
                task.priority === 'urgent' && !task.completed
            ).length,
            timeTracked: Math.floor(this.users[this.currentUser]?.stats.timeTracked || 0)
        };
    }

    updateStats() {
        const stats = this.getStats();
        
        document.getElementById('totalTasks').textContent = stats.total;
        document.getElementById('completedTasks').textContent = stats.completed;
        document.getElementById('urgentTasks').textContent = stats.urgent;
        document.getElementById('timeTracked').textContent = `${Math.floor(stats.timeTracked / 60)}h`;
        
        // Update user level and XP
        const userStats = this.users[this.currentUser].stats;
        document.getElementById('userLevel').textContent = userStats.level;
        document.getElementById('xpProgress').style.width = `${(userStats.xp % 100)}%`;
    }

    addXp(amount) {
        const userStats = this.users[this.currentUser].stats;
        userStats.xp += amount;
        
        // Level up every 100 XP
        if (userStats.xp >= userStats.level * 100) {
            userStats.level++;
            this.showNotification('Level Up!', `You reached level ${userStats.level}!`, 'success');
        }
        
        this.saveUsers();
        this.updateStats();
    }

    // Data Export/Import
    exportData() {
        const data = {
            users: this.users,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `task-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.users) {
                    this.users = data.users;
                    this.saveUsers();
                    this.render();
                    alert('Data imported successfully!');
                    this.hideExportModal();
                }
            } catch (error) {
                alert('Error importing data. Please check the file format.');
            }
        };
        reader.readAsText(file);
    }

    // Notifications
    showNotification(title, message, type = 'info') {
        const notification = {
            id: Date.now(),
            title,
            message,
            type,
            time: new Date().toLocaleTimeString()
        };
        
        this.notifications.unshift(notification);
        this.updateNotificationBadge();
        
        // Show native browser notification if available
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: message });
        }
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        badge.textContent = this.notifications.length;
        badge.classList.toggle('hidden', this.notifications.length === 0);
    }

    showNotifications() {
        const panel = document.getElementById('notificationsPanel');
        const list = document.getElementById('notificationsList');
        
        if (this.notifications.length === 0) {
            list.innerHTML = '<div class="empty-state">No notifications</div>';
        } else {
            list.innerHTML = this.notifications.map(notification => `
                <div class="notification-item ${notification.type}">
                    <strong>${notification.title}</strong>
                    <p>${notification.message}</p>
                    <small>${notification.time}</small>
                </div>
            `).join('');
        }
        
        panel.classList.add('show');
    }

    hideNotifications() {
        document.getElementById('notificationsPanel').classList.remove('show');
    }

    // Modal Management
    showExportModal() {
        document.getElementById('exportModal').classList.remove('hidden');
    }

    hideExportModal() {
        document.getElementById('exportModal').classList.add('hidden');
    }

    showChangePassword() {
        document.getElementById('changePasswordModal').classList.remove('hidden');
        // Clear password fields
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
    }

    hideChangePassword() {
        document.getElementById('changePasswordModal').classList.add('hidden');
    }

    showQuickTaskModal() {
        document.getElementById('quickTaskModal').classList.remove('hidden');
    }

    hideQuickTaskModal() {
        document.getElementById('quickTaskModal').classList.add('hidden');
    }

    showAnalytics() {
        const stats = this.getStats();
        alert(`Productivity Analytics:\n\nTotal Tasks: ${stats.total}\nCompleted: ${stats.completed}\nUrgent: ${stats.urgent}\nTime Tracked: ${Math.floor(stats.timeTracked / 60)} hours\nLevel: ${this.users[this.currentUser].stats.level}`);
    }

    // Rendering
    render() {
        if (!this.currentUser) return;

        this.updateProjectSelect();
        this.updateStats();
        
        switch (this.currentView) {
            case 'list':
                this.renderTasks();
                break;
            case 'calendar':
                this.renderCalendar();
                break;
            case 'board':
                this.renderBoard();
                break;
        }
    }

    renderTasks() {
        const taskList = document.getElementById('listView');
        const tasks = this.getFilteredTasks();

        if (tasks.length === 0) {
            taskList.innerHTML = this.getEmptyState();
            return;
        }

        taskList.innerHTML = tasks.map(task => this.renderTask(task)).join('');
    }

    renderTask(task) {
        const isOverdue = task.dueDateTime && new Date(task.dueDateTime) < new Date() && !task.completed;
        const dueDate = task.dueDateTime ? new Date(task.dueDateTime).toLocaleString() : null;
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''} ${task.priority}-priority ${isOverdue ? 'overdue' : ''}">
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''}
                    onchange="app.toggleTask(${task.id})"
                >
                <div class="task-content">
                    <div class="task-text">${this.escapeHtml(task.text)}</div>
                    <div class="task-meta">
                        ${dueDate ? `
                            <span class="task-due-date ${isOverdue ? 'overdue' : ''}">
                                <i class="fas fa-clock"></i> ${dueDate}
                            </span>
                        ` : ''}
                        <span class="task-priority">
                            <i class="fas fa-flag"></i> ${this.capitalize(task.priority)}
                        </span>
                        ${task.tags.length > 0 ? `
                            <div class="task-tags">
                                ${task.tags.map(tag => `
                                    <span class="task-tag">${this.escapeHtml(tag)}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                        ${task.timeTracked > 0 ? `
                            <div class="time-tracked">
                                <i class="fas fa-stopwatch"></i> ${Math.floor(task.timeTracked / 60)}h ${task.timeTracked % 60}m
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="icon-btn" onclick="app.startTimerForTask(${task.id})" title="Start Timer">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="icon-btn" onclick="app.deleteTask(${task.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    startTimerForTask(taskId) {
        const task = this.getTasks().find(t => t.id === taskId);
        if (task) {
            this.timer.currentTask = task;
            this.timer.time = 25 * 60;
            this.timer.originalTime = 25 * 60;
            document.getElementById('timerTaskName').textContent = task.text;
            document.getElementById('timerSection').classList.remove('hidden');
            this.updateTimerDisplay();
        }
    }

    getEmptyState() {
        const messages = {
            all: 'No tasks in this project. Add one above!',
            today: 'No tasks due today.',
            overdue: 'No overdue tasks. Great job!',
            urgent: 'No urgent tasks.',
            completed: 'No completed tasks yet.',
            pending: 'No pending tasks. All done!'
        };

        return `
            <div class="empty-state">
                <h3>${messages[this.currentFilter] || messages.all}</h3>
                <p>${this.searchQuery ? 'Try adjusting your search terms' : 'You\'re all caught up!'}</p>
            </div>
        `;
    }

    // Utility Methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    setupEventListeners() {
        // Enter key for adding tasks
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // New project input
        document.getElementById('newProjectInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addProject();
        });

        // Quick task input
        document.getElementById('quickTaskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addQuickTask();
        });

        // Login form enter key
        document.getElementById('loginPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') loginUser();
        });

        // Signup form enter key
        document.getElementById('confirmPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') createUser();
        });

        // Request notification permission
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }

    // UI State Management
    showApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('appContent').classList.remove('hidden');
        document.getElementById('currentUser').textContent = this.currentUser;
        this.render();
    }

    showLogin() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('appContent').classList.add('hidden');
        showLogin(); // Show login form by default
    }
}

// Global functions for HTML event handlers
function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    app.clearAuthMessages();
}

function showSignup() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
    app.clearAuthMessages();
}

function createUser() {
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        app.showAuthError('Passwords do not match');
        return;
    }
    
    if (app.createUser(username, password)) {
        document.getElementById('signupUsername').value = '';
        document.getElementById('signupPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    }
}

function loginUser() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (app.loginUser(username, password)) {
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
    }
}

// Initialize the application
const app = new UltimateTaskManager();

// Make app globally available for HTML onclick handlers
window.app = app;
