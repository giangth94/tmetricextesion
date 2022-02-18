class Insightly {
    constructor() {
        this.showIssueId = false;
        this.observeMutations = true;
        this.matchUrl = [/https:\/\/crm\..*\.insightly\.com\/.*\?blade=\/details\/task\/.*/i, /https:\/\/crm\..*\.insightly\.com\/details\/task\/.*/i];
        this.issueElementSelector = () => [$$('#main-container.details') || $$('#main-container.details.details-single')];
    }
    render(issueElement, linkElement) {
        let toolbar = $$('.btn-toolbar.custom-buttons-toolbar', issueElement);
        if (toolbar) {
            linkElement.classList.add('btn');
            toolbar.firstChild.before(linkElement);
        }
    }
    getIssue(issueElement, source) {
        let issueName = $$.try('#metadata-row-viewer-TITLE', issueElement).title;
        let issueId = $$.try('#metadata-row-viewer-TASK_ID', issueElement).title;
        let issueUrl = issueId && `details/task/${issueId}`;
        let projectName = $$.try('#metadata-row-viewer-PROJECT_ID', issueElement).title ||
            $$.try('#metadata-row-viewer-OPPORTUNITY_ID', issueElement).title;
        let serviceUrl = source.protocol + source.host;
        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Insightly' };
    }
}
IntegrationService.register(new Insightly());
