class Trello {
    constructor() {
        this.showIssueId = true;
        this.matchUrl = '*://trello.com/c/*';
        this.issueElementSelector = [
            '.window-sidebar > .window-module:last-of-type',
            '.checklist-item-details'
        ];
        this.observeMutations = true;
    }
    render(issueElement, linkElement) {
        if (issueElement.matches(this.issueElementSelector[0])) {
            const text = linkElement.lastElementChild.textContent;
            if (/[0-9]/.test(text)) {
                linkElement.lastElementChild.textContent = text.replace(' timer', '');
            }
            linkElement.classList.add('trello');
            linkElement.classList.add('button-link');
            issueElement.insertBefore(linkElement, $$('h3 ~ *', issueElement));
        }
        else if (issueElement.matches(this.issueElementSelector[1])) {
            const wrapper = $$('.checklist-item-controls', issueElement);
            if (wrapper) {
                linkElement.classList.add('devart-timer-link-minimal', 'devart-timer-link-trello');
                wrapper.appendChild(linkElement);
            }
        }
    }
    getIssue(issueElement, source) {
        const match = /^\/c\/(.+)\/(\d+)-(.+)$/.exec(source.path);
        if (!match) {
            return;
        }
        let issueId = match[2];
        if (!issueId) {
            return;
        }
        issueId = '#' + issueId;
        const issueName = $$.try('.window-title h2').textContent;
        if (!issueName) {
            return;
        }
        const projectName = $$.try('.board-header-btn > .board-header-btn-text').textContent;
        const serviceUrl = source.protocol + source.host;
        const issueUrl = '/c/' + match[1];
        const tagNames = $$.all('.js-card-detail-labels-list .card-label').map(label => label.textContent);
        let description;
        if (issueElement.matches(this.issueElementSelector[1])) {
            description = $$.try('.checklist-item-details-text', issueElement).textContent;
        }
        return { issueId, issueName, projectName, serviceType: 'Trello', serviceUrl, issueUrl, tagNames, description };
    }
}
IntegrationService.register(new Trello());
