class GoogleDocs {
    constructor() {
        this.showIssueId = false;
        this.matchUrl = '*://docs.google.com/*';
        this.observeMutations = true;
    }
    render(issueElement, linkElement) {
        let host = $$('#docs-menubar');
        if (host) {
            host.appendChild(linkElement);
        }
    }
    getIssue(issueElement, source) {
        let issueName = $$.try('#docs-titlebar .docs-title-input').value;
        if (!issueName) {
            return;
        }
        let issueUrl;
        let issueId;
        let matches = source.path.match(/\/.+\/d\/([a-zA-Z0-9_\-]+)\/edit/);
        if (matches) {
            issueUrl = matches[0];
            issueId = matches[1];
        }
        var serviceUrl = source.protocol + source.host;
        return { issueId, issueName, issueUrl, serviceUrl, serviceType: 'GoogleDocs' };
    }
}
IntegrationService.register(new GoogleDocs());
