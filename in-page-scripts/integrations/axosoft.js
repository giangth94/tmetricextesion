class Axosoft {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.matchUrl = '*://*.axosoft.com/*';
        this.issueElementSelector = '.item-form-body';
        this.issueTypes = {
            'Bug': 'defects',
            'Feature': 'features',
            'Ticket': 'incidents',
            'Work Item': 'features'
        };
    }
    render(issueElement, linkElement) {
        let host = $$('.item-field-id', issueElement);
        if (host) {
            linkElement.classList.add('devart-timer-link-axosoft');
            host.parentElement.insertBefore(linkElement, host.nextElementSibling);
        }
    }
    getIssue(issueElement, source) {
        let issueName = $$.try('.item-field-name input', issueElement).value ||
            $$.try('.item-field-name', issueElement).textContent;
        if (!issueName) {
            return;
        }
        let projectNameCell = $$.all('.item-field-table .item-field-row > div', issueElement).filter(div => {
            return $$.try('.item-field-label', div).textContent == 'Project:';
        })[0];
        let projectNameField = projectNameCell && $$('.field', projectNameCell);
        if (projectNameField) {
            var projectName = $$.try('input', projectNameField).value
                || projectNameField.textContent;
        }
        let serviceType = 'Axosoft';
        let serviceUrl = source.protocol + source.host;
        let issueId = $$.try('.item-field-id').textContent;
        if (issueId) {
            let issueType = this.issueTypes[$$.try('.form-subtitle').textContent] || this.issueTypes.Feature;
            var issueUrl = '/viewitem?id=' + issueId + '&type=' + issueType;
            if (/^\d+$/.test(issueId))
                issueId = '#' + issueId;
        }
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}
IntegrationService.register(new Axosoft());
