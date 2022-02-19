class Clickup {
    constructor() {
        this.showIssueId = false;
        this.observeMutations = true;
        this.matchUrl = ['*://app.clickup.com', '*://spiderbox.clickup.com'];
        this.issueElementSelector = [
            '.task',
            '.lv-subtask__outer',
            '.checklist2-row'
        ];
    }
    render(issueElement, linkElement) {
        linkElement.classList.add('devart-timer-link-clickup');
        if (issueElement.matches(this.issueElementSelector[0])) {
            let element = $$('.task__toolbar:nth-last-of-type(1) .task__toolbar-container', issueElement);
            if (element) {
                element.insertBefore(linkElement, element.lastElementChild);
            }
            else {
                element = $$('.task__toolbar:nth-last-of-type(1)', issueElement);
                if (element) {
                    element.insertBefore(linkElement, element.firstElementChild.nextElementSibling);
                }
            }
        }
        else if (issueElement.matches(this.issueElementSelector[1])) {
            linkElement.classList.add('devart-timer-link-minimal');
            let element = $$('.task-todo-item__name-text .task-todo-item__actions', issueElement);
            if (element) {
                element.parentElement.insertBefore(linkElement, element);
            }
            else {
                element = $$('.task-todo-item__name-text', issueElement);
                if (element) {
                    element.parentElement.insertBefore(linkElement, element.nextElementSibling);
                }
            }
        }
        else if (issueElement.matches(this.issueElementSelector[2])) {
            linkElement.classList.add('devart-timer-link-minimal');
            let element = $$('.checklist2-row-item-name', issueElement);
            if (element) {
                element.parentElement.insertBefore(linkElement, element.nextElementSibling);
            }
            else {
                element = $$(':scope > p', issueElement);
                if (element) {
                    element.parentElement.insertBefore(linkElement, element.nextElementSibling);
                }
            }
        }
    }
    getIssue(issueElement, source) {
        const serviceType = 'ClickUp';
        const serviceUrl = source.protocol + source.host;
        let issueId;
        let issueUrl;
        const matches = source.fullUrl.match(/\/t\/([^\/]+)$/);
        if (matches) {
            issueId = matches[1];
            issueUrl = '/t/' + issueId;
        }
        let issueName = $$.try('.task-name__overlay').textContent;
        let tags = $$.all('.cu-tags-view__container .cu-tags-view .cu-tags-select__name', issueElement);
        let description;
        if (issueElement.matches(this.issueElementSelector[1])) {
            const subtaskLink = $$('.task-todo-item__name-text a', issueElement);
            if (subtaskLink) {
                const matches = subtaskLink.href.match(/\/t\/([^\/]+)$/);
                if (matches) {
                    issueName = subtaskLink.textContent;
                    issueId = matches[1];
                    issueUrl = '/t/' + issueId;
                    tags = $$.all('.cu-tags-view__container-list .cu-tags-view .cu-tags-select__name', issueElement);
                }
            }
        }
        else if (issueElement.matches(this.issueElementSelector[2])) {
            description = $$.try('.checklist2-row-item-name > p, :scope > p', issueElement).textContent;
        }
        const projectName = $$.try('.breadcrumbs__link[data-category]').textContent;
        const tagNames = tags.map(_ => _.textContent);
        if (!issueId && !issueUrl) {
          var splitPath = source.path.split('/');
          if (splitPath[1] == 't' && /[A-Z]{2,}-[0-9]{3,}$/.test(splitPath[3])) {
            issueId = splitPath[3];
            issueUrl = source.path;
          }
        }
        return { serviceType, serviceUrl, issueId, issueName, issueUrl, description, projectName, tagNames };
    }
}
IntegrationService.register(new Clickup());
