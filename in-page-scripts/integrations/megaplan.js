class Megaplan {
    constructor() {
        this.showIssueId = false;
        this.observeMutations = true;
        this.matchUrl = /(.*megaplan.*)\/(task|project|event|crm|deals)(?:.*\/Task)?\/(\d+)/;
    }
    render(issueElement, linkElement) {
        let container = $$.try('Button[data-name=favorite], .favorite-icon-normal').parentElement;
        if (container) {
            container.insertBefore(linkElement, container.firstElementChild);
        }
    }
    getIssue(issueElement, source) {
        let projectName = $$.try('a.CLink', null, (_) => /\/project\/\d/.test(_.href)).textContent;
        let match = source.fullUrl.match(this.matchUrl);
        let serviceUrl = match[1];
        let issueType = match[2];
        let issueNumber = match[3];
        let serviceType = 'Megaplan';
        let issueName = document.title;
        let issueUrl = `/${issueType}/${issueNumber}/card/`;
        let issueId = '#' + issueNumber;
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}
IntegrationService.register(new Megaplan());
