var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class SignalRConnection extends ServerConnection {
    constructor() {
        super();
        this.hubProxy = new SignalRHubProxy();
        this.minRetryInterval = 15000;
        this.maxRetryInterval = 90000;
        this.intervalMultiplier = 1.25;
        this.intervalMultiplierTimeout = 5 * 60000;
        this._retryTimeStamp = new Date();
        this.expectedTimerUpdate = false;
        this.disconnecting = false;
        this.onUpdateActiveAccount = SimpleEvent.create();
        this.onInvalidateAccountScopeCache = SimpleEvent.create();
        this.onRemoveExternalIssuesDurations = SimpleEvent.create();
        this.onUpdateTimer = SimpleEvent.create();
        this.onUpdateTracker = SimpleEvent.create();
        this.onUpdateProfile = SimpleEvent.create();
    }
    init(options) {
        this.serviceUrl = options.serviceUrl;
        this.signalRUrl = options.signalRUrl;
        OidcClient.init(options.authorityUrl);
        this.hubProxy.on('updateTimer', (accountId) => {
            if (this.userProfile && accountId != this.userProfile.activeAccountId) {
                return;
            }
            void 0;
            if (this.expectedTimerUpdate) {
                this.expectedTimerUpdate = false;
                this.getData();
            }
            else {
                this.isProfileChanged().then(isProfileChanged => {
                    if (isProfileChanged) {
                        this.reconnect();
                    }
                    else {
                        this.getData();
                    }
                });
            }
        });
        this.hubProxy.on('updateActiveAccount', (accountId) => {
            this.onUpdateActiveAccount.emit(accountId);
            if (!this.userProfile || accountId != this.userProfile.activeAccountId) {
                this.reconnect();
            }
            this.onInvalidateAccountScopeCache.emit(accountId);
        });
        this.hubProxy.on('updateAccount', (accountId) => {
            this.onInvalidateAccountScopeCache.emit(accountId);
        });
        this.hubProxy.on('updateProjects', (accountId) => {
            this.onInvalidateAccountScopeCache.emit(accountId);
        });
        this.hubProxy.on('updateClients', (accountId) => {
            this.onInvalidateAccountScopeCache.emit(accountId);
        });
        this.hubProxy.on('updateTags', (accountId) => {
            this.onInvalidateAccountScopeCache.emit(accountId);
        });
        this.hubProxy.on('updateExternalIssuesDurations', (accountId, identifiers) => {
            if (this.userProfile && this.userProfile.activeAccountId == accountId) {
                this.onRemoveExternalIssuesDurations.emit(identifiers);
            }
        });
        return this.reconnect().catch(() => { });
    }
    get canRetryConnection() {
        return !this.hubConnected && !this._retryInProgress;
    }
    isConnectionRetryEnabled() {
        void 0;
        return Promise.resolve(!!(this._retryTimeoutHandle || this._retryInProgress));
    }
    reconnect() {
        void 0;
        return this.disconnect()
            .then(() => this.connect())
            .then(() => this.getData())
            .then(() => undefined);
    }
    connect() {
        void 0;
        return new Promise((callback, reject) => {
            if (this.hubConnected) {
                void 0;
                callback(this.userProfile);
                return;
            }
            this.waitAllRejects([this.getVersion(), this.getProfile()])
                .then(([version, profile]) => {
                if (!this.hub) {
                    const hub = new signalR.HubConnectionBuilder()
                        .withUrl(this.signalRUrl + 'appHub')
                        .configureLogging(signalR.LogLevel.Warning)
                        .build();
                    hub.onclose(() => {
                        this.hubProxy.onDisconnect(hub);
                        this.expectedTimerUpdate = false;
                        void 0;
                        if (!this.disconnecting) {
                            this.disconnect().then(() => {
                                this.setRetryPending(true);
                            });
                        }
                    });
                    this.hub = hub;
                }
                let hubPromise = Promise.resolve();
                if (!this.hubProxy.isConnected) {
                    hubPromise = this.hub.start();
                    hubPromise.catch(() => this.setRetryPending(true));
                    hubPromise.then(() => this.hubProxy.onConnect(this.hub));
                }
                hubPromise
                    .then(() => {
                    this.hubConnected = true;
                    this.setRetryPending(false);
                    void 0;
                    return this.hub.invoke('register', profile.userProfileId).then(() => callback(profile));
                })
                    .catch(reject);
            })
                .catch(e => {
                void 0;
                reject(e);
            });
        });
    }
    setRetryPending(value) {
        void 0;
        if (!!this._retryTimeoutHandle == value) {
            return;
        }
        if (value) {
            let timeout = this._retryTimeout;
            const fromPreviousRetry = new Date().getTime() - this._retryTimeStamp.getTime();
            if (!timeout || timeout < this.minRetryInterval && fromPreviousRetry > this.intervalMultiplierTimeout) {
                timeout = this.minRetryInterval;
            }
            else {
                timeout = Math.min(timeout * this.intervalMultiplier, this.maxRetryInterval);
            }
            this._retryTimeout = timeout;
            timeout *= 1 + Math.random();
            this._retryTimeoutHandle = setTimeout(() => {
                this._retryTimeoutHandle = null;
                this.retryConnection();
            }, timeout);
        }
        else if (this._retryTimeoutHandle) {
            clearTimeout(this._retryTimeoutHandle);
            this._retryTimeoutHandle = null;
        }
    }
    retryConnection() {
        void 0;
        this.setRetryPending(false);
        if (this.canRetryConnection) {
            this._retryInProgress = true;
            this.reconnect()
                .catch((err) => {
                if (!(err.statusCode > 0)) {
                    void 0;
                    this.setRetryPending(true);
                }
            })
                .then(() => this._retryInProgress = false);
        }
        return Promise.resolve();
    }
    disconnect() {
        this.disconnecting = true;
        let disconnectPromise;
        if (!this.hubConnected) {
            disconnectPromise = Promise.resolve();
        }
        else {
            this.hubConnected = false;
            this.onUpdateTimer.emit(null);
            void 0;
            disconnectPromise = this.hub.stop();
        }
        const promise = disconnectPromise.then(() => {
            void 0;
            this.setRetryPending(false);
        });
        promise.then(() => this.disconnecting = false);
        promise.catch(() => this.disconnecting = false);
        return promise;
    }
    getProfile() {
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            const profile = yield _super("getProfile").call(this);
            this.onUpdateProfile.emit(profile);
            return profile;
        });
    }
    getData() {
        return this.checkProfile().then(profile => {
            const accountId = profile.activeAccountId;
            const userProfileId = profile.userProfileId;
            let url = this.getTimerUrl(accountId);
            const timer = this.get(url).then(timer => {
                this.onUpdateTimer.emit(timer);
                return timer;
            });
            const now = new Date();
            const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toJSON();
            const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toJSON();
            url = this.getTimeEntriesUrl(accountId, userProfileId) + `?startTime=${startTime}&endTime=${endTime}`;
            const timeEntries = this.get(url).then(timeEntries => {
                this.onUpdateTracker.emit(timeEntries);
                return timeEntries;
            });
            const all = Promise.all([timer, timeEntries]);
            all.catch(() => this.disconnect());
            return all;
        });
    }
}
{
    const p = signalR.HubConnection.prototype;
    const oldInvoke = p.invokeClientMethod;
    p.invokeClientMethod = function (message) {
        if (message && message.target) {
            const methods = this.methods;
            if (methods && !methods[message.target.toLowerCase()]) {
                this.on(message.target, () => { });
            }
        }
        oldInvoke.apply(this, arguments);
    };
}
