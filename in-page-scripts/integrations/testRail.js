class TestRail {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.matchUrl = '*://*/index.php?/runs/view/*';
    }
    render(issueElement, linkElement) {
        let buttons = $$('.button-group.form-buttons');
        if (buttons) {
            linkElement.classList.add('button', 'button-left', 'devart-timer-link-test-rail');
            buttons.appendChild(linkElement);
        }
    }
    getIssue(issueElement, source) {
        let issueName = $$.try('.link-tooltip.content-header-title-tooltip').textContent;
        let projectName = $$.try('.top-section.top-section-with-return.text-ppp a').textContent;
        let serviceUrl = source.protocol + source.host;
        return { issueName, projectName, serviceUrl, serviceType: 'TestRail' };
    }
}
IntegrationService.register(new TestRail());
