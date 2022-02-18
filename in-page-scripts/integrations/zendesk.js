class Zendesk {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.matchUrl = '*://*.zendesk.com/agent/tickets/*';
    }
    render(issueElement, linkElement) {
        let host = $$.visible('header .pane.right');
        if (host) {
            linkElement.classList.add('btn', 'origin', 'devart-timer-link-zendesk');
            host.appendChild(linkElement);
        }
    }
    getIssue(issueElement, source) {
        let issueNameElement = $$.visible('.ticket .editable input[name=subject]') ||
            $$.visible('.ticket .editable input[data-test-id=ticket-pane-subject]') ||
            $$.visible('.ticket input[data-test-id=omni-header-subject]');
        let issueName = issueNameElement && issueNameElement.value;
        if (!issueName) {
            return;
        }
        let match = /^\/agent\/tickets\/(\d+)$/.exec(source.path);
        if (match) {
            var issueId = '#' + match[1];
            var issueUrl = source.path;
        }
        let projectName = '';
        let serviceType = 'Zendesk';
        let serviceUrl = source.protocol + source.host;
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}
IntegrationService.register(new Zendesk());
