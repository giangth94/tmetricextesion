class GoogleKeep {
    constructor() {
        this.showIssueId = false;
        this.matchUrl = '*://keep.google.com/*#*';
        this.issueElementSelector = [
            '.XKSfm-L9AdLc .CmABtb.RNfche',
            '.XKSfm-L9AdLc .IZ65Hb-yePe5c'
        ];
        this.observeMutations = true;
    }
    render(issueElement, linkElement) {
        linkElement.classList.add('devart-timer-link-minimal');
        if (issueElement.matches(this.issueElementSelector[0])) {
            linkElement.classList.add('devart-timer-link-google-keep-item');
            let btn = issueElement.querySelector('div[role="button"]:last-child');
            if (btn) {
                btn.parentElement.insertBefore(linkElement, btn);
            }
        }
        else if (issueElement.matches(this.issueElementSelector[1])) {
            linkElement.classList.add('devart-timer-link-google-keep-note');
            let toolbar = issueElement.querySelector('[role="toolbar"]');
            toolbar.appendChild(linkElement);
        }
    }
    getIssue(issueElement, source) {
        let issueName;
        let issueUrl;
        let issueId;
        let serviceUrl = source.protocol + source.host;
        if (issueElement.matches(this.issueElementSelector[0])) {
            issueName = $$.try('.notranslate', issueElement).textContent;
        }
        else if (issueElement.matches(this.issueElementSelector[1])) {
            let card = $$.closest('.XKSfm-L9AdLc', issueElement);
            if (card) {
                issueName = $$('.notranslate', card).textContent;
            }
            let matches = source.fullUrl.match(/\/#[a-zA-Z]+\/([\w\.-]+)$/);
            if (matches) {
                issueUrl = matches[0];
                issueId = matches[1];
            }
        }
        return { issueUrl, issueId, issueName, serviceUrl, serviceType: 'GoogleKeep' };
    }
}
IntegrationService.register(new GoogleKeep());
