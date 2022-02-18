class Assembla {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.matchUrl = '*://*.assembla.com/spaces/*';
        this.issueElementSelector = () => [$$('.v4-ticket-details') || $$('#tickets-show') || $$('#ticketDetailsContainer')];
    }
    render(issueElement, linkElement) {
        var host = $$('.ticket-fields', issueElement);
        if (host) {
            var linkContainer = $$.create('div', 'devart-timer-link-assembla');
            linkContainer.appendChild(linkElement);
            host.parentElement.insertBefore(linkContainer, host.nextElementSibling);
        }
    }
    getIssue(issueElement, source) {
        var match = /^\/spaces\/([^\/]+)\/.+$/.exec(source.path);
        if (!match) {
            return;
        }
        var issue = $$.getAttribute('h1 > .zeroclipboard', 'data-clipboard-text', issueElement);
        var issueId = issue.split(' - ')[0] ||
            $$.try('.ticket-info .ticket-number', issueElement).textContent;
        if (!issueId) {
            return;
        }
        var issueName = issue.split(' - ').slice(1).join(' - ') ||
            $$.try('#form-container .ticket-summary h1', issueElement).textContent;
        if (!issueName) {
            return;
        }
        var projectName = $$.try('h1.header-w > span').textContent ||
            $$.try('.navigation .nav-spaces .nav-item > a').textContent;
        var serviceType = 'Assembla';
        var serviceUrl = source.protocol + 'www.assembla.com';
        var issueUrl = 'spaces/' + match[1] + '/tickets/' + issueId.replace(/^[^\d]*/, '');
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}
IntegrationService.register(new Assembla());
