class Jira {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.issueLinkSelector = 'a[href^="/browse/"][target=_blank]';
        this.issueElementSelector = () => {
            let element = $$('#jira-issue-header');
            if (element) {
                element = element.parentElement;
            }
            else {
                element = $$('#jira-frontend object');
                if (element) {
                    element = element.parentElement.parentElement.parentElement;
                }
            }
            return [
                $$.visible([
                    '#ghx-detail-view',
                    '[role=dialog]',
                    '#issue-content',
                    '.new-issue-container'
                ].join(',')),
                element
            ];
        };
    }
    match(source) {
        return $$.getAttribute('meta[name=application-name]', 'content') == 'JIRA';
    }
    render(issueElement, linkElement) {
        let host = $$('.command-bar .aui-toolbar2-primary', issueElement);
        if (host) {
            linkElement.classList.add('aui-button');
            host.appendChild(linkElement);
            return;
        }
        host = $$('.command-bar .toolbar-split-left', issueElement);
        if (host) {
            const ul = $$.create('ul', 'toolbar-group');
            const li = $$.create('li', 'toolbar-item');
            linkElement.classList.add('toolbar-trigger');
            li.appendChild(linkElement);
            ul.appendChild(li);
            host.appendChild(ul);
            return;
        }
        host = $$('#ghx-detail-head', issueElement);
        if (host) {
            const container = $$.create('div');
            container.appendChild(linkElement);
            host.appendChild(container);
            return;
        }
        const issueName = $$('h1', issueElement);
        if (!issueName) {
            return;
        }
        const anchor = $$(this.issueLinkSelector, issueElement);
        if (anchor) {
            linkElement.classList.add('devart-timer-link-jira-next');
            if (issueElement.matches('#ghx-detail-view')) {
                linkElement.classList.add('devart-timer-link-minimal');
            }
            anchor.parentElement.appendChild(linkElement);
            return;
        }
    }
    getIssue(issueElement, source) {
        const issueName = $$.try('dd[data-field-id=summary], h1', issueElement).textContent;
        if (!issueName) {
            return;
        }
        const servicePath = $$.getAttribute('meta[name=ajs-context-path]', 'content');
        const serviceUrl = source.protocol + source.host + servicePath;
        let issueId = $$.searchParams(source.fullUrl)['selectedIssue']
            || (source.path.match(/\/(?:issues|browse)\/([^\/]+)/) || [])[1];
        issueId = issueId && /[^#]*/.exec(issueId)[0];
        let issueUrl = issueId && ('/browse/' + issueId);
        if (!issueUrl) {
            issueUrl = $$.getAttribute(this.issueLinkSelector, 'href', issueElement);
            if (issueUrl) {
                issueId = issueUrl.match(/\/browse\/(.*)/)[1];
            }
        }
        const projectName = $$.try('#breadcrumbs-container a', null, el => el.getAttribute('href').split('/').some(v => v == 'projects')).textContent
            || $$.try('#project-name-val').textContent
            || $$.try('.project-title > a').textContent
            || $$.try('.sd-notify-header').textContent
            || this.getProjectNameFromProjectLink(issueId)
            || this.getProjectNameFromAvatar(issueElement)
            || this.getProjectNameFromNavigationBar();
        const tags = $$.all('a', issueElement);
        const sidePanel = $$.try('#jira-issue-header-actions').parentElement;
        if (sidePanel) {
            tags.push(...$$.all('a', sidePanel));
        }
        let tagNames = tags
            .filter(el => /jql=labels|jql=project.+AND.+fixVersion/.test(el.getAttribute('href')))
            .map(el => el.textContent);
        if (!tagNames.length) {
            tagNames = ($$.try('dd[data-field-id=labels]', issueElement).textContent || '').split(',');
        }
        return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Jira', tagNames };
    }
    getProjectNameFromProjectLink(issueId) {
        const projectId = (issueId || '').indexOf('-') > 0 && issueId.split('-')[0];
        if (projectId) {
            return $$.try(`a[href="/browse/${projectId}"]`).textContent;
        }
    }
    getProjectNameFromAvatar(issueElement) {
        return $$.try('img', issueElement, (img) => /projectavatar/.test(img.src)).title;
    }
    getProjectNameFromNavigationBar() {
        const avatarElement = $$('#navigation-app span[role="img"], [data-test-id="navigation-apps.project-switcher-v2"] span[role="img"]', null, el => (el.style.backgroundImage || '').indexOf('projectavatar') >= 0);
        const avatarContainer = avatarElement && $$.closest('div,span', avatarElement, el => !!el.innerText);
        const projectNode = avatarContainer && $$.try('div,span', avatarContainer, el => el.textContent && !el.childElementCount);
        if (projectNode && projectNode.offsetWidth) {
            return projectNode.textContent;
        }
    }
}
IntegrationService.register(new Jira());
