var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class ExtensionBase extends BackgroundBase {
    constructor() {
        super();
        this.buttonState = 0;
        this._issuesDurationsCache = {};
        this.contentScriptRegistrator = new ContentScriptsRegistrator();
        this.listenPopupAction('isConnectionRetryEnabled', this.isConnectionRetryEnabledPopupAction);
        this.listenPopupAction('retry', this.retryConnectionPopupAction);
        this.updateState();
        this.connection.onUpdateTimer((timer) => __awaiter(this, void 0, void 0, function* () {
            if (timer == null) {
                this.clearIssuesDurationsCache();
            }
            this.timer = timer;
            if (timer && timer.details) {
                const project = yield this.getProject(timer.details.projectId);
                timer.projectName = project && project.projectName;
            }
            this.updateState();
            this.sendToTabs({ action: 'setTimer', data: timer });
            if (timer) {
                const action = this.actionOnConnect;
                if (action) {
                    this.actionOnConnect = null;
                    action();
                }
            }
        }));
        this.connection.onUpdateTracker(timeEntries => {
            this.timeEntries = timeEntries;
            this.updateState();
        });
        this.connection.onUpdateProfile(profile => {
            this.userProfile = profile;
        });
        this.connection.onUpdateActiveAccount(() => {
            this.clearIssuesDurationsCache();
        });
        this.connection.onInvalidateAccountScopeCache(accountId => {
            this.invalidateAccountScopeCache(accountId);
        });
        this.connection.onRemoveExternalIssuesDurations(identifiers => {
            this.removeIssuesDurationsFromCache(identifiers);
        });
        this.registerInstallListener();
        this.registerStorageListener();
        this.registerTabsRemoveListener();
        this.registerContentScripts();
        const setUpdateTimeout = () => setTimeout(() => {
            this.updateState();
            setUpdateTimeout();
        }, (60 - new Date().getSeconds()) * 1000);
        setUpdateTimeout();
    }
    getConstants() {
        const constants = super.getConstants();
        return {
            maxTimerHours: constants.maxTimerHours,
            serviceUrl: this.getUrl('tmetric.url', constants.serviceUrl),
            storageUrl: this.getUrl('tmetric.storageUrl', constants.storageUrl),
            authorityUrl: this.getUrl('tmetric.authorityUrl', constants.authorityUrl),
            extensionName: this.getExtensionName(),
            browserSchema: this.getBrowserSchema(),
            extensionUUID: this.getExtensionUUID()
        };
    }
    getExtensionName() {
        return chrome.runtime.getManifest().name;
    }
    getUrl(key, defaultValue) {
        return this.normalizeUrlLastSlash(this.getTestValue(key) || defaultValue);
    }
    createLoginDialog() {
        chrome.tabs.create({ url: OidcClient.getLoginUrl() }, tab => {
            this.loginWinId = tab.windowId;
            this.loginTabId = tab.id;
            this.loginWindowPending = false;
        });
    }
    showNotification(message, title) {
        if (this.lastNotificationId) {
            chrome.notifications.clear(this.lastNotificationId, () => { });
        }
        title = title || 'TMetric';
        const type = 'basic';
        const iconUrl = 'images/icon80.png';
        chrome.notifications.create(null, { title, message, type, iconUrl }, id => this.lastNotificationId = id);
    }
    init() {
        super.init();
        this.signalRUrl = this.getUrl('tmetric.signalRUrl', 'https://services.tmetric.com/signalr/');
        this.extraHours = this.getTestValue('tmetric.extraHours');
        if (this.extraHours) {
            this.extraHours = parseFloat(this.extraHours);
        }
        else {
            this.extraHours = 0;
        }
    }
    initConnection() {
        this.connection = new SignalRConnection();
        this.connection
            .init({ serviceUrl: this.constants.serviceUrl, signalRUrl: this.signalRUrl, authorityUrl: this.constants.authorityUrl });
    }
    onTabMessage(message, tabId) {
        this.sendToTabs({ action: message.action + '_callback' }, tabId);
        switch (message.action) {
            case 'getConstants':
                this.sendToTabs({ action: 'setConstants', data: this.constants }, tabId);
                break;
            case 'getTimer':
                this.sendToTabs({ action: 'setTimer', data: this.timer }, tabId);
                break;
            case 'putTimer':
                this.putExternalTimer(message.data, null, tabId);
                break;
            case 'getIssuesDurations':
                this.getIssuesDurations(message.data).then(durations => {
                    if (this.extraHours && this.timer && this.timer.isStarted) {
                        const activeDetails = this.timer.details;
                        if (activeDetails && activeDetails.projectTask) {
                            const activeTask = activeDetails.projectTask;
                            for (let i = 0; i < durations.length; i++) {
                                let duration = durations[i];
                                if (duration.issueUrl == activeTask.relativeIssueUrl && duration.serviceUrl == activeTask.integrationUrl) {
                                    duration = JSON.parse(JSON.stringify(duration));
                                    duration.duration += this.extraHours * 3600000;
                                    durations[i] = duration;
                                    break;
                                }
                            }
                        }
                    }
                    this.sendToTabs({ action: 'setIssuesDurations', data: durations }, tabId);
                });
                break;
        }
    }
    getSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get({ showPopup: 0 }, resolve);
        });
    }
    isLongTimer() {
        return this.buttonState == 2;
    }
    putExternalTimer(timer, accountId = null, tabId = null) {
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
                    const settings = yield this.getSettings();
                    yield this.validateTimerTags(timer, status.accountId);
                    const matchedProjectCount = this.getTrackedProjects(scope).filter(p => p.projectName == timer.projectName).length;
                    const requiredFields = scope.requiredFields;
                    let showPopup = settings.showPopup || 0;
                    if (timer.serviceType === 'Shortcut') {
                        showPopup = 2;
                    }
                    else if (requiredFields.taskLink && !timer.issueUrl) {
                        showPopup = 2;
                    }
                    else if (requiredFields.description && !timer.issueName && !timer.description ||
                        requiredFields.project && !matchedProjectCount ||
                        requiredFields.tags && (!timer.tagNames || !timer.tagNames.length)) {
                        showPopup = 0;
                    }
                    if (showPopup != 2) {
                        if (showPopup == 0 ||
                            !timer.projectName ||
                            status.projectStatus == null ||
                            matchedProjectCount > 1) {
                            this.validateTimerProject(timer, status);
                            this.newPopupIssue = timer;
                            this.newPopupAccountId = status.accountId;
                            return this.showPopup(tabId);
                        }
                    }
                }
                return this.putTimerWithIntegration(timer, status, scope.requiredFields);
            }));
        });
    }
    putData(data, action, retryAction) {
        const onFail = (status, showDialog) => {
            this.actionOnConnect = null;
            if (!status || status.statusCode == 401 || status.statusCode == 0) {
                const disconnectPromise = this.connection.disconnect();
                if (showDialog) {
                    disconnectPromise.then(() => {
                        this.actionOnConnect = () => onConnect(false);
                        this.showLoginDialog();
                    });
                }
            }
            else {
                const error = this.getErrorText(status);
                if (status.statusCode == 403 && retryAction) {
                    const promise = retryAction(data);
                    if (promise) {
                        promise.catch(() => this.showError(error));
                        return;
                    }
                }
                this.showError(error);
            }
        };
        const onConnect = (showDialog) => {
            if (this.isLongTimer()) {
                this.actionOnConnect = () => this.fixTimer();
                this.connection.getData().catch(status => onFail(status, showDialog));
                return;
            }
            action(data).catch(status => onFail(status, showDialog));
        };
        if (this.timer == null) {
            this.actionOnConnect = () => onConnect(true);
            this.connection.reconnect().catch(status => onFail(status, true));
        }
        else {
            onConnect(true);
        }
    }
    updateState() {
        let state = 3;
        let text = 'Not Connected';
        if (this.timer) {
            const todayTotal = 'Today Total - '
                + this.durationToString(this.getDuration(this.timeEntries))
                + ' hours';
            if (this.timer.isStarted) {
                if (this.getDuration(this.timer) > this.constants.maxTimerHours * 60 * 60000) {
                    state = 2;
                    text = 'Started\nYou need to fix long-running timer';
                }
                else {
                    state = 1;
                    const description = this.timer.details.description || '(No task description)';
                    text = `Started (${todayTotal})\n${description}`;
                }
            }
            else {
                state = 0;
                text = 'Paused\n' + todayTotal;
            }
        }
        this.buttonState = state;
        this.setButtonIcon(state == 1 || state == 2 ? 'active' : 'inactive', text);
    }
    getLoginUrl() {
        return this.constants.serviceUrl + 'login';
    }
    getDuration(arg) {
        if (arg) {
            const now = new Date().getTime();
            if (arg.reduce) {
                return arg.reduce((duration, entry) => {
                    const startTime = Date.parse(entry.startTime);
                    const endTime = entry.endTime ? Date.parse(entry.endTime) : now;
                    return duration + (endTime - startTime);
                }, 0);
            }
            else if (arg.isStarted) {
                return now - Date.parse(arg.startTime);
            }
        }
        return 0;
    }
    durationToString(duration) {
        let sign = '';
        if (duration < 0) {
            duration = -duration;
            sign = '-';
        }
        const totalMinutes = Math.floor(duration / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return sign + hours + (minutes < 10 ? ':0' : ':') + minutes;
    }
    makeIssueDurationKey(identifier) {
        return identifier.serviceUrl + '/' + identifier.issueUrl;
    }
    getIssueDurationFromCache(identifier) {
        return this._issuesDurationsCache[this.makeIssueDurationKey(identifier)];
    }
    putIssuesDurationsToCache(durations) {
        durations.forEach(duration => {
            this._issuesDurationsCache[this.makeIssueDurationKey(duration)] = duration;
        });
    }
    removeIssuesDurationsFromCache(identifiers) {
        identifiers.forEach(identifier => {
            delete this._issuesDurationsCache[this.makeIssueDurationKey(identifier)];
        });
    }
    clearIssuesDurationsCache() {
        this._issuesDurationsCache = {};
    }
    getIssuesDurations(identifiers) {
        const durations = [];
        const fetchIdentifiers = [];
        identifiers = identifiers.filter(_ => !!_.serviceUrl && !!_.issueUrl);
        identifiers.forEach(identifier => {
            const duration = this.getIssueDurationFromCache(identifier);
            if (duration) {
                durations.push(duration);
            }
            else {
                fetchIdentifiers.push(identifier);
            }
        });
        if (durations.length == identifiers.length) {
            return Promise.resolve(durations);
        }
        return new Promise(resolve => {
            this.connection.fetchIssuesDurations(fetchIdentifiers)
                .then(fetchDurations => {
                this.putIssuesDurationsToCache(fetchDurations);
                resolve(durations.concat(fetchDurations));
            })
                .catch(() => {
                resolve([]);
            });
        });
    }
    showLoginDialog() {
        if (this.loginWinId) {
            chrome.tabs.query({ windowId: this.loginWinId }, tabs => {
                const tab = tabs.find(tab => tab.id == this.loginTabId);
                if (tab && tab.url.startsWith(this.constants.authorityUrl)) {
                    chrome.tabs.update(tab.id, { active: true });
                    chrome.windows.update(this.loginWinId, { focused: true });
                }
                else {
                    this.loginWinId = null;
                    this.loginTabId = null;
                    this.showLoginDialog();
                }
            });
            return;
        }
        chrome.windows.getLastFocused(() => {
            if (this.loginWindowPending) {
                return;
            }
            this.loginWindowPending = true;
            try {
                this.createLoginDialog();
            }
            catch (e) {
                this.loginWindowPending = false;
            }
        });
    }
    setButtonIcon(icon, tooltip) {
        chrome.browserAction.setIcon({
            path: {
                '19': 'images/' + icon + '19.png',
                '38': 'images/' + icon + '38.png'
            }
        });
        chrome.browserAction.setTitle({ title: tooltip });
    }
    sendToTabs(message, tabId) {
        if (tabId != null) {
            chrome.tabs.sendMessage(tabId, message);
            return;
        }
        chrome.tabs.query({}, tabs => tabs && tabs.forEach(tab => {
            if (tab.url && tab.url.startsWith('http')) {
                chrome.tabs.sendMessage(tab.id, message, () => {
                    const error = chrome.runtime.lastError;
                    if (error) {
                        void 0;
                    }
                });
            }
        }));
    }
    getTestValue(name) {
        return localStorage.getItem(name);
    }
    getActiveTabTitle() {
        return new Promise((resolve) => {
            chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
                const activeTab = tabs && tabs[0];
                const title = activeTab && activeTab.title || null;
                resolve(title);
            });
        });
    }
    getActiveTabId() {
        return new Promise((resolve) => {
            chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
                const activeTab = tabs && tabs[0];
                const id = activeTab && activeTab.id || null;
                resolve(id);
            });
        });
    }
    getActiveTabUrl() {
        return new Promise((resolve) => {
            chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
                const activeTab = tabs && tabs[0];
                const url = activeTab && activeTab.url || null;
                resolve(url);
            });
        });
    }
    getActiveTabPossibleWebTool() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = yield this.getActiveTabUrl();
            const origin = WebToolManager.toOrigin(url);
            if (!origin) {
                return;
            }
            if (yield WebToolManager.isAllowed([origin])) {
                return;
            }
            const isMatchUrl = (origin) => WebToolManager.isMatch(url, origin);
            const webTools = getWebToolDescriptions();
            const webTool = webTools.find(webTool => webTool.origins.some(isMatchUrl));
            if (webTool) {
                return {
                    serviceType: webTool.serviceType,
                    serviceName: webTool.serviceName,
                    origins: webTool.allOriginsRequired ? webTool.origins : [origin]
                };
            }
        });
    }
    openPage(url) {
        chrome.tabs.query({ active: true, windowId: chrome.windows.WINDOW_ID_CURRENT }, tabs => {
            const currentWindowId = tabs && tabs.length && tabs[0].windowId;
            chrome.tabs.query({ url: url.split('#')[0] + '*' }, tabs => {
                const pageTabs = tabs && tabs.filter(tab => tab.url == url);
                if (pageTabs && pageTabs.length) {
                    let anyWindowTab, anyWindowActiveTab, currentWindowTab, currentWindowActiveTab;
                    for (let index = 0, size = pageTabs.length; index < size; index += 1) {
                        anyWindowTab = pageTabs[index];
                        if (anyWindowTab.active) {
                            anyWindowActiveTab = anyWindowTab;
                        }
                        if (anyWindowTab.windowId == currentWindowId) {
                            currentWindowTab = anyWindowTab;
                            if (currentWindowTab.active) {
                                currentWindowActiveTab = currentWindowTab;
                            }
                        }
                    }
                    const tabToActivate = currentWindowActiveTab || currentWindowTab || anyWindowActiveTab || anyWindowTab;
                    chrome.windows.update(tabToActivate.windowId, { focused: true });
                    chrome.tabs.update(tabToActivate.id, { active: true });
                }
                else {
                    chrome.tabs.create({ active: true, windowId: currentWindowId, url });
                }
            });
        });
    }
    registerInstallListener() {
        chrome.runtime.onInstalled.addListener((details) => __awaiter(this, void 0, void 0, function* () {
            if (details.reason == 'install') {
                this.showLoginDialog();
            }
            else if (details.reason == 'update') {
                const isLoggedIn = yield OidcClient.isLoggedIn();
                if (!isLoggedIn) {
                    this.showLoginDialog();
                }
            }
        }));
    }
    registerStorageListener() {
        chrome.storage.onChanged.addListener((changes) => __awaiter(this, void 0, void 0, function* () {
            const authorizationCode = changes['authorization_code'];
            if (authorizationCode && authorizationCode.newValue) {
                chrome.tabs.remove(this.loginTabId);
                if (yield OidcClient.authorize()) {
                    this.connection.reconnect()
                        .then(() => this.checkPermissions())
                        .catch(() => { });
                }
            }
        }));
    }
    registerTabsRemoveListener() {
        chrome.tabs.onRemoved.addListener((tabId) => {
            if (tabId == this.loginTabId) {
                this.loginTabId = null;
                this.loginWinId = null;
            }
        });
    }
    onPermissionsMessage(message, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (message.action == 'getIntegratedServices') {
                const items = yield this.getIntegratedServices();
                callback(items);
            }
        });
    }
    getIntegratedServices() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const integrations = (yield this.connection.getIntegrations()).filter(item => !!WebToolManager.toServiceUrl(item.serviceUrl));
                const descriptions = getWebToolDescriptions().reduce((map, description) => (map[description.serviceType] = description) && map, {});
                const serviceTypesMap = integrations.reduce((map, { serviceType, serviceUrl }) => {
                    const description = descriptions[serviceType];
                    if (description) {
                        description.origins.forEach(origin => map[origin] = serviceType);
                        if (description.hasAdditionalOrigins) {
                            const serviceUrlNormalized = WebToolManager.toServiceUrl(serviceUrl);
                            const isServiceUrlMatchKnownOrigin = description.origins.some(origin => WebToolManager.isMatch(serviceUrl, origin));
                            if (serviceUrlNormalized && !isServiceUrlMatchKnownOrigin) {
                                map[serviceUrlNormalized] = serviceType;
                            }
                        }
                    }
                    return map;
                }, {});
                return serviceTypesMap;
            }
            catch (error) {
                void 0;
            }
        });
    }
    checkPermissions() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = chrome.runtime.getURL('permissions/check.html');
            chrome.tabs.create({ url, active: true });
        });
    }
    openOptionsPageUrl() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = chrome.runtime.getURL('settings/settings.html');
            this.openPage(url);
        });
    }
    registerContentScripts() {
        this.contentScriptRegistrator.register();
    }
    registerMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
            void 0;
            if (!sender.url || sender.url.startsWith(chrome.runtime.getURL('popup'))) {
                this.onPopupRequest(message, senderResponse);
                return !!senderResponse;
            }
            if (sender.url && (sender.url.startsWith(chrome.runtime.getURL('permissions')) || sender.url.startsWith(chrome.runtime.getURL('settings')))) {
                this.onPermissionsMessage(message, senderResponse);
                return !!senderResponse;
            }
            if (!sender.tab) {
                return;
            }
            if (sender.tab.id == this.loginTabId) {
                return;
            }
            const tabId = sender.tab.id;
            this.onTabMessage(message, tabId);
            senderResponse(null);
        });
    }
    openOptionsPagePopupAction() {
        this.openOptionsPageUrl();
        return Promise.resolve(null);
    }
    showPopup(tabId) {
        this.sendToTabs({ action: 'showPopup' }, tabId);
    }
    hidePopup(tabId) {
        this.sendToTabs({ action: 'hidePopup' }, tabId);
    }
    isConnectionRetryEnabledPopupAction() {
        return this.connection.isConnectionRetryEnabled();
    }
    retryConnectionPopupAction() {
        return this.connection.retryConnection();
    }
}
