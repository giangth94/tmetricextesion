class Userecho {
    constructor() {
        this.showIssueId = false;
        this.matchUrl = 'https://*.userecho.com/*';
    }
    render(issueElement, linkElement) {
        let host = $$('.topic-actions-panel');
        if (host) {
            let container = $$.create('li');
            container.appendChild(linkElement);
            host.insertBefore(container, host.firstChild);
        }
    }
    getIssue(issueElement, source) {
        let issue = $$.try('.topic-header a');
        let issueName = issue.textContent;
        let issueHref = issue.getAttribute('href');
        let match = /^(\/[^\/]+\/\d+\/[^\/]+\/(\d+)-)/.exec(issueHref);
        if (!issueName || !match) {
            return;
        }
        let issueUrl = match[1];
        let issueId = match[2];
        let serviceUrl = source.protocol + source.host;
        let projectName = $$.try('.navbar-brand').textContent;
        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Userecho' };
    }
}
IntegrationService.register(new Userecho());
