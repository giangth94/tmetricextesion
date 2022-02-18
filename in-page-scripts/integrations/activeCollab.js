class ActiveCollab {
    constructor() {
        this.matchUrl = '*://*/projects/*';
        this.showIssueId = true;
        this.observeMutations = true;
        this.issueElementSelector = [
            '.object_view'
        ];
    }
    render(issueElement, linkElement) {
        let host = $$('div.object_view_sidebar');
        if (host) {
            let newdiv = $$.create('div', 'page_section', 'with_padding');
            newdiv.appendChild(linkElement);
            host.appendChild(newdiv);
        }
    }
    getIssue(issueElement, source) {
        let issueName = $$.try('#project_task .task_name').textContent;
        if (!issueName) {
            return;
        }
        let issueId = $$.try('#project_task span[ng-bind="task.task_number"]').textContent;
        if (issueId) {
            issueId = '#' + issueId;
        }
        let projectName = $$.try('#project_task a[data-qa-id="task-project-label-name"]').textContent;
        let serviceUrl = source.protocol + source.host;
        let serviceType = 'ActiveCollab';
        let issueUrl;
        if (issueId && projectName) {
            issueUrl = $$.getRelativeUrl(serviceUrl, source.fullUrl);
        }
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}
IntegrationService.register(new ActiveCollab());
