class DoitIm {
    constructor() {
        this.showIssueId = false;
        this.observeMutations = true;
        this.matchUrl = new RegExp(`(https://i.doit.im)(/home/#/[a-z]+/([a-z0-9\-]+))`);
        this.issueElementSelector = () => [$$.visible('.task-view, #project_info, #goal_info')];
    }
    render(issueElement, linkElement) {
        let toolbar = $$('li.task-op, li.project-op, li.goal-op', issueElement);
        if (toolbar) {
            linkElement.classList.add('btn-4');
            toolbar.insertBefore(linkElement, toolbar.firstChild);
        }
    }
    getIssue(issueElement, source) {
        let matches = source.fullUrl.match(this.matchUrl);
        let serviceUrl = matches[1];
        let issueUrl = matches[2];
        let issueId = matches[3];
        let issueName = $$.try('span.title', issueElement).textContent;
        let projectElement = $$.visible('.project, .goal', issueElement);
        let projectName = projectElement && projectElement.textContent.replace(/^[#@]/, '');
        let tagNames = $$.all('.tags .tag', issueElement).map(_ => _.textContent);
        return { issueId, issueName, issueUrl, serviceUrl, projectName, tagNames, serviceType: 'Doit.im' };
    }
}
IntegrationService.register(new DoitIm());
