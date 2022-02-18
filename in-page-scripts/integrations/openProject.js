class OpenProject {
    constructor() {
        this.showIssueId = true;
        this.matchUrl = /(https?:\/\/[^\/]+).*\/work_packages\/\D*(\d+)/;
        this.observeMutations = true;
    }
    render(issueElement, linkElement) {
        const detailedView = $$('.work-package--single-view');
        if (detailedView) {
            const infoWrapper = $$('.wp-info-wrapper');
            if (infoWrapper) {
                const container = $$.create('div');
                container.classList.add('devart-timer-link-openproject-container');
                container.appendChild(linkElement);
                detailedView.insertBefore(container, infoWrapper.nextElementSibling);
            }
        }
    }
    getIssue(issueElement, source) {
        const match = source.fullUrl.match(this.matchUrl);
        const serviceUrl = $$.try('base').href || match[1];
        const issueUrl = '/work_packages/' + match[2];
        const issueId = '#' + match[2];
        const issueName = $$.try('.work-packages--subject-type-row span.subject').textContent;
        const projectName = $$.try('#projects-menu').textContent ||
            $$.try('.-project-context span a').textContent;
        const serviceType = 'OpenProject';
        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType };
    }
}
IntegrationService.register(new OpenProject());
