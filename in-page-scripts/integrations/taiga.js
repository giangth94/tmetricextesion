class TaigaIntegration {
    constructor() {
        this.observeMutations = true;
        this.showIssueId = true;
        this.matchUrl = /(.+)(\/project\/[^\/]+\/[^\/]+\/(\d+))/;
    }
    render(issueElement, linkElement) {
        let host = $$('.sidebar.ticket-data');
        if (!host) {
            return;
        }
        let linkContainer = $$.create('section');
        linkContainer.appendChild(linkElement);
        host.insertBefore(linkContainer, host.firstElementChild);
    }
    getIssue(issueElement, source) {
        let issueName = $$.try('.detail-header-container .detail-subject').textContent;
        if (!issueName) {
            return;
        }
        let projectName = $$.try('.detail-header-container .project-name').textContent;
        let match = this.matchUrl.exec(source.fullUrl);
        let serviceType = 'Taiga';
        let serviceUrl = match[1];
        let issueUrl = match[2];
        let issueId = '#' + match[3];
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}
IntegrationService.register(new TaigaIntegration());
