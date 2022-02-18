class IntegrationService {
    static register(...integrations) {
        this._allIntegrations.push(...integrations);
    }
    static isUrlMatched(integration, url) {
        function convertPatternToRegExp(matchPattern) {
            let regexp = IntegrationService._matchPatternCache[matchPattern];
            if (!regexp) {
                regexp = new RegExp(matchPattern
                    .replace(/[\-\/\\\^\$\+\?\.\(\)\|\[\]\{\}]/g, '\\$&')
                    .replace(/\*/g, '.*'));
                IntegrationService._matchPatternCache[matchPattern] = regexp;
            }
            return regexp;
        }
        const matchUrl = integration.matchUrl;
        if (!matchUrl) {
            return true;
        }
        const patterns = (matchUrl instanceof Array ? matchUrl : [matchUrl]);
        return patterns.some(pattern => {
            const regexp = typeof pattern === 'string' ? convertPatternToRegExp(pattern) : pattern;
            return regexp.test(url);
        });
    }
    static setConstants(constants) {
        this._constants = constants;
    }
    static setTimer(timer) {
        this._timer = timer;
    }
    static needsUpdate() {
        return $$.all('a.' + this.affix).some(link => {
            const linkTimer = this.parseLinkTimer(link);
            this.checkTimerExternalTask(linkTimer);
            return !linkTimer.isStarted || this.isIssueStarted(linkTimer);
        });
    }
    static updateLinks(checkAllIntegrations) {
        const source = this.getSourceInfo(document.URL);
        if (!this._possibleIntegrations || checkAllIntegrations) {
            this._possibleIntegrations = this._allIntegrations;
        }
        this._possibleIntegrations = this._possibleIntegrations.filter(integration => this.isUrlMatched(integration, source.fullUrl) &&
            (!integration.match || integration.match(source)));
        const issues = [];
        const parsedIssues = [];
        this._possibleIntegrations.some(integration => {
            let elements = [null];
            const selector = integration.issueElementSelector;
            if (selector) {
                if (typeof selector === 'function') {
                    elements = selector().filter(_ => !!_);
                }
                else {
                    elements = $$.all(Array.isArray(selector) ? selector.join(', ') : selector);
                }
            }
            elements.forEach(element => {
                const issue = integration.getIssue(element, source);
                if (!issue || !issue.issueName && !issue.issueId && !issue.projectName) {
                    this.updateLink(element, null, null, null);
                }
                else {
                    issue.serviceUrl = issue.serviceUrl ? issue.serviceUrl.replace(/\/+$/, '') : issue.serviceUrl;
                    issue.issueUrl = issue.issueUrl ? issue.issueUrl.replace(/^\/*/, '/') : issue.issueUrl;
                    issue.issueId = this.trimText(issue.issueId, 128);
                    issue.issueName = this.trimText(issue.issueName, 400);
                    issue.issueUrl = this.trimText(issue.issueUrl, 256);
                    issue.serviceUrl = this.trimText(issue.serviceUrl, 1024);
                    issue.serviceType = this.trimText(issue.serviceType, 128);
                    issue.projectName = this.trimText(issue.projectName, 255);
                    this.checkTimerExternalTask(issue);
                    if (!issue.issueUrl || !issue.serviceUrl || !issue.serviceType) {
                        issue.issueUrl = null;
                        issue.issueId = null;
                    }
                    if (issue.tagNames) {
                        issue.tagNames = [...new Set(issue.tagNames
                                .map(tagName => this.trimText(tagName, 50))
                                .filter(tagName => !!tagName))
                        ];
                    }
                    issues.push(issue);
                    parsedIssues.push({ element, issue });
                }
            });
            if (!issues.length) {
                this.onIssueLinksUpdated();
            }
            else {
                this._possibleIntegrations = [integration];
                const newParsedIssues = parsedIssues.filter(issue => !$$('a.' + this.affix, issue.element));
                IntegrationService.updateIssues(integration, newParsedIssues);
                this.onIssueLinksUpdated();
                this.getIssuesDurations(issues).then(durations => {
                    IntegrationService._issueDurationsCache = durations;
                    IntegrationService.updateIssues(integration, parsedIssues);
                    this.onIssueLinksUpdated();
                }).catch(() => {
                    void 0;
                });
                return true;
            }
        });
        return { issues, observeMutations: this._possibleIntegrations.some(i => i.observeMutations) };
    }
    static updateIssues(integration, issues) {
        const MIN = 60 * 1000;
        const HOUR = 60 * MIN;
        issues.forEach(({ element, issue }) => {
            let duration = this.getIssueDuration(issue) || 0;
            if (issue.issueUrl && this.isIssueStarted(issue)) {
                const timerDuration = Math.max(0, Date.now() - Date.parse(this._timer.startTime));
                if (timerDuration <= this._constants.maxTimerHours * HOUR) {
                    duration += timerDuration;
                }
            }
            duration = Math.floor(duration / MIN) * MIN;
            this.updateLink(element, integration, issue, duration);
        });
    }
    static setIssuesDurations(durations) {
        if (this._pendingIssuesDurations) {
            const resolve = this._pendingIssuesDurations.resolve;
            this._pendingIssuesDurations = null;
            resolve(durations);
        }
    }
    static makeIssueDurationKey(identifier) {
        return identifier.serviceUrl + '/' + identifier.issueUrl;
    }
    static getIssuesDurations(identifiers) {
        if (!identifiers || !identifiers.length) {
            return Promise.resolve([]);
        }
        const newIdentifiers = [];
        const oldIdentifiers = {};
        let pendingDurations = this._pendingIssuesDurations;
        if (pendingDurations) {
            pendingDurations.identifiers.forEach(id => oldIdentifiers[this.makeIssueDurationKey(id)] = true);
            pendingDurations.reject();
        }
        else {
            pendingDurations = {
                identifiers: []
            };
        }
        identifiers.forEach(id => {
            if (!oldIdentifiers[this.makeIssueDurationKey(id)]) {
                newIdentifiers.push(id);
            }
        });
        if (newIdentifiers.length) {
            identifiers = pendingDurations.identifiers.concat(newIdentifiers);
            pendingDurations.identifiers = identifiers;
        }
        const promise = new Promise((resolve, reject) => {
            pendingDurations.resolve = resolve;
            pendingDurations.reject = reject;
        });
        if (newIdentifiers.length) {
            window.sendBackgroundMessagee({ action: 'getIssuesDurations', data: identifiers });
        }
        this._pendingIssuesDurations = pendingDurations;
        return promise;
    }
    static getIssueDuration(issue) {
        for (const duration of IntegrationService._issueDurationsCache) {
            if (duration.issueUrl == issue.issueUrl && duration.serviceUrl == issue.serviceUrl) {
                return duration.duration;
            }
        }
    }
    static trimText(text, maxLength) {
        if (text) {
            text = text.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
            if (text.length > maxLength) {
                text = text.substring(0, maxLength - 2) + '..';
            }
        }
        return text || null;
    }
    static durationToString(duration) {
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
    static parseLinkTimer(link) {
        if (link) {
            return JSON.parse(link.getAttribute('data-' + this.affix));
        }
    }
    static parseLinkSession(link) {
        if (link) {
            return parseInt(link.getAttribute('data-session'));
        }
    }
    static updateLink(element, integration, newIssue, newIssueDuration) {
        const oldLink = $$('a.' + this.affix, element);
        if (!newIssue) {
            this.removeLink(oldLink);
            return;
        }
        const isIssueStarted = this.isIssueStarted(newIssue);
        const newIssueTimer = {};
        newIssueTimer.isStarted = !isIssueStarted;
        newIssueTimer.showIssueId = integration.showIssueId;
        newIssueTimer.duration = newIssueDuration;
        for (const i in newIssue) {
            newIssueTimer[i] = newIssue[i];
        }
        let oldIssueTimer;
        let oldSession;
        if (oldLink) {
            oldIssueTimer = this.parseLinkTimer(oldLink);
            oldSession = this.parseLinkSession(oldLink);
        }
        if (oldSession > this.session) {
            return;
        }
        if (this.isSameIssue(oldIssueTimer, newIssueTimer) &&
            newIssueTimer.duration == oldIssueTimer.duration &&
            newIssueTimer.isStarted == oldIssueTimer.isStarted &&
            newIssueTimer.projectName == oldIssueTimer.projectName &&
            this.areSetsEqual(newIssueTimer.tagNames, oldIssueTimer.tagNames) &&
            oldSession == this.session) {
            return;
        }
        this.removeLink(oldLink);
        const newLink = document.createElement('a');
        newLink.classList.add(this.affix);
        newLink.classList.add(this.affix + (isIssueStarted ? '-stop' : '-start'));
        newLink.setAttribute('data-' + this.affix, JSON.stringify(newIssueTimer));
        newLink.setAttribute('data-session', this.session.toString());
        newLink.href = '#';
        newLink.title = 'Track spent time via TMetric service';
        newLink.onclick = function (e) {
            this.blur();
            e.stopPropagation();
            window.sendBackgroundMessagee({ action: 'putTimer', data: newIssueTimer });
            return false;
        };
        const spanWithIcon = document.createElement('span');
        spanWithIcon.classList.add(this.affix + '-icon');
        newLink.appendChild(spanWithIcon);
        const span = document.createElement('span');
        span.textContent = isIssueStarted ? 'Stop timer' : 'Start timer';
        if (newIssue.issueUrl && (newIssueTimer.duration || isIssueStarted)) {
            span.textContent += ' (' + this.durationToString(newIssueTimer.duration) + ')';
        }
        newLink.appendChild(span);
        integration.render(element, newLink);
    }
    static clearPage() {
        $$.all('a.' + this.affix).forEach(a => this.removeLink(a));
    }
    static checkTimerExternalTask(issue) {
        if (!issue.issueUrl
            && this._timer
            && this._timer.isStarted) {
            const projectTask = this._timer.details && this._timer.details.projectTask;
            if (projectTask
                && projectTask.relativeIssueUrl
                && projectTask.description == issue.issueName) {
                issue.serviceUrl = projectTask.integrationUrl;
                issue.issueUrl = projectTask.relativeIssueUrl;
                issue.issueId = projectTask.externalIssueId;
            }
        }
    }
    static isSameIssue(oldIssue, newIssue) {
        function normalizeServiceUrl(issue) {
            if (!issue.issueUrl) {
                return '';
            }
            const url = (issue.serviceUrl || '').trim();
            if (url.length && url[url.length - 1] == '/') {
                return url.substring(0, url.length - 1);
            }
            return url;
        }
        function normalize(text) {
            return (text || '').trim();
        }
        if (oldIssue === newIssue) {
            return true;
        }
        return oldIssue &&
            oldIssue.issueId == newIssue.issueId &&
            normalize(oldIssue.issueName) == normalize(newIssue.issueName) &&
            (oldIssue.issueName || oldIssue.projectName == newIssue.projectName) &&
            normalize(oldIssue.description) == normalize(newIssue.description) &&
            normalizeServiceUrl(oldIssue) == normalizeServiceUrl(newIssue);
    }
    static getSourceInfo(fullUrl) {
        let host = fullUrl || '';
        let protocol = '';
        let path = '';
        let i = host.search(/[#\?]/);
        if (i >= 0) {
            host = host.substring(0, i);
        }
        i = host.indexOf(':');
        if (i >= 0) {
            i++;
            while (i < host.length && host[i] == '/') {
                i++;
            }
            protocol = host.substring(0, i);
            host = host.substring(i);
        }
        i = host.indexOf('/');
        if (i >= 0) {
            path = host.substring(i);
            host = host.substring(0, i);
        }
        return { fullUrl, protocol, host, path };
    }
    static areSetsEqual(set1, set2) {
        set1 = set1 || [];
        set2 = set2 || [];
        if (set1.length != set2.length) {
            return false;
        }
        const hasValue = {};
        set1.forEach(item => hasValue[item && item.toString()] = true);
        return set2.every(item => hasValue[item && item.toString()]);
    }
    static removeLink(link) {
        if (!link) {
            return;
        }
        let content = link;
        let container = link.parentElement;
        while (container && container.classList
            && container.classList.contains(this.affix + '-' + container.tagName.toLowerCase())) {
            content = container;
            container = container.parentElement;
        }
        if (container) {
            container.removeChild(content);
        }
    }
    static isIssueStarted(issue) {
        const timer = this._timer;
        if (!timer || !timer.isStarted || !timer.details) {
            return false;
        }
        let startedIssue;
        const task = timer.details.projectTask;
        if (task) {
            startedIssue = {
                issueId: task.externalIssueId,
                issueName: task.description,
                issueUrl: task.relativeIssueUrl,
                serviceUrl: task.integrationUrl
            };
        }
        else {
            startedIssue = {
                issueName: timer.details.description
            };
        }
        startedIssue.projectName = timer.projectName;
        if (issue.description) {
            startedIssue.description = timer.details.description;
        }
        return this.isSameIssue(startedIssue, issue);
    }
}
IntegrationService.session = Date.now();
IntegrationService.affix = 'devart-timer-link';
IntegrationService._issueDurationsCache = [];
IntegrationService._pendingIssuesDurations = null;
IntegrationService._allIntegrations = [];
IntegrationService._matchPatternCache = {};
