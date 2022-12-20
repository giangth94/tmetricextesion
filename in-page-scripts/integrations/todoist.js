class Todoist {
    constructor() {
        this.showIssueId = false;
        this.observeMutations = true;
        this.matchUrl = '*://*todoist.com/app*';
        this.issueElementSelector = [
            '.task_item, .task_list_item',
            '.side_panel .item_detail, .detail_modal .item_detail'
        ];
    }
    render(issueElement, linkElement) {
        if (issueElement.matches(this.issueElementSelector[0])) {
            let host = $$('.task_item_details_bottom, .task_list_item__info_tags', issueElement);
            if (host) {
                linkElement.classList.add('devart-timer-link-todoist');
                host.insertBefore(linkElement, $$('.column_project, .task_list_item__project', host));
            }
        }
        else if (issueElement.matches(this.issueElementSelector[1])) {
            let host = $$('.item_overview_sub', issueElement);
            if (host) {
                linkElement.classList.add('devart-timer-link-todoist', 'icon_pill');
                host.insertBefore(linkElement, host.firstElementChild);
            }
        }
    }
    getIssue(issueElement, source) {
        let issueNumber, issueId, issueName, projectName, tagNames;
        if (issueElement.matches(this.issueElementSelector[0])) {
            issueNumber = issueElement.id.split('_')[1] || issueElement.getAttribute('data-item-id');
            if (!issueNumber) {
                return;
            }
            issueId = '#' + issueNumber;
            issueName = $$.try('.content > .text .task_item_content_text, .task_list_item__content .task_content', issueElement).textContent;
            if (!issueName) {
                issueName = $$
                    .findAllNodes('.content > .text', null, issueElement)
                    .filter(node => {
                    if (node.nodeType == Node.TEXT_NODE) {
                        return true;
                    }
                    if (node.nodeType != Node.ELEMENT_NODE) {
                        return false;
                    }
                    let tag = node;
                    if (['B', 'I', 'STRONG', 'EM'].indexOf(tag.tagName) >= 0) {
                        return true;
                    }
                    if (tag.tagName != 'A') {
                        return false;
                    }
                    if (tag.classList.contains('ex_link')) {
                        return true;
                    }
                    let href = tag.getAttribute('href');
                    if (href && !href.indexOf("mailto:")) {
                        return true;
                    }
                })
                    .reduce((sumText, node) => {
                    let text = node.textContent;
                    if (text[0] == ' ' && sumText[sumText.length - 1] == ' ') {
                        text = text.substring(1);
                    }
                    return sumText + text;
                }, '');
            }
            projectName =
                $$.try('.project_item__name', issueElement).textContent ||
                    $$.try('.project_link').textContent ||
                    $$.try('.task_list_item__project', issueElement).textContent ||
                    $$.try('.pname', issueElement).textContent ||
                    $$.try('.view_header .view_header__content .simple_content').textContent;
            tagNames = $$.all('.label, .task_list_item__info_tags__label .simple_content', issueElement).map(label => label.textContent);
        }
        else if (issueElement.matches(this.issueElementSelector[1])) {
            issueNumber = $$.getAttribute('ul[data-subitem-list-id]', 'data-subitem-list-id', issueElement);
            if (!issueNumber) {
                return;
            }
            issueId = '#' + issueNumber;
            issueName = $$.try('.item_overview_content .task_content', issueElement).textContent;
            let issue = $$.all('.devart-timer-link-todoist').map(_ => {
                let timer;
                try {
                    timer = JSON.parse(_.getAttribute('data-devart-timer-link'));
                }
                finally {
                    return timer;
                }
            }).filter(_ => !!_).find(_ => _.issueId == issueId);
            if (issue) {
                projectName = issue.projectName;
            }
            tagNames = $$.all('.item_overview_sub .label_pill .simple_content', issueElement).map(label => label.textContent);
        }
        if (!issueNumber || !issueName) {
            return;
        }
        let serviceType = 'Todoist';
        let serviceUrl = source.protocol + source.host;
        let issueUrl = 'showTask?id=' + issueNumber;
        return { issueId, issueName, projectName, serviceType, serviceUrl, issueUrl, tagNames };
    }
}
IntegrationService.register(new Todoist());
