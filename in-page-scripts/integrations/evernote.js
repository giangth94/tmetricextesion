class Evernote {
    constructor() {
        this.matchUrl = '*://www.evernote.com/client/*';
        this.issueElementSelector = '#qa-NOTE_HEADER';
        this.showIssueId = false;
        this.observeMutations = true;
    }
    render(issueElement, linkElement) {
        let div = $$.create('div');
        div.classList.add('devart-timer-link-evernote');
        div.appendChild(linkElement);
        let separator = $$.create('div', '_3QvRa8NWQ7oFT2wasqKjdo');
        div.appendChild(separator);
        issueElement.lastChild.before(div);
    }
    getIssue(issueElement, source) {
        const isIFrame = (input) => input !== null && input.tagName === 'IFRAME';
        let frame = $$.try('#qa-COMMON_EDITOR_IFRAME');
        if (isIFrame(frame) && frame.contentDocument) {
            var issueName = $$.try('en-noteheader textarea', frame.contentDocument).value;
            if (!issueName) {
                issueName = $$.try('[data-testid=view-only-title]', frame.contentDocument).textContent;
            }
        }
        let projectName = $$.try('#qa-NOTE_PARENT_NOTEBOOK_BTN', issueElement).textContent;
        let issueId = $$.searchParams(location.hash)['n'];
        let issueUrl = issueId && `${source.path}#?n=${issueId}`;
        let serviceUrl = source.protocol + source.host;
        return { issueName, issueId, issueUrl, projectName, serviceUrl, serviceType: 'Evernote' };
    }
}
IntegrationService.register(new Evernote());
