class GoogleCalendar {
    constructor() {
        this.showIssueId = false;
        this.matchUrl = 'https://calendar.google.com/calendar/*';
        this.observeMutations = true;
    }
    render(issueElement, linkElement) {
        let detailedView = $$('.ep .ep-dpc', issueElement);
        if (detailedView) {
            linkElement.classList.add('devart-timer-link-google-calendar-detailed');
            detailedView.insertBefore(linkElement, detailedView.firstChild);
        }
        let popup = $$('.bubblecontent');
        if (popup) {
            linkElement.classList.add('devart-timer-link-google-calendar-popup');
            popup.insertBefore(linkElement, popup.firstChild);
        }
    }
    getIssue(issueElement, source) {
        let issueName = $$.try('#mtb').textContent ||
            $$.try('.ep-title input').value ||
            $$.try('.bubblecontent .gcal-contenteditable-textinput').textContent;
        if (!issueName) {
            let iframe = $$('.bubblecontent iframe');
            if (iframe) {
                let textArea = iframe.contentDocument.querySelector('textarea');
                if (textArea) {
                    issueName = textArea.value;
                }
                else {
                    iframe.addEventListener('load', () => window.parsePage());
                }
            }
        }
        let serviceUrl = source.protocol + source.host;
        return { issueName, serviceUrl, serviceType: 'GoogleCalendar' };
    }
}
class NewGoogleCalendar {
    constructor() {
        this.showIssueId = false;
        this.matchUrl = 'https://calendar.google.com/calendar/*';
        this.observeMutations = true;
    }
    render(issueElement, linkElement) {
        let container = $$('.Tnsqdc .pPTZAe');
        if (container) {
            linkElement.classList.add('devart-timer-link-google-calendar-popup-modern');
            container.insertBefore(linkElement, container.firstElementChild);
            return;
        }
        container = $$.closest('.UXzdrb', $$('#xTiIn'));
        if (container) {
            linkElement.style.marginLeft = '64px';
            container.parentNode.insertBefore(linkElement, container.nextSibling);
        }
    }
    getIssue(issueElement, source) {
        let issueName = $$.try('#rAECCd').textContent
            || $$.try('#xTiIn').value;
        let serviceUrl = source.protocol + source.host;
        return { issueName, serviceUrl, serviceType: 'GoogleCalendar' };
    }
}
IntegrationService.register(new GoogleCalendar(), new NewGoogleCalendar());
