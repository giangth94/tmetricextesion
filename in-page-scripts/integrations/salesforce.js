class Salesforce {
    constructor() {
        this.showIssueId = false;
        this.observeMutations = true;
        this.matchUrl = '*://*.lightning.force.com';
        this.issueElementSelector = [
            '.slds-page-header'
        ];
    }
    render(issueElement, linkElement) {
        let host = $$('.forceActionsContainer', issueElement);
        if (host) {
            linkElement.style.marginRight = '0.5rem';
            linkElement.style.alignSelf = 'center';
            host.parentNode.insertBefore(linkElement, host);
        }
    }
    getIssue(issueElement, source) {
        let serviceType = 'Salesforce';
        let serviceUrl = source.protocol + source.host;
        let issueName;
        let issueId;
        let issueUrl;
        let title = $$.visible('h1 .slds-page-header__title, h1 .uiOutputText', issueElement);
        if (!title) {
            return;
        }
        let match = /\/lightning\/r\/(\w+)\/(\w+)\/view$/.exec(source.path);
        if (match) {
            issueName = title.textContent;
            issueId = match[2];
        }
        else if (/\/lightning\/o\/Task\//.test(source.path)) {
            let recentTasks = $$.all('.forceListViewManagerSplitViewList .slds-split-view__list-item-action').filter(el => {
                let textEl = $$.visible('.uiOutputText', el);
                if (textEl) {
                    return textEl.textContent == title.textContent;
                }
            });
            if (recentTasks.length == 1) {
                issueName = title.textContent;
                issueId = recentTasks[0].getAttribute('data-recordid');
            }
        }
        if (!issueName) {
            return;
        }
        if (issueId) {
            issueUrl = `/lightning/r/${issueId}/view`;
        }
        return { serviceType, serviceUrl, issueName, issueId, issueUrl };
    }
}
IntegrationService.register(new Salesforce());
