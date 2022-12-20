class Bitbucket {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.matchUrl = [
            '*://*/issues/*',
            '*://*/pull-requests/*'
        ];
    }
    match() {
        return $$.getAttribute('meta[name=application-name]', 'content') == 'Bitbucket';
    }
    render(issueElement, linkElement) {
        const issueToolbar = $$('#issue-header .issue-toolbar');
        const pullRequestHeading = $$('header h1');
        if (issueToolbar) {
            const linkContainer = $$.create('div', 'devart-timer-link-bitbucket', 'aui-buttons');
            linkElement.classList.add('aui-button');
            linkContainer.appendChild(linkElement);
            issueToolbar.insertBefore(linkContainer, issueToolbar.firstElementChild);
        }
        else if (pullRequestHeading) {
            linkElement.style.display = 'inline-block';
            linkElement.style.marginTop = '1rem';
            pullRequestHeading.parentElement.appendChild(linkElement);
        }
    }
    getIssue(issueElement, source) {
        const match = /^(.+)\/(issues|pull-requests)\/(\d+).*$/.exec(source.path);
        if (!match) {
            return;
        }
        const issueNumber = match[3];
        if (!issueNumber) {
            return;
        }
        let issueId, issueName;
        const issueType = match[2];
        if (issueType == 'issues') {
            issueId = '#' + issueNumber;
            issueName = $$.try('#issue-title').textContent;
        }
        else if (issueType == 'pull-requests') {
            issueId = '!' + issueNumber;
            issueName = $$.try('h1').textContent;
        }
        if (!issueName) {
            return;
        }
        const projectName = $$.try('.aui-nav-breadcrumbs a, header a', null, el => /.+\/projects\/.+/.test(el.getAttribute('href'))).textContent;
        const serviceType = 'Bitbucket';
        let servicePath = match[1].split('/').slice(0, -2).join('/');
        servicePath = (servicePath) ? '/' + servicePath : '';
        const serviceUrl = source.protocol + source.host + servicePath;
        const issueUrl = match[1].split('/').slice(-2).join('/') + '/' + issueType + '/' + issueNumber;
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}
IntegrationService.register(new Bitbucket());
