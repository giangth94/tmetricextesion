class Pipedrive {
    constructor() {
        this.showIssueId = false;
        this.matchUrl = /.*:\/\/.*.pipedrive.com(\/deal\/(\d+))/;
        this.observeMutations = true;
    }
    render(issueElement, linkElement) {
        let host = $$.visible('.dealDetails .actionsContent .stateActions');
        if (host) {
            let container = $$.create('span');
            container.classList.add('content', 'relatedItems');
            let span = $$.create('span');
            span.classList.add('relatedItem', 'devart-timer-link-pipedrive');
            span.appendChild(linkElement);
            container.appendChild(span);
            host.insertBefore(container, host.firstElementChild);
        }
    }
    getIssue(issueElement, source) {
        let matches = source.fullUrl.match(this.matchUrl);
        let issueId = matches[2];
        let issueName;
        let title = $$.visible('.dealDetails .descriptionHead .title');
        if (title) {
            issueName = title.textContent;
        }
        let serviceUrl = source.protocol + source.host;
        let issueUrl = matches[1];
        return { issueId, issueName, issueUrl, serviceUrl, serviceType: 'Pipedrive' };
    }
}
IntegrationService.register(new Pipedrive());
