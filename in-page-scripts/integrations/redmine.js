class Redmine {
    constructor() {
        this.showIssueId = true;
        this.matchUrl = '*://*/issues/*';
        this.issueElementSelector = 'body.controller-issues.action-show';
    }
    render(issueElement, linkElement) {
        var host = $$('#content .contextual');
        if (host) {
            host.appendChild(linkElement);
        }
    }
    getIssue(issueElement, source) {
        const issuesPath = '/issues/';
        var i = source.path.lastIndexOf(issuesPath);
        var path = source.path.substr(0, i);
        var serviceUrl = source.protocol + source.host + path;
        var issueIdMatch = /\d+/.exec(source.path.substring(i + issuesPath.length));
        if (!issueIdMatch) {
            return;
        }
        var issueId = issueIdMatch[0];
        var issueUrl = issuesPath + issueId;
        issueId = '#' + issueId;
        var issueName = $$.try('.subject h3').textContent;
        if (!issueName) {
            return;
        }
        var projectName = $$.try('h1').textContent;
        if (projectName) {
            i = projectName.lastIndexOf('»');
            if (i >= 0) {
                projectName = projectName.substring(i + 1);
            }
        }
        var serviceType = 'Redmine';
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}
IntegrationService.register(new Redmine());
