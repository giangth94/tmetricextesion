class PivotalTracker {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.matchUrl = '*://www.pivotaltracker.com/*';
        this.issueElementSelector = '.story .model_details';
    }
    render(issueElement, linkElement) {
        var host = $$('aside > .wrapper', issueElement);
        if (host) {
            let linkContainer = $$.create('div', 'devart-timer-link-pivotaltracker');
            linkContainer.appendChild(linkElement);
            host.appendChild(linkContainer);
        }
    }
    getIssue(issueElement, source) {
        var issueId = $$.try('.text_value', issueElement).value;
        if (!issueId) {
            return;
        }
        var issueName = $$.try('.name textarea', issueElement).textContent;
        if (!issueName) {
            return;
        }
        var projectName;
        var projectLinks = $$.all('.project > h2 > a');
        if (projectLinks.length == 1) {
            projectName = projectLinks[0].textContent;
        }
        if (!projectName) {
            if ($$('.sidebar_content .projects')) {
                let panel = $$.closest('.panel', issueElement);
                if (panel) {
                    let panelType = panel.getAttribute('data-type');
                    if (panelType && panelType != 'search' && panelType != 'my_work') {
                        projectName = $$.try('[class^="tn-PanelHeader__heading"]', panel).textContent;
                    }
                }
            }
            else {
                projectName = $$.try('.raw_context_name').textContent;
            }
        }
        var serviceType = 'PivotalTracker';
        var serviceUrl = source.protocol + source.host;
        var issueUrl = '/story/show/' + issueId.substring(1);
        let closestContainer = $$.closest('.story', issueElement);
        let tagNames = $$.all('.labels_container.full div[data-aid="Label__Name"]', closestContainer).map(label => label.textContent);
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames };
    }
}
IntegrationService.register(new PivotalTracker());
