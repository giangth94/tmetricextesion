class EasyRedmine {
    constructor() {
        this.showIssueId = true;
        this.matchUrl = /(.*)\/(issues|easy_crm_cases|test_cases)\/(\d+)/;
        this.issueElementSelector = [
            'body.controller-issues.action-show',
            'body.controller-easy_crm_cases.action-show',
            'body.controller-test_cases.action-show'
        ];
    }
    match(source) {
        return $$.getAttribute('meta[name=application-name]', 'content') == 'Easy Redmine';
    }
    render(issueElement, linkElement) {
        var title = $$('#content h2', issueElement);
        if (title) {
            linkElement.classList.add('devart-timer-link-easy-redmine');
            title.parentElement.insertBefore(linkElement, title.nextElementSibling);
        }
    }
    getIssue(issueElement, source) {
        var match = this.matchUrl.exec(source.fullUrl);
        if (!match) {
            return;
        }
        var serviceUrl = match[1];
        var issueUrl = match[2] + '/' + match[3];
        var issueId = '#' + match[3];
        var issueName = $$.try('#content h2', issueElement).textContent;
        if (!issueName) {
            return;
        }
        var projectName = $$.try('h1 .self', issueElement).textContent;
        var serviceType = 'Redmine';
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}
IntegrationService.register(new EasyRedmine());
