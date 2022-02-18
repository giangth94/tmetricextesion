class MicrosoftOfficeOnline {
    constructor() {
        this.showIssueId = false;
        this.matchUrl = 'https://*.officeapps.live.com';
        this.observeMutations = true;
        this.issueElementSelector = '#AppHeaderPanel';
    }
    render(issueElement, linkElement) {
        let anchor = $$('.UsernameContainer', issueElement);
        if (anchor) {
            linkElement.classList.add('devart-timer-link-microsoft-office-live', 'cui-ctl-medium');
            anchor.parentElement.insertBefore(linkElement, anchor.parentElement.firstElementChild);
            return;
        }
        anchor = $$('#CustomCenterRegion', issueElement);
        if (anchor) {
            linkElement.classList.add('devart-timer-link-microsoft-office-live');
            linkElement.style.alignSelf = 'center';
            anchor.appendChild(linkElement);
        }
    }
    getIssue(issueElement, source) {
        let issueId;
        let issueUrl;
        const link = $$('#SignoutLink');
        if (link) {
            let match = /.*[\?\&]ru=([^&]+).*/.exec(link.href);
            if (match) {
                match = /.*[\?\&]resid=([^&]+).*/.exec(decodeURIComponent(match[1]));
                if (match) {
                    issueId = match[1];
                }
            }
        }
        else {
            const resourceParam = (new URL(location.href)).searchParams.get('wopisrc');
            const match = /^https:\/\/wopi\.onedrive\.com\/wopi\/files\/(.+)$/.exec(resourceParam);
            if (match) {
                issueId = match[1];
            }
        }
        if (issueId) {
            issueUrl = `edit?resid=${issueId}`;
        }
        const issueName = $$.try('#BreadcrumbTitle', issueElement).textContent ||
            $$.try('[data-unique-id="DocumentTitleContent"]', issueElement).textContent;
        const serviceUrl = 'https://onedrive.live.com';
        const serviceType = 'MicrosoftOfficeOnline';
        return { issueName, issueId, issueUrl, serviceUrl, serviceType };
    }
}
IntegrationService.register(new MicrosoftOfficeOnline());
