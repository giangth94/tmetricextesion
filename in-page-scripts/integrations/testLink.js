class TestLink {
    constructor() {
        this.showIssueId = true;
        this.matchUrl = '*/lib/execute/*.php*';
    }
    render(issueElement, linkElement) {
        let host = $$('.groupBtn');
        if (host) {
            host.appendChild(linkElement);
        }
    }
    getIssue(issueElement, source) {
        let projectId = '';
        let issueId = '';
        let issueName = '';
        var titleNodes = $$.findAllNodes('.exec_tc_title', Node.TEXT_NODE);
        titleNodes.some((childNode, i) => {
            let match = /\s+([^\s]+)\-([\d]+)\s*::(.*)/.exec(childNode.nodeValue);
            if (match) {
                projectId = match[1];
                issueId = `${projectId}-${match[2]}`;
                match = /::(.*)/.exec(match[3]);
                if (match) {
                    issueName = match[1].trim();
                }
                if (!issueName && i + i < titleNodes.length) {
                    issueName = titleNodes[i + 1].nodeValue.trim();
                }
                return true;
            }
        });
        if (!issueName) {
            return;
        }
        let serviceUrl = source.fullUrl.split('/lib/execute/')[0];
        let issueUrl = `/linkto.php?tprojectPrefix=${projectId}&item=testcase&id=${issueId}`;
        let projectName = '';
        let serviceType = 'TestLink';
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}
IntegrationService.register(new TestLink());
