class PodioTask {
    constructor() {
        this.showIssueId = false;
        this.matchUrl = '*://podio.com/tasks/*';
        this.observeMutations = true;
    }
    render(issueElement, linkElement) {
        let taskHeader = $$('.task-header .action-bar ul');
        if (taskHeader) {
            let container = $$.create('li', 'float-left', 'devart-timer-link-podio');
            container.appendChild(linkElement);
            taskHeader.appendChild(container);
        }
    }
    getIssue(issueElement, source) {
        let issueName = $$.try('.task-title > .header-title').textContent;
        if (!issueName) {
            return;
        }
        let issueUrl;
        let issueId;
        let matches = source.path.match(/^\/tasks\/(\d+)/);
        if (matches) {
            issueUrl = matches[0];
            issueId = matches[1];
        }
        let projectName = $$.try('.reference .title').textContent;
        let serviceUrl = source.protocol + source.host;
        return { issueId, issueName, issueUrl, serviceUrl, projectName, serviceType: 'Podio' };
    }
}
class PodioTaskList {
    constructor() {
        this.showIssueId = false;
        this.matchUrl = '*://podio.com*/tasks';
        this.observeMutations = true;
        this.issueElementSelector = '.task-wrapper';
    }
    render(issueElement, linkElement) {
        let rightColumn = $$('.task-right-column', issueElement);
        if (rightColumn) {
            let container = $$.create('div', 'task-via');
            container.appendChild(linkElement);
            rightColumn.insertBefore(container, rightColumn.lastElementChild);
        }
    }
    getIssue(issueElement, source) {
        let issueName = $$.try('.edit-task-title', issueElement).textContent;
        if (!issueName) {
            return;
        }
        let projectName = $$.try('.edit-task-title + .linked-item', issueElement).textContent;
        let issueUrl;
        let issueId;
        let href = $$.try('.task-link', issueElement).href || '';
        let matches = href.match(/\/tasks\/(\d+)/);
        if (matches) {
            issueUrl = matches[0];
            issueId = matches[1];
        }
        let serviceUrl = source.protocol + source.host;
        return { issueId, issueName, issueUrl, serviceUrl, projectName, serviceType: 'Podio' };
    }
}
class PodioAppItem {
    constructor() {
        this.showIssueId = false;
        this.matchUrl = '*://podio.com/*/apps/*';
        this.observeMutations = true;
        this.issueElementSelector = '.item-topbar';
    }
    render(issueElement, linkElement) {
        let actionBar = $$('.action-bar ul', issueElement);
        if (actionBar) {
            let container = $$.create('li', 'float-left', 'devart-timer-link-podio');
            container.appendChild(linkElement);
            actionBar.insertBefore(container, actionBar.firstElementChild);
        }
    }
    getIssue(issueElement, source) {
        let projectName = $$.try('.breadcrumb .item-title', issueElement).textContent;
        return { projectName };
    }
}
IntegrationService.register(new PodioTask(), new PodioTaskList(), new PodioAppItem());
