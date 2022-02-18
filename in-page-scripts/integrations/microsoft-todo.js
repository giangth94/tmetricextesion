class MicrosoftToDo {
    constructor() {
        this.matchUrl = [
            'https://to-do.live.com/tasks/*',
            'https://to-do.office.com/tasks/*'
        ];
        this.issueElementSelector = () => $$.all('.taskItem-body')
            .concat($$.all('.details-body'));
        this.showIssueId = false;
        this.observeMutations = true;
    }
    render(issueElement, linkElement) {
        if (issueElement.className == 'taskItem-body') {
            linkElement.classList.add('devart-timer-link-microsoft-todo');
            linkElement.lastElementChild.textContent = '';
            issueElement.appendChild(linkElement);
        }
        if (issueElement.className == 'details-body') {
            linkElement.classList.add('section-title', 'devart-timer-link-microsoft-todo-details');
            let section = $$.all('.section', issueElement)[1];
            if (section) {
                let sectionItem = $$.create('div', 'section-item');
                let btn = $$.create('button', 'section-innerClick');
                let sectionInner = $$.create('div', 'section-inner');
                sectionInner.appendChild(linkElement);
                btn.appendChild(sectionInner);
                sectionItem.appendChild(btn);
                section.appendChild(sectionItem);
            }
        }
    }
    getIssue(issueElement, source) {
        let issueName = $$.try('.taskItem-titleWrapper > .taskItem-title', issueElement).textContent;
        if (!issueName) {
            issueName = $$.try('.detailHeader-title', issueElement).textContent;
        }
        if (!issueName) {
            return;
        }
        let serviceUrl = source.protocol + source.host;
        return { issueName, serviceUrl, serviceType: 'MicrosoftToDo' };
    }
}
IntegrationService.register(new MicrosoftToDo());
