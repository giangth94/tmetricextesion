class OldFreshdesk {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.matchUrl = '*://*/helpdesk/tickets/*';
    }
    render(issueElement, linkElement) {
        let host = $$('.ticket-actions > ul');
        if (host) {
            linkElement.classList.add('btn');
            let container = $$.create('li', 'ticket-btns');
            container.appendChild(linkElement);
            host.appendChild(container);
        }
    }
    getIssue(issueElement, source) {
        let issueName = $$.try('.subject').textContent;
        let issueUrl;
        let issueId = $$.try('#ticket-display-id').textContent;
        if (issueId) {
            issueId = issueId.replace('#', '');
            issueUrl = '/a/tickets/' + issueId;
        }
        let serviceUrl = source.protocol + source.host;
        let projectName = $$.try('.default_product .select2-chosen').textContent;
        if (projectName === '...') {
            projectName = '';
        }
        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Freshdesk' };
    }
}
class NewFreshdesk {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.matchUrl = '*://*/a/tickets/*';
    }
    render(issueElement, linkElement) {
        let host = $$('.page-actions__left');
        if (host) {
            linkElement.classList.add('app-icon-btn', 'app-icon-btn--text', 'devart-timer-link-freshdesk');
            host.appendChild(linkElement);
        }
    }
    getIssue(issueElement, source) {
        let issueName = $$.try('.ticket-subject-heading').textContent;
        let issueId;
        let issueUrl;
        let matches = source.path.match(/\/a\/tickets\/(\d+)/);
        if (matches) {
            issueUrl = matches[0];
            issueId = matches[1];
        }
        let serviceUrl = source.protocol + source.host;
        let projectName;
        let projectLabel = $$('.label-field', null, label => ['Product'].indexOf(label.textContent) >= 0);
        if (projectLabel) {
            let projectElement = $$('.ember-power-select-selected-item', projectLabel.parentElement);
            projectName = projectElement && projectElement.textContent.trim();
        }
        if (projectName === '--') {
            projectName = '';
        }
        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Freshdesk' };
    }
}
IntegrationService.register(new OldFreshdesk(), new NewFreshdesk());
