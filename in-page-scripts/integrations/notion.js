class Notion {
    constructor() {
        this.showIssueId = false;
        this.observeMutations = true;
        this.matchUrl = 'https://www.notion.so/*';
        this.issueElementSelector = ['.notion-frame', '.notion-default-overlay-container'];
    }
    render(issueElement, linkElement) {
        const shareBtn = $$('.notion-topbar-share-menu', issueElement);
        if (shareBtn) {
            linkElement.classList.add('devart-timer-link-notion');
            shareBtn.before(linkElement);
        }
    }
    getIssue(issueElement, source) {
        let issueId, issueName, issueUrl;
        const titleEl = $$('.notion-page-block > div', issueElement);
        if (titleEl) {
            issueName = titleEl.textContent || titleEl.getAttribute('placeholder');
            const idAttr = titleEl.parentElement.getAttribute('data-block-id');
            issueId = idAttr && idAttr.replace(/-/g, '');
            issueUrl = issueId;
        }
        const serviceUrl = source.protocol + source.host;
        return { issueId, issueName, issueUrl, serviceUrl, serviceType: 'Notion' };
    }
}
IntegrationService.register(new Notion());
