class ServerConnection {
    constructor() {
        this.expectedTimerUpdate = false;
        this.waitAllRejects = Promise.all;
        this.waitAllRejects = ((promises) => new Promise((resolve, reject) => {
            let error = null;
            let pendingCounter = promises.length;
            promises.forEach(p => p
                .catch((e) => {
                if (error == null) {
                    error = e != null ? e : 'failed';
                }
            })
                .then(() => {
                pendingCounter--;
                if (!pendingCounter && error != null) {
                    reject(error);
                }
            }));
            Promise.all(promises)
                .then(r => resolve(r))
                .catch(() => { });
        }));
    }
    init(options) {
        this.serviceUrl = options.serviceUrl;
        OidcClient.init(options.authorityUrl);
        return this.reconnect().catch(() => { });
    }
    isProfileChanged() {
        const previousProfileId = this.userProfile && this.userProfile.userProfileId;
        return this.getProfile().then(profile => profile.userProfileId != previousProfileId);
    }
    checkProfileChange() {
        return this.isProfileChanged().then(isProfileChanged => {
            if (isProfileChanged) {
                this.reconnect();
            }
        });
    }
    reconnect() {
        void 0;
        return this.disconnect()
            .then(() => this.connect())
            .then(() => undefined);
    }
    connect() {
        void 0;
        return new Promise((callback, reject) => {
            this.waitAllRejects([this.getVersion(), this.getProfile()])
                .then(([version, profile]) => {
                callback(profile);
            })
                .catch(e => {
                void 0;
                reject(e);
            });
        });
    }
    disconnect() {
        return Promise.resolve();
    }
    putTimer(timer) {
        return this.connect().then(profile => {
            const accountId = this.accountToPost || profile.activeAccountId;
            this.expectedTimerUpdate = true;
            const promise = this
                .put(this.getTimerUrl(accountId), timer)
                .then(() => this.checkProfileChange());
            promise.catch(() => {
                this.expectedTimerUpdate = false;
                this.checkProfileChange();
            });
            return promise;
        });
    }
    putIssueTimer(timer) {
        if (!timer.isStarted) {
            return this.putTimer({ isStarted: false });
        }
        timer = Object.assign({}, timer);
        if (!timer.issueUrl) {
            timer.serviceType = null;
            timer.serviceUrl = null;
        }
        return this.connect().then(profile => {
            const accountId = this.accountToPost || profile.activeAccountId;
            this.expectedTimerUpdate = true;
            const promise = this.post(this.getIssueTimerUrl(accountId), timer).then(() => {
                this.checkProfileChange();
            });
            promise.catch(() => {
                this.expectedTimerUpdate = false;
                this.checkProfileChange();
            });
            return promise;
        });
    }
    getIntegrations() {
        return this.checkProfile().then(profile => this.get(this.getIntegrationsUrl()));
    }
    getIntegration(identifier, accountId, keepAccount) {
        return this.checkProfile().then(profile => this.get(this.getIntegrationProjectUrl(accountId || profile.activeAccountId) + '?' + $.param($.extend({ keepAccount }, identifier), true)));
    }
    postIntegration(identifier) {
        return this.checkProfile().then(profile => this.post(this.getIntegrationProjectUrl(this.accountToPost || profile.activeAccountId), identifier));
    }
    setAccountToPost(accountId) {
        return new Promise(callback => {
            this.accountToPost = accountId;
            callback();
        });
    }
    fetchIssuesDurations(identifiers) {
        void 0;
        return this.checkProfile().then(profile => this.post(this.getTimeEntriesSummaryUrl(profile.activeAccountId), identifiers));
    }
    checkProfile() {
        return new Promise((callback, reject) => {
            const profile = this.userProfile;
            if (profile && profile.activeAccountId) {
                callback(profile);
            }
            else {
                reject();
            }
        });
    }
    getProfile() {
        const profile = this.get('api/userprofile').then(profile => {
            this.userProfile = profile;
            return profile;
        });
        profile.catch(() => this.disconnect());
        return profile;
    }
    getVersion() {
        return this.get('api/version').then(version => {
            this.serverApiVersion = version;
            return version;
        });
    }
    getTimer() {
        return this.checkProfile().then(profile => {
            const accountId = profile.activeAccountId;
            const url = this.getTimerUrl(accountId);
            return this.get(url);
        });
    }
    getAccountScope(accountId) {
        return this.checkProfile().then(profile => {
            if (!accountId) {
                accountId = profile.activeAccountId;
            }
            const url = 'api/accounts/' + accountId + '/scope';
            return this.get(url);
        });
    }
    getRecentWorkTasks(accountId) {
        const url = 'api/accounts/' + accountId + '/timeentries/recent';
        return this.get(url);
    }
    getData() {
        return this.checkProfile();
    }
    get(url) {
        return OidcClient.ajax(this.serviceUrl + url, 'GET');
    }
    post(url, data) {
        return OidcClient.ajax(this.serviceUrl + url, 'POST', data);
    }
    put(url, data) {
        return OidcClient.ajax(this.serviceUrl + url, 'PUT', data);
    }
    getIntegrationsUrl() {
        return `api/userprofile/integrations`;
    }
    getIntegrationProjectUrl(accountId) {
        return `api/accounts/${accountId}/integrations/project`;
    }
    getTimerUrl(accountId) {
        return `api/accounts/${accountId}/timer`;
    }
    getIssueTimerUrl(accountId) {
        return `api/accounts/${accountId}/timer/issue`;
    }
    getTimeEntriesUrl(accountId, userProfileId) {
        return `api/accounts/${accountId}/timeentries/${userProfileId}`;
    }
    getTimeEntriesSummaryUrl(accountId) {
        return `api/accounts/${accountId}/timeentries/external/summary`;
    }
}
ServerConnection.statusDescriptions = {
    100: "Continue",
    101: "Switching Protocols",
    102: "Processing",
    200: "OK",
    201: "Created",
    202: "Accepted",
    203: "Non-Authoritative Information",
    204: "No Content",
    205: "Reset Content",
    206: "Partial Content",
    207: "Multi-Status",
    300: "Multiple Choices",
    301: "Moved Permanently",
    302: "Found",
    303: "See Other",
    304: "Not Modified",
    305: "Use Proxy",
    307: "Temporary Redirect",
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    411: "Length Required",
    412: "Precondition Failed",
    413: "Request Entity Too Large",
    414: "Request-Uri Too Long",
    415: "Unsupported Media Type",
    416: "Requested Range Not Satisfiable",
    417: "Expectation Failed",
    422: "Unprocessable Entity",
    423: "Locked",
    424: "Failed Dependency",
    426: "Upgrade Required",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
    505: "Http Version Not Supported",
    507: "Insufficient Storage"
};
