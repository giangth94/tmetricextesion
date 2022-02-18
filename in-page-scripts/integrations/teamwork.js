const hosts = '((teamwork|seetodos|companytodos|worktodos|companyworkflow|projectgameplan|peopleworkflow|projecttodos|projectorganiser|seetasks)\.com|teamworkpm\.net)';
class Teamwork {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.matchUrl = new RegExp('.*:\/\/.*\.' + hosts + '\/.*');
    }
    issueElementSelector() {
        return $$.all('.row-content-holder');
    }
    render(issueElement, linkElement) {
        const container = $$.create('span');
        linkElement.classList.add('option');
        container.classList.add('devart-timer-link-teamwork', 'w-task-row__option');
        container.appendChild(linkElement);
        issueElement.appendChild(container);
    }
    getIssue(issueElement, source) {
        const issueName = $$.try('.w-task-row__name > span', issueElement).textContent;
        if (!issueName) {
            return;
        }
        let issueId;
        let issueUrl;
        const issueHref = $$.getAttribute('.w-task-row__name a[href*="tasks"]', 'href', issueElement);
        const matches = issueHref.match(/^.*tasks\/(\d+)$/);
        if (matches) {
            issueId = '#' + matches[1];
            issueUrl = 'tasks/' + matches[1];
        }
        let projectName;
        const projectNameElement = $$('.w-header-titles__project-name');
        if (projectNameElement) {
            projectName = projectNameElement.firstChild.textContent;
        }
        if (!projectName) {
            const parentRowElement = $$.closest('.s-today__tasks-row', issueElement);
            if (parentRowElement) {
                const groupHeader = $$.prev('.u-group-title', parentRowElement);
                if (groupHeader) {
                    const projectAnchor = $$('a[href*=projects]', groupHeader);
                    if (projectAnchor) {
                        projectName = Array.from(projectAnchor.childNodes)
                            .filter(_ => _.nodeType == document.TEXT_NODE)
                            .map(_ => _.textContent.trim())
                            .join('');
                    }
                }
            }
        }
        if (!projectName) {
            const header = $$('.w-gantt__top-left-header h3');
            if (header) {
                projectName = header.textContent;
            }
        }
        const tagNames = $$.all('.w-tags__tag-name', issueElement).map(_ => _.textContent);
        const serviceType = 'Teamwork';
        const serviceUrl = source.protocol + source.host;
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames };
    }
}
class TeamworkDesk {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.matchUrl = new RegExp('.*:\/\/.*\.' + hosts + '\/desk\/.*');
    }
    issueElementSelector() {
        return $$.all('.ticket-view-page--container').concat($$.all('.task-group__task-list-item'));
    }
    isTicketElement(issueElement) {
        return issueElement.classList.contains('ticket-view-page--container');
    }
    render(issueElement, linkElement) {
        if (this.isTicketElement(issueElement)) {
            const buttons = $$('.right-buttons-container', issueElement);
            if (buttons) {
                const linkContainer = $$.create('div', 'devart-timer-link-teamwork-desk-ticket');
                linkContainer.appendChild(linkElement);
                buttons.parentElement.insertBefore(linkContainer, buttons);
            }
        }
        else {
            const host = $$('.task-extras-container', issueElement);
            if (host) {
                linkElement.classList.add('devart-timer-link-teamwork-desk-task');
                host.appendChild(linkElement);
            }
        }
    }
    getIssue(issueElement, source) {
        let issueName, issueId, issueUrl, projectName;
        if (this.isTicketElement(issueElement)) {
            issueName = $$.try('.title__subject', issueElement).textContent;
            issueId = ($$.try('.ticket-id', issueElement).textContent || '').trim();
            if (issueId) {
                issueUrl = 'desk/tickets/' + issueId.replace(/^\#/, '');
            }
        }
        else {
            issueName = $$.try('.task-name', issueElement).textContent;
            const issueHref = $$.getAttribute('a.task-actions__icon-wrapper', 'href', issueElement);
            const issueHrefMatch = /^.*tasks\/(\d+)$/.exec(issueHref);
            const issueIdNumber = issueHrefMatch && issueHrefMatch[1];
            if (issueIdNumber) {
                issueId = '#' + issueIdNumber;
                issueUrl = 'tasks/' + issueIdNumber;
            }
            const taskGroup = $$.closest('.task-group__list-item', issueElement);
            if (taskGroup) {
                const projectAnchor = $$('a[href*=projects]', taskGroup);
                if (projectAnchor) {
                    projectName = Array.from(projectAnchor.childNodes)
                        .filter(_ => _.nodeType == document.TEXT_NODE)
                        .map(_ => _.textContent.trim())
                        .join('');
                }
            }
        }
        if (!issueName) {
            return;
        }
        const serviceType = 'Teamwork';
        const serviceUrl = source.protocol + source.host;
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}
IntegrationService.register(new Teamwork());
IntegrationService.register(new TeamworkDesk());
