class Hubspot {
    constructor() {
        this.showIssueId = false;
        this.observeMutations = true;
        this.matchUrl = 'https://*.hubspot.com/*';
        this.issueElementSelector = [
            '.private-panel__container',
            '[data-selenium-test="timeline-card"]'
        ];
    }
    render(issueElement, linkElement) {
        linkElement.classList.add('private-button', 'private-button--default', 'devart-timer-link-text-only');
        if (issueElement.matches(this.issueElementSelector[0])) {
            const taskForm = $$('[data-selenium-test="task-form"]', issueElement);
            if (taskForm) {
                linkElement.classList.add('private-button--secondary');
                taskForm.firstChild.before(linkElement);
            }
        }
        if (issueElement.matches(this.issueElementSelector[1])) {
            const taskBody = $$('.uiList.private-list--inline', issueElement);
            if (taskBody) {
                linkElement.classList.add('private-button--tertiary-light');
                const li = $$.create('li');
                li.classList.add('devart-timer-link-hubspot-li');
                li.append(linkElement);
                taskBody.append(li);
            }
        }
    }
    getIssue(issueElement, source) {
        let issueName;
        let issueId;
        let issueUrl;
        let accountId;
        if (issueElement.matches(this.issueElementSelector[0])) {
            const taskSubject = $$('[data-field="hs_task_subject"]', issueElement);
            if (taskSubject) {
                issueName = taskSubject.value;
            }
            const match = source.path.match(/tasks\/(\d+)\/view\/[^\/]+\/task\/(\d+)/);
            accountId = match && match[1];
            issueId = match && match[2];
        }
        else if (issueElement.matches(this.issueElementSelector[1])) {
            issueName = $$.try('[data-selenium-test="timeline-editable-title"]', issueElement).textContent;
            const actionsBtn = $$('[data-selenium-test="timeline-header-actions"]', issueElement);
            issueId = actionsBtn && actionsBtn.dataset.seleniumId;
            const match = issueId && source.path.match(/contacts\/(\d+)\//);
            accountId = match && match[1];
        }
        if (accountId && issueId) {
            issueUrl = `tasks/${accountId}/view/all/task/${issueId}`;
        }
        const serviceUrl = source.protocol + source.host;
        return { issueId, issueName, issueUrl, serviceUrl, serviceType: 'HubSpot' };
    }
}
IntegrationService.register(new Hubspot());
