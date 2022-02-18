var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class BackgroundBase {
    constructor() {
        this._accountScopeCache = {};
        this._popupActions = {};
        this.accountToProjectMapKey = 'accountToProjectMap';
        this.taskNameToDescriptionMapKey = 'taskNameToDescriptionMap';
        this.init();
        this.initConnection();
        this.listenPopupAction('initialize', this.initializePopupAction);
        this.listenPopupAction('openTracker', this.openTrackerPagePopupAction);
        this.listenPopupAction('openPage', this.openPagePopupAction);
        this.listenPopupAction('login', this.loginPopupAction);
        this.listenPopupAction('fixTimer', this.fixTimerPopupAction);
        this.listenPopupAction('putTimer', this.putTimerPopupAction);
        this.listenPopupAction('hideAllPopups', this.hideAllPopupsPopupAction);
        this.listenPopupAction('saveProjectMap', this.saveProjectMapPopupAction);
        this.listenPopupAction('saveDescriptionMap', this.saveDescriptionMapPopupAction);
        this.listenPopupAction('openOptionsPage', this.openOptionsPagePopupAction);
        this.listenPopupAction('getRecentTasks', this.getRecentTasksAction);
        this.registerMessageListener();
    }
    getConstants() {
        return {
            maxTimerHours: 12,
            serviceUrl: 'https://app.tmetric.com/',
            storageUrl: 'https://services.tmetric.com/storage/',
            authorityUrl: 'https://id.tmetric.com/'
        };
    }
    showError(message) {
        const a = alert;
        a(message);
    }
    init() {
        this.constants = this.getConstants();
    }
    initConnection() {
        this.connection = new ServerConnection();
        this.connection.init({ serviceUrl: this.constants.serviceUrl, authorityUrl: this.constants.authorityUrl });
    }
    getProject(projectId, accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            accountId = accountId || this.userProfile.activeAccountId;
            const scope = yield this.getAccountScope(accountId);
            if (scope) {
                return scope.projects.find(_ => _.projectId == projectId);
            }
        });
    }
    openTrackerPage() {
        let url = this.constants.serviceUrl;
        if (this.userProfile && this.userProfile.activeAccountId) {
            url += '#/tracker/' + this.userProfile.activeAccountId + '/';
        }
        this.openPage(url);
    }
    isLongTimer() {
        return false;
    }
    fixTimer() {
        this.showNotification('You should fix the timer.');
        this.openTrackerPage();
    }
    putTimerWithIntegration(timer, status, requiredFields) {
        let notification;
        if (timer.projectName) {
            const contactAdmin = 'Please contact the account administrator to fix the problem.';
            if (status.projectStatus == null) {
                if (status.serviceRole != 2 &&
                    status.serviceRole != 3 &&
                    !status.canAddProject) {
                    timer.projectName = undefined;
                }
            }
            else if (status.projectStatus != 1) {
                const statusText = status.projectStatus == 3 ? 'archived' : 'done';
                notification = `Project '${timer.projectName}' exists, but it has '${statusText}' status. You cannot log time to this project.\n\n${contactAdmin}`;
                timer.projectName = undefined;
            }
            else if (status.projectRole == null) {
                notification = `Project '${timer.projectName}' exists, but you don't have access to the project.\n\n${contactAdmin}`;
                timer.projectName = undefined;
            }
            if (requiredFields.project && notification) {
                this.showNotification(notification);
                return;
            }
        }
        let promise = this.connection.setAccountToPost(status.accountId);
        if (!timer.serviceUrl != !status.integrationType ||
            !timer.projectName != !status.projectStatus) {
            promise = promise.then(() => this.connection.postIntegration({
                serviceUrl: timer.serviceUrl,
                serviceType: timer.serviceType,
                projectName: timer.projectName,
                showIssueId: timer.showIssueId
            }));
        }
        promise = promise
            .then(() => {
            return this.connection.putIssueTimer(timer);
        })
            .then(() => {
            if (notification) {
                this.showNotification(notification);
            }
        })
            .catch(status => {
            this.showError(this.getErrorText(status));
        })
            .then(() => {
            this.connection.setAccountToPost(null);
        });
        return promise;
    }
    getIntegrationStatus(timer, accountId) {
        return this.connection.getIntegration({
            serviceUrl: timer.serviceUrl,
            serviceType: timer.serviceType,
            projectName: timer.projectName,
            showIssueId: !!timer.showIssueId
        }, accountId, !!accountId);
    }
    putExternalTimer(timer, accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!timer.isStarted) {
                timer = { isStarted: false };
            }
            this.putData(timer, (timer) => __awaiter(this, void 0, void 0, function* () {
                let status;
                let scope;
                try {
                    status = yield this.getIntegrationStatus(timer, accountId);
                    scope = yield this.getAccountScope(status.accountId);
                }
                catch (err) {
                    this.connection.checkProfileChange();
                    return Promise.reject(err);
                }
                if (accountId) {
                    return this.putTimerWithIntegration(timer, status, scope.requiredFields);
                }
                if (timer.isStarted) {
                    yield this.validateTimerTags(timer, status.accountId);
                    this.validateTimerProject(timer, status);
                    this.newPopupIssue = timer;
                    this.newPopupAccountId = status.accountId;
                    return this.showPopup();
                }
                return this.putTimerWithIntegration(timer, status, scope.requiredFields);
            }));
        });
    }
    putData(data, action) {
        action(data).catch(status => this.showError(this.getErrorText(status)));
    }
    normalizeUrlLastSlash(url) {
        if (url[url.length - 1] != '/') {
            url += '/';
        }
        return url;
    }
    getErrorText(status) {
        const result = status && (status.responseMessage || status.statusText || status.statusCode);
        if (result) {
            return result.toString();
        }
        return 'Connection to the server failed or was aborted.';
    }
    validateTimerTags(timer, accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            accountId = accountId || this.userProfile.activeAccountId;
            const scope = yield this.getAccountScope(accountId);
            let hasWorkType = false;
            const tagByName = {};
            scope.tags.forEach(tag => {
                tagByName[tag.tagName.toLowerCase()] = tag;
            });
            timer.tagNames = (timer.tagNames || [])
                .map(name => {
                const tag = tagByName[name.toLowerCase()];
                if (!tag) {
                    return name;
                }
                if (tag.isWorkType) {
                    if (hasWorkType) {
                        return null;
                    }
                    hasWorkType = true;
                }
                return tag.tagName;
            })
                .filter(name => !!name);
            if (!hasWorkType) {
                const defaultWorkType = yield this.getDefaultWorkType(accountId);
                if (defaultWorkType) {
                    timer.tagNames.push(defaultWorkType.tagName);
                }
            }
        });
    }
    validateTimerProject(timer, status) {
        if (status.projectStatus != null &&
            status.projectStatus != 1) {
            timer.projectId = 0;
            timer.projectName = '';
        }
    }
    getDefaultWorkType(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            accountId = accountId || this.userProfile.activeAccountId;
            const scope = yield this.getAccountScope(accountId);
            const member = this.userProfile.accountMembership.find(_ => _.account.accountId == accountId);
            return scope.tags.find(tag => tag.tagId == member.defaultWorkTypeId);
        });
    }
    getRecentTasks(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.connection.getRecentWorkTasks(accountId || this.userProfile.activeAccountId);
        });
    }
    invalidateAccountScopeCache(accountId) {
        delete this._accountScopeCache[accountId];
    }
    getAccountScope(accountId) {
        let scope = this._accountScopeCache[accountId];
        if (!scope) {
            scope = this._accountScopeCache[accountId] = this.connection.getAccountScope(accountId)
                .then(scope => {
                scope.requiredFields = scope.requiredFields || {};
                return scope;
            });
        }
        return scope;
    }
    listenPopupAction(action, handler) {
        this._popupActions[action] = handler;
    }
    onPopupRequest(request, callback) {
        const action = request.action;
        const handler = this._popupActions[action];
        if (action && handler) {
            handler.call(this, request.data).then((result) => {
                callback({ action: action, data: result });
            }).catch((error) => {
                callback({ action: action, error: error || 'Error' });
            });
        }
        else {
            callback({ action: action, error: 'Not found handler for action ' + action });
        }
    }
    getPopupData(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let accountId = params.accountId;
            if (!accountId && this.newPopupAccountId) {
                accountId = this.newPopupAccountId;
            }
            if (!this.userProfile.accountMembership.some(_ => _.account.accountId == accountId)) {
                accountId = this.userProfile.activeAccountId;
            }
            return Promise.all([
                this.getActiveTabTitle(),
                this.getActiveTabPossibleWebTool(),
                this.getAccountScope(accountId),
                this.getDefaultWorkType(accountId),
            ]).then(([title, webTool, scope, defaultWorkType]) => {
                const userRole = this.userProfile.accountMembership
                    .find(_ => _.account.accountId == accountId)
                    .role;
                const canMembersManagePublicProjects = scope.account.canMembersManagePublicProjects;
                const canCreateTags = scope.account.canMembersCreateTags;
                const isAdmin = (userRole == 2 || userRole == 3);
                const newIssue = this.newPopupIssue || {
                    isStarted: true,
                    description: title,
                    tagNames: defaultWorkType ? [defaultWorkType.tagName] : []
                };
                const filteredProjects = this.getTrackedProjects(scope)
                    .sort((a, b) => a.projectName.localeCompare(b.projectName, [], { sensitivity: 'base' }));
                const projectMap = this.getProjectMap(accountId);
                let defaultProjectId = null;
                if (projectMap) {
                    const projectName = newIssue.projectName || '';
                    defaultProjectId = projectMap[projectName];
                    if (defaultProjectId && filteredProjects.every(_ => _.projectId != defaultProjectId)) {
                        this.setProjectMap(accountId, projectName, null);
                        defaultProjectId = null;
                    }
                }
                const descriptionMap = this.getDescriptionMap();
                if (newIssue.issueId && !newIssue.description && descriptionMap) {
                    newIssue.description = descriptionMap[newIssue.issueName];
                }
                this.newPopupIssue = null;
                this.newPopupAccountId = null;
                return {
                    timer: this.timer,
                    newIssue,
                    profile: this.userProfile,
                    accountId,
                    projects: filteredProjects,
                    clients: scope.clients,
                    tags: scope.tags,
                    canCreateProjects: isAdmin || canMembersManagePublicProjects,
                    canCreateTags,
                    constants: this.constants,
                    defaultProjectId,
                    requiredFields: scope.requiredFields,
                    possibleWebTool: webTool
                };
            });
        });
    }
    initializePopupAction(params) {
        return new Promise((resolve, reject) => {
            this.actionOnConnect = null;
            if (this.timer) {
                resolve(this.getPopupData(params));
            }
            else {
                reject('Not connected');
            }
        });
    }
    openTrackerPagePopupAction() {
        return Promise.resolve(null).then(() => {
            this.openTrackerPage();
        });
    }
    openPagePopupAction(url) {
        return Promise.resolve(null).then(() => {
            this.openPage(url);
        });
    }
    loginPopupAction() {
        return Promise.resolve(null).then(() => {
            this.connection.reconnect().catch(() => this.showLoginDialog());
        });
    }
    fixTimerPopupAction() {
        return Promise.resolve(null).then(() => {
            this.openTrackerPage();
        });
    }
    putTimerPopupAction(data) {
        return Promise.resolve(null).then(() => {
            this.putExternalTimer(data.timer, data.accountId);
        });
    }
    hideAllPopupsPopupAction() {
        return Promise.resolve(null).then(() => {
            this.hidePopup();
        });
    }
    openPage(url) {
        open(url);
    }
    setProjectMap(accountId, projectName, projectId) {
        let map = this.getProjectMap(accountId);
        if (projectId) {
            map = map || {};
            map[projectName] = projectId;
            this.accountToProjectMap[accountId] = map;
        }
        else if (map) {
            delete map[projectName];
        }
        localStorage.setItem(this.accountToProjectMapKey, JSON.stringify(this.accountToProjectMap));
    }
    getProjectMap(accountId) {
        if (!this.accountToProjectMap) {
            const obj = localStorage.getItem(this.accountToProjectMapKey);
            this.accountToProjectMap = obj ? JSON.parse(obj) : {};
        }
        return this.accountToProjectMap[accountId];
    }
    saveProjectMapPopupAction({ accountId, projectName, projectId }) {
        this.setProjectMap(accountId, projectName, projectId);
        return Promise.resolve(null);
    }
    setDescriptionMap(taskName, description) {
        let map = this.getDescriptionMap();
        if (description && description != taskName) {
            map = map || {};
            map[taskName] = description;
            this.taskNameToDescriptionMap = map;
        }
        else {
            delete map[taskName];
        }
        localStorage.setItem(this.taskNameToDescriptionMapKey, JSON.stringify(this.taskNameToDescriptionMap));
    }
    getDescriptionMap() {
        if (!this.taskNameToDescriptionMap) {
            const obj = localStorage.getItem(this.taskNameToDescriptionMapKey);
            this.taskNameToDescriptionMap = obj ? JSON.parse(obj) : {};
        }
        return this.taskNameToDescriptionMap;
    }
    saveDescriptionMapPopupAction({ taskName, description }) {
        this.setDescriptionMap(taskName, description);
        return Promise.resolve(null);
    }
    getTrackedProjects(scope) {
        const trackedProjectsMap = {};
        scope.trackedProjects.forEach(tp => trackedProjectsMap[tp] = true);
        return scope.projects.filter(p => trackedProjectsMap[p.projectId]);
    }
    openOptionsPagePopupAction() {
        return Promise.resolve(null);
    }
    getRecentTasksAction(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [recentTasks, scope] = yield Promise.all([
                this.getRecentTasks(accountId),
                this.getAccountScope(accountId)
            ]);
            const trackedProjectsMap = {};
            scope.trackedProjects.forEach(tp => trackedProjectsMap[tp] = true);
            return recentTasks ? recentTasks.filter(t => !t.details.projectId || trackedProjectsMap[t.details.projectId]).slice(0, 25) : null;
        });
    }
}
