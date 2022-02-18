class Producteev {
    constructor() {
        this.showIssueId = false;
        this.observeMutations = true;
        this.matchUrl = [
            '*://*producteev.com/workspace/t/*'
        ];
        this.issueElementSelector = [
            '.td-content > .title',
            '.td-attributes ul.subtasks-list li'
        ];
    }
    render(issueElement, linkElement) {
        if (issueElement.matches(this.issueElementSelector[0])) {
            linkElement.classList.add('devart-timer-link-producteev');
            issueElement.appendChild(linkElement);
        }
        else if (issueElement.matches(this.issueElementSelector[1])) {
            linkElement.classList.add('devart-timer-link-minimal', 'devart-timer-link-producteev-minimal');
            issueElement.insertBefore(linkElement, issueElement.querySelector('.close'));
        }
    }
    getIssue(issueElement, source) {
        let match = /^\/workspace\/t\/(\w+)(\/calendar|\/activity)?$/.exec(source.path);
        if (!match) {
            return;
        }
        let contentElement = issueElement.closest('.td-content');
        if (!contentElement) {
            return;
        }
        let issueId = match[1];
        let issueName = $$.try('.title-header .title', contentElement).textContent;
        let projectName = $$.try('.dropdown-project .title').textContent;
        let serviceType = 'Producteev';
        let serviceUrl = source.protocol + 'www.producteev.com';
        let issueUrl = '/workspace/t/' + issueId;
        let description;
        if (issueElement.matches(this.issueElementSelector[1])) {
            description = $$.try('.title', issueElement).textContent;
        }
        return { issueId, issueName, description, projectName, serviceType, serviceUrl, issueUrl };
    }
}
IntegrationService.register(new Producteev());
