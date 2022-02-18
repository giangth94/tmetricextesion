class UserVoiceTicket {
    constructor() {
        this.showIssueId = false;
        this.observeMutations = true;
        this.matchUrl = '*://*.uservoice.com/*/tickets/*';
        this.issueElementSelector = '.ticket';
    }
    render(issueElement, linkElement) {
        var ticketAnchor = $$('.actionbar-item.stretch');
        if (ticketAnchor) {
            var linkContainer = $$.create('div', 'actionbar-item');
            linkElement.classList.add('button', 'secondary', 'small', 'actionbar-link');
            linkContainer.appendChild(linkElement);
            ticketAnchor.parentNode.insertBefore(linkContainer, ticketAnchor.nextElementSibling);
        }
    }
    getIssue(issueElement, source) {
        var issueName = $$.try('.ticket-subject-header', issueElement).textContent;
        if (!issueName) {
            return;
        }
        var serviceType = 'UserVoice';
        var serviceUrl = source.protocol + source.host;
        var issueUrlElement = $$.try('.ticket-metadata a[href*="/tickets/"]', issueElement);
        var match = /^(.+\/tickets\/)(\d+).*$/.exec(issueUrlElement.href);
        if (match) {
            var issueId = '#' + match[2];
            var issueUrl = $$.getRelativeUrl(serviceUrl, issueUrlElement.href);
        }
        var projectName = '';
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}
class UserVoiceSuggestion {
    constructor() {
        this.showIssueId = false;
        this.observeMutations = true;
        this.matchUrl = '*://*.uservoice.com/*/suggestions/*';
    }
    render(issueElement, linkElement) {
        var suggestionAnchor = $$('.page-header-title:not(.inline)');
        if (suggestionAnchor) {
            var linkContainer = $$.create('div', 'pull-right');
            linkElement.classList.add('button', 'secondary');
            linkContainer.appendChild(linkElement);
            suggestionAnchor.parentNode.insertBefore(linkContainer, suggestionAnchor);
        }
    }
    getIssue(issueElement, source) {
        var match = /^(\/.+\/suggestions\/)(\d+).*$/.exec(source.path);
        if (!match) {
            return;
        }
        var lastChild = $$.try('.page-header-title:not(.inline)').lastChild;
        var issueName = lastChild && lastChild.textContent.trim();
        if (!issueName) {
            return;
        }
        var issueId = '#' + match[2];
        var serviceType = 'UserVoice';
        var serviceUrl = source.protocol + source.host;
        var issueUrl = match[1] + match[2];
        var projectName = '';
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}
IntegrationService.register(new UserVoiceTicket());
IntegrationService.register(new UserVoiceSuggestion());
