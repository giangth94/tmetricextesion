class YouTrack {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.matchUrl = [
            '*://*/issue/*',
            '*://*/issues',
            '*://*/agiles/*'
        ];
        this.issueElementSelector = '.yt-issue-view, yt-agile-card';
    }
    render(issueElement, linkElement) {
        const host = $$('.yt-issue-view__meta-information', issueElement) ||
            $$('.yt-issue-toolbar', issueElement) ||
            $$('.yt-agile-card__summary', issueElement);
        if (host) {
            linkElement.classList.add('devart-timer-link-youtrack');
            host.appendChild(linkElement);
            const previousElementSibling = linkElement.previousElementSibling;
            if (previousElementSibling && previousElementSibling.classList.contains('yt-issue-view__meta-information-updated-created')) {
                previousElementSibling.style.marginRight = '10px';
            }
        }
    }
    getIssue(issueElement, source) {
        const issueName = $$.try('.yt-issue-body__summary', issueElement).textContent ||
            $$.try('yt-agile-card__summary > span', issueElement).textContent;
        if (!issueName) {
            return;
        }
        const linkElement = $$('.yt-issue-id', issueElement);
        const issueId = linkElement && linkElement.textContent;
        const issueUrl = linkElement && linkElement.getAttribute('href');
        const projectName = $$.try('yt-issue-project', issueElement).textContent;
        const tagNames = $$.all('.yt-issue-tags__tag__name', issueElement).map(_ => _.textContent);
        const serviceType = 'YouTrack';
        const serviceUrl = $$.try('base').href;
        return { issueId, issueName, projectName, tagNames, serviceType, serviceUrl, issueUrl };
    }
}
class YouTrackLite {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.matchUrl = [
            '*://*/issue/*',
            '*://*/issues',
            '*://*/agiles/*'
        ];
        this.issueElementSelector = '[class^=ticketContent__]';
    }
    render(issueElement, linkElement) {
        const host = $$('[class^=toolbar__]', issueElement);
        if (host) {
            linkElement.classList.add('devart-timer-link-youtrack');
            host.insertBefore(linkElement, $$('[class^=visibilityPicker__]', host));
        }
    }
    getIssue(issueElement, source) {
        const issueName = $$.try('summary h1', issueElement).textContent;
        if (!issueName) {
            return;
        }
        const serviceType = 'YouTrack';
        const serviceUrl = $$.try('base').href;
        const linkElement = $$('[class^=idLink_] a', issueElement);
        const issueId = linkElement && linkElement.textContent;
        const issueUrl = linkElement && $$.getRelativeUrl(serviceUrl, linkElement.getAttribute('href'));
        const projectField = $$.try('img[src*=\\/api\\/rest\\/projects\\/][src*=\\/icon]', issueElement).parentElement;
        const projectName = projectField ? $$.try('button', projectField).textContent : null;
        const tagNames = $$.all('[class^=tags_] a', issueElement).map(_ => _.textContent);
        return { issueId, issueName, projectName, tagNames, serviceType, serviceUrl, issueUrl };
    }
}
class YouTrackOld {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.matchUrl = '*://*/issue/*';
        this.issueElementSelector = '.content_fsi .toolbar_fsi';
    }
    render(issueElement, linkElement) {
        issueElement.appendChild(linkElement);
    }
    getIssue(issueElement, source) {
        const match = /^(.+)\/issue\/(.+)$/.exec(source.fullUrl);
        if (!match) {
            return;
        }
        const issueId = $$.try('.issueId', issueElement).textContent;
        if (!issueId) {
            return;
        }
        const issueName = $$.try('.issue-summary', issueElement).textContent;
        if (!issueName) {
            return;
        }
        const projectName = $$.try('.fsi-properties .fsi-property .attribute.bold').textContent;
        const serviceType = 'YouTrack';
        const serviceUrl = match[1];
        const issueUrl = 'issue/' + issueId;
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}
class YouTrackBoardOld {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.matchUrl = '*://*/rest/agile/*/sprint/*';
        this.issueElementSelector = '#editIssueDialog';
    }
    render(issueElement, linkElement) {
        const host = $$('.sb-issue-edit-id', issueElement);
        if (host) {
            host.parentElement.insertBefore(linkElement, host.nextElementSibling);
        }
    }
    getIssue(issueElement, source) {
        const match = /^(.+)\/rest\/agile\/(.+)$/.exec(source.fullUrl);
        if (!match) {
            return;
        }
        const issueId = $$.try('.sb-issue-edit-id', issueElement).textContent;
        if (!issueId) {
            return;
        }
        const issueName = $$.try('.sb-issue-edit-summary input', issueElement).value ||
            $$.try('.sb-issue-edit-summary.sb-disabled', issueElement).textContent;
        if (!issueName) {
            return;
        }
        const projectSelector = $$('.sb-agile-dlg-projects');
        const projectName = projectSelector ? $$.try('label[for=editAgileProjects_' + issueId.split('-')[0] + ']', projectSelector).textContent : null;
        const serviceType = 'YouTrack';
        const serviceUrl = match[1];
        const issueUrl = 'issue/' + issueId;
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}
IntegrationService.register(new YouTrack(), new YouTrackLite(), new YouTrackOld(), new YouTrackBoardOld());
