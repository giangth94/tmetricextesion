class Generic {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.issueElementSelector = '.tmetric-button';
    }
    match(source) {
        return !!$$('.tmetric-button');
    }
    render(issueElement, linkElement) {
        issueElement.appendChild(linkElement);
    }
    getIssue(issueElement, source) {
        let issueId = issueElement.getAttribute('data-issue-id');
        let issueName = issueElement.getAttribute('data-issue-name');
        let serviceUrl = issueElement.getAttribute('data-service-url');
        let issueUrl = issueElement.getAttribute('data-issue-url');
        let projectName = issueElement.getAttribute('data-project-name');
        let tagNames;
        let tagNamesAttribute = issueElement.getAttribute('data-tag-names');
        if (tagNamesAttribute) {
            tagNames = tagNamesAttribute.split(',');
        }
        return {
            issueId,
            issueName,
            issueUrl,
            projectName,
            serviceUrl,
            serviceType: 'Generic',
            tagNames
        };
    }
}
IntegrationService.register(new Generic());
