class Asana {
    constructor() {
        this.showIssueId = false;
        this.observeMutations = true;
        this.matchUrl = '*://app.asana.com/*/*';
        this.issueElementSelector = [
            '.SingleTaskPane, .SingleTaskPaneSpreadsheet',
            '.SubtaskTaskRow'
        ];
    }
    render(issueElement, linkElement) {
        if (issueElement.matches(this.issueElementSelector[0])) {
            const linkContainer = $$.create('div', 'devart-timer-link-asana');
            linkContainer.appendChild(linkElement);
            const toolbar = $$('.SingleTaskPaneToolbar', issueElement);
            if (toolbar) {
                toolbar.insertBefore(linkContainer, $$('.SingleTaskPaneToolbar-button', toolbar));
            }
        }
        if (issueElement.matches(this.issueElementSelector[1])) {
            const container = $$('.ItemRowTwoColumnStructure-right', issueElement);
            linkElement.classList.add('devart-timer-link-minimal', 'devart-timer-link-asana-subtask');
            container.insertBefore(linkElement, container.firstElementChild);
        }
    }
    getIssue(issueElement, source) {
        let description;
        const rootTaskPane = $$.closest(this.issueElementSelector[0], issueElement);
        if (!rootTaskPane) {
            return;
        }
        let issueName = $$.try('.SingleObjectTitleInput .simpleTextarea', rootTaskPane).value;
        let issuePath = source.path;
        if (issueElement.matches(this.issueElementSelector[1])) {
            description = $$.try('.SubtaskTaskRow textarea', issueElement).value;
            if (!description) {
                return;
            }
            const rootTask = $$('.TaskAncestry-ancestor a', rootTaskPane);
            if (rootTask) {
                issueName = rootTask.textContent;
                const match = /:\/\/[^\/]+(\/[^\?#]+)/.exec(rootTask.href);
                if (match) {
                    issuePath = match[1];
                }
            }
        }
        let issueId;
        let issueUrl;
        const match = /^\/\w+(?:\/search)?\/\d+\/(\d+)/.exec(issuePath);
        if (match) {
            issueId = '#' + match[1];
            issueUrl = '/0/0/' + match[1];
        }
        const projectName = $$.try('.TaskProjectToken-projectName').textContent ||
            $$.try('.TaskProjectPill-projectName, .TaskProjectToken-potTokenizerPill').textContent ||
            $$.try('.TaskAncestry-ancestorProject').textContent;
        const serviceType = 'Asana';
        const serviceUrl = source.protocol + source.host;
        const tagNames = $$.all('.TaskTags .Token, .TaskTags .TaskTagTokenPills-potPill').map(label => label.textContent);
        return { issueId, issueName, projectName, serviceType, description, serviceUrl, issueUrl, tagNames };
    }
}
IntegrationService.register(new Asana());
