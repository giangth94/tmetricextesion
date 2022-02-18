class Bugzilla {
    constructor() {
        this.showIssueId = true;
        this.observeMutations = true;
        this.matchUrl = '*://*/show_bug.cgi*';
        this.issueElementSelector = '#bugzilla-body';
    }
    render(issueElement, linkElement) {
        const host = $$('#summary_alias_container', issueElement)
            || $$('#summary_container', issueElement)
            || $$('#field-value-status_summary', issueElement);
        if (host) {
            linkElement.classList.add('devart-timer-link-bugzilla');
            host.appendChild(linkElement);
        }
    }
    getIssue(issueElement, source) {
        const issueIdNumber = $$.try('input[name=id]', issueElement).value
            || $$.searchParams(source.fullUrl)['id'];
        if (!issueIdNumber) {
            return;
        }
        const issueId = '#' + issueIdNumber;
        const issueName = $$.try('#short_desc_nonedit_display', issueElement).textContent
            || $$.try('#field-value-short_desc', issueElement).textContent;
        if (!issueName) {
            return;
        }
        const projectName = $$.try('#product').value
            || ($$.try('#field_container_product').firstChild || {}).textContent
            || ($$.try('#product-name').firstChild || {}).textContent;
        const serviceType = 'Bugzilla';
        const action = 'show_bug.cgi';
        const serviceUrl = source.fullUrl.substring(0, source.fullUrl.indexOf(action));
        const issueUrl = `/${action}?id=${issueIdNumber}`;
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl };
    }
}
IntegrationService.register(new Bugzilla());
