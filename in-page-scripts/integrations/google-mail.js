class GoogleMail {
    constructor() {
        this.showIssueId = false;
        this.matchUrl = '*://mail.google.com/mail/*';
        this.observeMutations = true;
    }
    render(issueElement, linkElement) {
        let taskHeader = $$('.ha');
        if (taskHeader) {
            linkElement.classList.add('devart-timer-link-google-mail');
            taskHeader.appendChild(linkElement);
        }
    }
    getIssue(issueElement, source) {
        let issueName = $$.try('.ha h2').textContent;
        if (!issueName) {
            return;
        }
        let projectName = $$.try('.ha:last-of-type .hN').textContent;
        let serviceUrl = source.protocol + source.host;
        return { issueName, projectName, serviceUrl, serviceType: 'Gmail' };
    }
}
IntegrationService.register(new GoogleMail());
