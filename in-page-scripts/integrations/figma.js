class Figma {
    constructor() {
        this.matchUrl = 'https://www.figma.com/file/*';
        this.observeMutations = true;
        this.showIssueId = false;
    }
    render(issueElement, linkElement) {
        const toolbar = $$('[class*=toolbar_view--rightButtonGroup]');
        if (toolbar) {
            linkElement.classList.add('devart-timer-link-figma');
            toolbar.insertBefore(linkElement, toolbar.firstElementChild);
        }
    }
    getIssue(issueElement, source) {
        const fileName = $$.try('[class*=filename_view--title]').textContent;
        if (!fileName) {
            return;
        }
        const folderName = $$.try('[class*=filename_view--folderName]').textContent;
        const projectName = (!folderName || folderName == 'Drafts') ? fileName : `${folderName} / ${fileName}`;
        return {
            serviceType: 'Figma',
            serviceUrl: source.protocol + source.host,
            projectName,
        };
    }
}
IntegrationService.register(new Figma());
