class Wrike {
    constructor() {
        this.showIssueId = false;
        this.observeMutations = true;
        this.matchUrl = '*://*.wrike.com/workspace.htm*';
        this.issueElementSelector = '.wspace-task-view, .task-view';
    }
    render(issueElement, linkElement) {
        const host = $$('.task-view-header__actions', issueElement);
        if (host) {
            linkElement.classList.add('devart-timer-link-wrike');
            host.insertBefore(linkElement, host.firstElementChild);
        }
    }
    getIssue(issueElement, source) {
        const issueName = $$.try('textarea.title-field, textarea.title__field', issueElement).value;
        if (!issueName) {
            return;
        }
        const issueTags = $$.all('.wspace-task-widgets-tags-dataview > div, .task-tags .tag-text', issueElement);
        const projectName = issueTags.length == 1 ? issueTags[0].textContent : null;
        const params = $$.searchParams(document.location.hash);
        let issueId = params['t']
            || params['ot'];
        const inboxMatch = document.location.hash && document.location.hash.match(/#\/inbox\/task\/(\d+)/);
        if (inboxMatch) {
            issueId = inboxMatch[1];
        }
        const isOverview = params['path'] == 'overview';
        if (!issueId && isOverview) {
            const foundIdentifiers = $$.all('wrike-task-list-task')
                .map(task => {
                if ($$('.task-block wrike-task-title', task).textContent == issueName) {
                    return task.getAttribute('data-id');
                }
            })
                .filter((item, index, array) => !!item &&
                array.indexOf(item) == index);
            if (foundIdentifiers.length == 1) {
                issueId = foundIdentifiers[0];
            }
        }
        let issueUrl;
        if (issueId) {
            issueUrl = '/open.htm?id=' + issueId;
            issueId = '#' + issueId;
        }
        const serviceType = 'Wrike';
        const serviceUrl = source.protocol + source.host;
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}
IntegrationService.register(new Wrike());
