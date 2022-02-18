class Dixa {
    constructor() {
        this.showIssueId = true;
        this.matchUrl = [
            '*://*.dixa.com/conversation/*'
        ];
        this.observeMutations = true;
    }
    getIssue(issueElement, source) {
        const getTitle = () => {
            const title = $$.try('.conversation-view__main [class^=conversationHeader__] [class^=headline__] p').textContent;
            return title;
        };
        const getConversationId = () => {
            const csid = $$.try('.conversation-view__main button span').textContent;
            return csid;
        };
        const getProject = () => {
            const subdomain = source.host.replace(".dixa.com", "");
            return subdomain;
        };
        const issueId = getConversationId();
        const issueName = getTitle();
        const projectName = getProject();
        const serviceType = 'Dixa';
        const serviceUrl = source.protocol + source.host;
        const issueUrl = source.path;
        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType };
    }
    render(issueElement, linkElement) {
        const host = $$.visible('.conversation-view__main [class^=conversationHeader__] [class^=topActions__] [class^=root__]');
        if (host) {
            linkElement.classList.add('devart-timer-link-dixa');
            host.appendChild(linkElement);
        }
    }
}
IntegrationService.register(new Dixa());
