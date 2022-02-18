class Usedesk {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.matchUrl = '*://*.usedesk.*/tickets/*';
    }
    render(issueElement, linkElement) {
        let host = $$.visible('#ticket-buttons');
        if (host) {
            linkElement.classList.add('btn', 'btn-default');
            host.appendChild(linkElement);
        }
    }
    getIssue(issueElement, source) {
        let issueName = $$.try('#editable_subject').textContent;
        if (!issueName) {
            return;
        }
        let projectName = $$.try('#ticket-channel-name').textContent;
        let issueId;
        let serviceUrl = source.protocol + source.host;
        let issueUrl;
        let match = /^\/tickets\/(\d+)$/.exec(source.path);
        if (match) {
            issueId = `#${match[1]}`;
            issueUrl = source.path;
        }
        return { issueId, issueName, projectName, serviceType: 'UseDesk', serviceUrl, issueUrl };
    }
}
IntegrationService.register(new Usedesk());
