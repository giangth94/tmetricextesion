class Trac {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.matchUrl = '*://*/ticket/*';
        this.issueElementSelector = '#main > #content.ticket';
    }
    render(issueElement, linkElement) {
        var host = $$('#trac-ticket-title > a', issueElement) ||
            $$('.trac-id', issueElement);
        if (host) {
            linkElement.classList.add('devart-timer-link-trac');
            host.parentElement.appendChild(linkElement);
        }
    }
    getIssue(issueElement, source) {
        var match = /^(.+)\/ticket\/(\d+)(#.*)?$/.exec(source.fullUrl);
        if (!match) {
            return;
        }
        var issueId = '#' + match[2];
        var issueName = $$.try('.summary', issueElement).textContent;
        if (!issueName) {
            return;
        }
        var projectName = document.title.split('–').pop();
        if (projectName) {
            projectName = projectName.trim();
        }
        var serviceType = 'Trac';
        var serviceUrl = match[1];
        var issueUrl = 'ticket/' + match[2];
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}
IntegrationService.register(new Trac());
