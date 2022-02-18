class MicrosofOutlookOnline {
    constructor() {
        this.showIssueId = false;
        this.matchUrl = [
            'https://outlook.live.com',
            'https://outlook.office.com'
        ];
        this.observeMutations = true;
        this.issueElementSelector = '#app';
    }
    render(issueElement, linkElement) {
        let container = $$('.ms-CommandBar-primaryCommand', issueElement);
        if (container) {
            linkElement.classList.add('devart-timer-link-microsoft-outlook-live');
            container.appendChild(linkElement);
        }
    }
    getIssue(issueElement, source) {
        let issueName = $$.try('[role=main] .allowTextSelection[role=heading]', issueElement).textContent;
        if (!issueName) {
            let issueNameInput = $$('.ms-TextField-field', issueElement);
            issueName = issueNameInput && issueNameInput.value;
        }
        if (!issueName) {
            return;
        }
        let serviceUrl = source.protocol + source.host;
        return { issueName, serviceUrl, serviceType: 'MicrosoftOutlookOnline' };
    }
}
IntegrationService.register(new MicrosofOutlookOnline());
