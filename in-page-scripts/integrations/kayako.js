class Kayako {
    constructor() {
        this.showIssueId = true;
        this.matchUrl = '*://*/agent/conversations/*';
        this.issueElementSelector = '.ko-case-content';
        this.observeMutations = true;
    }
    render(issueElement, linkElement) {
        const container = issueElement.querySelector('[class^="ko-tabs__tabs_"] [class^="ko-tabs__right_"]');
        if (!container) {
            return;
        }
        const existing = container.querySelector('.devart-timer-link');
        if (existing) {
            return;
        }
        container.appendChild(linkElement);
    }
    getIssue(issueElement, source) {
        return {
            issueId: this.getIssueId(issueElement),
            issueName: this.getIssueName(issueElement),
            serviceType: 'Kayako',
            serviceUrl: source.protocol + source.host,
            issueUrl: source.path,
        };
    }
    getIssueId(issueElement) {
        return issueElement
            .querySelector(' [class^="ko-tabs__tabs_"] div[class^="ko-case-content__id"]')
            .textContent
            .replace(/^[\W#]+/, '');
    }
    getIssueName(issueElement) {
        return issueElement.querySelector('[class^="ko-tabs_case__subject_"]').textContent.trim();
    }
}
IntegrationService.register(new Kayako());
