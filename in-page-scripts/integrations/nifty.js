class Nifty {
    constructor() {
        this.matchUrl = '*://*.nifty.pm/*';
        this.issueElementSelector = [
            '.content-panel:not(.content-panel-subview)',
            '.content-panel .subtask-item:not(.new)'
        ];
        this.showIssueId = true;
        this.observeMutations = true;
    }
    getIssue(issueElement, source) {
        let description = '';
        if (issueElement.matches(this.issueElementSelector[1])) {
            description = $$.try('.item-title', issueElement).textContent;
            issueElement = $$.closest(this.issueElementSelector[0], issueElement);
        }
        const issueId = $$.try('.nice-id', issueElement).textContent;
        if (!issueId) {
            return;
        }
        const issueName = $$.try('.content-panel-field-input', issueElement).textContent;
        const serviceUrl = source.protocol + source.host;
        let projectId = '';
        let projectName = '';
        const projectPageMatch = source.path.match(/\/([^\/]+)\/(home|roadmap|task\/.+)/);
        if (projectPageMatch) {
            projectId = projectPageMatch[1];
            projectName = $$.try('.header-title h1').textContent;
        }
        const tasksPageMatch = source.path.match(/\/(my\/)?tasks/);
        if (tasksPageMatch) {
            const task = $$('.task-name', null, element => {
                return $$.all('.task-name-text, .task-task-name', element).some(element => {
                    return element.textContent.trim() == issueName.trim();
                });
            });
            if (task) {
                const project = $$('.task-project-name', task);
                if (project) {
                    projectId = $$.getRelativeUrl(serviceUrl, project.href);
                    projectName = project.textContent;
                }
            }
        }
        if (!projectId) {
            return;
        }
        const issueUrl = `${projectId}/task/${issueId}`;
        const tagNames = $$.all('.labels-list-item-text', issueElement).map(_ => _.textContent);
        return {
            issueId,
            issueName,
            issueUrl,
            description,
            projectName,
            serviceUrl,
            serviceType: 'Nifty',
            tagNames
        };
    }
    render(issueElement, linkElement) {
        if (issueElement.matches(this.issueElementSelector[0])) {
            const actions = $$('.content-panel-simple-actions', issueElement);
            if (actions) {
                linkElement.classList.add('devart-timer-link-minimal', 'content-panel-simple-action-inner');
                const container = $$.create('div', 'content-panel-simple-action');
                container.appendChild(linkElement);
                actions.appendChild(container);
            }
        }
        else {
            const actions = $$('.item-utils', issueElement);
            if (actions) {
                linkElement.classList.add('devart-timer-link-minimal', 'item-click-action', 'util');
                actions.insertBefore(linkElement, actions.firstElementChild);
            }
        }
    }
}
IntegrationService.register(new Nifty());
