class Monday {
    constructor() {
        this.showIssueId = false;
        this.observeMutations = true;
        this.matchUrl = 'https://*.monday.com/*';
        this.issueElementSelector = [
            '.pulse-component-wrapper',
            '.slide-panel-content',
            '#pulse-card-dialog-component'
        ];
        document.addEventListener('click', this.saveClickedElement);
    }
    saveClickedElement(event) {
        Monday._lastClickedElement = event.target;
    }
    render(issueElement, linkElement) {
        if (issueElement.matches(this.issueElementSelector[0])) {
            const nameComponent = $$('[id$=-name].col-identifier-name .name-cell-component', issueElement);
            if (nameComponent) {
                const div = $$.create('div', 'devart-timer-link-monday-icon');
                linkElement.lastElementChild.textContent = '';
                div.appendChild(linkElement);
                nameComponent.lastChild.before(div);
            }
        }
        if (issueElement.matches(this.issueElementSelector[1])) {
            const updateTab = $$.all('#pulse-content > .tab', issueElement)[0];
            if (updateTab) {
                const div = $$.create('div', 'devart-timer-link-monday-slide-panel');
                div.appendChild(linkElement);
                updateTab.firstChild.after(div);
            }
        }
        if (issueElement.matches(this.issueElementSelector[2])) {
            const container = $$.try('.top-actions-container', issueElement);
            linkElement.classList.add('devart-timer-link-monday-card-dialog');
            container.firstChild.before(linkElement);
        }
    }
    getIssue(issueElement, source) {
        let issueName;
        let issueId;
        let issueUrl;
        let projectName = $$.try('.board-header-main .board-name').textContent;
        if (issueElement.matches(this.issueElementSelector[0])) {
            const colName = $$('[id$=-name].col-identifier-name', issueElement);
            if (colName) {
                issueName = $$.try('.ds-text-component', colName).textContent;
                const match = colName.id.match(/focus-(\d+)-name/);
                issueId = match && match[1];
                issueUrl = this.createIssueUrl(source.path, issueId);
            }
        }
        if (issueElement.matches(this.issueElementSelector[1])) {
            issueName = $$.try('.title-wrapper', issueElement).textContent;
            const isSubItem = $$('.title-wrapper .with-subitem', issueElement);
            if (isSubItem) {
                if (Monday._lastClickedElement) {
                    const task = $$.closest('.pulse-component-wrapper.subitem-pulse.subitem .pulse-component', Monday._lastClickedElement);
                    if (task) {
                        const match = task.id.match(/pulse-(\d+)/);
                        issueId = match && match[1];
                        issueUrl = this.createIssueUrl(source.path, issueId);
                    }
                }
            }
            else {
                issueId = this.getIssueIdByUrlPath(source.path);
                issueUrl = source.path;
            }
        }
        if (issueElement.matches(this.issueElementSelector[2])) {
            issueName = $$.try('.pulse-name-value', issueElement).textContent;
            projectName = $$.try('.open-pulse-in-board-link').textContent;
            if (Monday._lastClickedElement) {
                const task = $$.closest('.deadline-task-component-content', Monday._lastClickedElement);
                if (task) {
                    const link = $$('.pulse-name-wrapper > a', task);
                    issueId = this.getIssueIdByUrlPath(link.pathname);
                    issueUrl = link.pathname;
                }
            }
            if (!issueId) {
                {
                    const boardPath = $$.try('.open-pulse-in-board-link', issueElement).pathname;
                    const links = $$.all(`.pulse-name-wrapper a[href*="${boardPath}"]`);
                    const link = links.find(link => link.textContent == issueName);
                    if (link) {
                        issueId = this.getIssueIdByUrlPath((link).pathname);
                        issueUrl = link.pathname;
                    }
                }
            }
        }
        const serviceUrl = source.protocol + source.host;
        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Monday' };
    }
    getIssueIdByUrlPath(url) {
        const matches = url.match(/pulses\/(\d+)/);
        return matches ? matches[1] : null;
    }
    createIssueUrl(sourcePath, id) {
        const match = sourcePath.match(/boards\/\d+/);
        const path = match && match[0];
        return id && `${path}/pulses/${id}`;
    }
}
IntegrationService.register(new Monday());
