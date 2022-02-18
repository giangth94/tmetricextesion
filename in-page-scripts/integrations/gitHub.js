class GitHub {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.matchUrl = /(https:\/\/github\.com)(\/.+\/(issues|pull)\/(\d+))/;
    }
    render(issueElement, linkElement) {
        const host = $$('.gh-header-actions');
        if (host) {
            linkElement.style.display = 'inline-block';
            linkElement.classList.add('mr-2');
            linkElement.classList.add('btn');
            linkElement.classList.add('btn-sm');
            host.insertBefore(linkElement, host.firstElementChild);
        }
    }
    getIssue(issueElement, source) {
        const issueName = $$.try('.js-issue-title').textContent;
        if (!issueName) {
            return;
        }
        const projectName = $$.try('[itemprop=name]').textContent;
        const match = this.matchUrl.exec(source.fullUrl);
        const serviceUrl = match[1];
        const issueUrl = match[2];
        const issueType = match[3];
        let issueId = match[4];
        issueId = (issueType == 'pull' ? '!' : '#') + issueId;
        const serviceType = 'GitHub';
        const tagNames = $$.all('.js-issue-labels .IssueLabel').map(label => label.textContent);
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames };
    }
}
IntegrationService.register(new GitHub());
