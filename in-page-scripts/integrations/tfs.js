class TfsIntegration {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.matchUrl = [
            '*://*.visualstudio.com/*',
            '*://*/_home*',
            '*://*/_boards*',
            '*://*/_dashboards*',
            '*://*/_backlogs*',
            '*://*/_workitems*',
            '*://*/_sprints*',
            '*://*/_queries*',
        ];
        this.issueElementSelector = () => $$.all('.work-item-form');
    }
    render(issueElement, linkElement) {
        let host = $$.visible('.work-item-form-headerContent', issueElement);
        if (!host) {
            return;
        }
        let linkContainer = $$.create('div', 'devart-timer-link-tfs');
        linkContainer.appendChild(linkElement);
        host.insertBefore(linkContainer, host.firstElementChild);
    }
    getIssue(issueElement, source) {
        let issue = $$.visible('.work-item-form-title input', issueElement);
        let issueName = issue && issue.value;
        if (!issueName) {
            return;
        }
        let issueId;
        let issueUrl;
        let parent = issueElement;
        while (parent) {
            let issueUrlElement = $$('.info-text-wrapper a', parent);
            if (issueUrlElement) {
                issueUrl = issueUrlElement.getAttribute('href');
                break;
            }
            parent = parent.parentElement;
        }
        if (issueUrl) {
            let issueIdRegExp = /\/edit\/(\d*)(\?.*)?$/.exec(issueUrl);
            if (issueIdRegExp) {
                issueId = '#' + issueIdRegExp[1];
            }
            else {
                issueUrl = null;
            }
        }
        let tagNames = $$.all("span.tag-box.tag-box-delete-experience", issueElement).map(label => label.textContent);
        let serviceUrl = source.protocol + source.host;
        let serviceType = 'TFS';
        let itemView = $$.visible('.work-item-view', issueElement);
        let projectInput = itemView && $$('input[aria-label="Area Path"]', itemView)
            || $$('.work-item-form-areaIteration input', issueElement);
        let projectName = projectInput && projectInput.value;
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames };
    }
}
IntegrationService.register(new TfsIntegration());
