class ZohoActivity {
    constructor() {
        this.showIssueId = false;
        this.observeMutations = true;
        this.matchUrl = [
            "https://*/*portal/*/*.do*",
            "https://*/*crm/*"
        ];
        this.issueElementSelector = '#kventitydetailspage, .task-detailview';
    }
    render(issueElement, linkElement) {
        linkElement.classList.add('newwhitebtn', 'dIB', 'mR0');
        const eventInfoTable = $$('.eventInfo table', issueElement);
        if (eventInfoTable) {
            linkElement.classList.add('floatR');
            const td = $$('td', eventInfoTable);
            if (td) {
                td.prepend(linkElement);
            }
            return;
        }
        const table = $$('.historycontainer table', issueElement);
        if (table) {
            const tr = $$.create('tr');
            const td = $$.create('td');
            td.appendChild(linkElement);
            tr.appendChild(td);
            const tbody = $$('tbody', table);
            if (tbody) {
                tbody.appendChild(tr);
            }
        }
    }
    getIssue(issueElement, source) {
        let issueName = $$.try('#subvalue_SUBJECT, #entityNameInBCView', issueElement).textContent;
        if (!issueName) {
            return;
        }
        const contactName = $$.try('#subvalue_CONTACTID', issueElement).textContent;
        if (contactName) {
            issueName += ` - ${contactName}`;
        }
        const tagNames = $$.all('.linktoTagA', issueElement).map(_ => _.textContent);
        return { serviceType: 'ZohoCRM', issueName, tagNames };
    }
}
class ZohoProject {
    constructor() {
        this.showIssueId = false;
        this.observeMutations = true;
        this.matchUrl = '*://*/portal/*';
        this.issueElementSelector = '#zpsDetailView .detail_rhs';
    }
    render(issueElement, linkElement) {
        const panel = $$('#headerIconSection');
        if (panel) {
            panel.appendChild(linkElement);
        }
    }
    getIssue(issueElement, source) {
        const issueName = $$.try('.detail-title-plain', issueElement).textContent;
        const projectName = $$.try('.entity-project > span', issueElement).textContent
            || $$.try('.entity-project > a').textContent;
        const tagNames = $$.all('.zptagslist > span', issueElement).map(_ => _.textContent);
        return { serviceType: 'ZohoCRM', issueName, projectName, tagNames };
    }
}
class ZohoDesk {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.issueElementSelector = '.ticket-DVPanel';
    }
    render(issueElement, linkElement) {
        const panel = $$('#caseSubject', issueElement).parentElement.parentElement;
        if (panel) {
            panel.insertBefore(linkElement, $$('.clboth', panel));
        }
    }
    getIssue(issueElement, source) {
        const issueId = $$.try('#caseNum', issueElement).textContent;
        const issueName = $$.try('#caseSubjectText', issueElement).textContent;
        const match = source.fullUrl.replace(/\?.+\#/, '#').match(/^(.+)\/(ShowHomePage\.do\#Cases\/dv\/\d+)$/i);
        const serviceUrl = match ? match[1] : null;
        const issueUrl = match ? match[2] : null;
        const tagNames = $$.all('.tagBody a', issueElement).map(_ => _.textContent);
        return { serviceType: 'ZohoCRM', serviceUrl, issueUrl, issueId, issueName, tagNames };
    }
}
IntegrationService.register(new ZohoActivity(), new ZohoProject(), new ZohoDesk());
