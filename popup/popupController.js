var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class PopupController {
    constructor(isPagePopup = false) {
        this.isPagePopup = isPagePopup;
        this.initializeAction = this.wrapBackgroundAction('initialize');
        this.openTrackerAction = this.wrapBackgroundAction('openTracker');
        this.openPageAction = this.wrapBackgroundAction('openPage');
        this.loginAction = this.wrapBackgroundAction('login');
        this.isConnectionRetryEnabledAction = this.wrapBackgroundAction('isConnectionRetryEnabled');
        this.retryAction = this.wrapBackgroundAction('retry');
        this.fixTimerAction = this.wrapBackgroundAction('fixTimer');
        this.putTimerAction = this.wrapBackgroundAction('putTimer');
        this.saveProjectMapAction = this.wrapBackgroundAction('saveProjectMap');
        this.saveDescriptionMapAction = this.wrapBackgroundAction('saveDescriptionMap');
        this.openOptionsPage = this.wrapBackgroundAction('openOptionsPage');
        this.getRecentTasksAction = this.wrapBackgroundAction('getRecentTasks');
        this._forms = {
            login: '#login-form',
            fix: '#fix-form',
            view: '#view-form',
            create: '#create-form'
        };
        this._states = {
            loading: 'loading',
            retrying: 'retrying',
            authenticating: 'authenticating',
            fixing: 'fixing',
            creating: 'creating',
            viewing: 'viewing'
        };
        this._weekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
        this._monthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
        this.noProjectOption = { id: 0, text: 'No project' };
        this.createProjectOption = { id: -1, text: 'New project' };
        this.initControls();
        this.getData(null);
    }
    getData(accountId) {
        this.switchState(this._states.loading);
        return this.initializeAction({ accountId, includeRecentTasks: !this.isPagePopup }).then(data => {
            this.setData(data);
            if (this._profile.accountMembership.length > 1) {
                this.fillAccountSelector(data.profile, data.accountId);
            }
            this.fillWebToolAlert();
            if (data.timer.isStarted && this.isLongRunning(data.timer.startTime)) {
                this.fillFixForm(data.timer);
                this.switchState(this._states.fixing);
            }
            else if (!this.isPagePopup && data.timer && data.timer.isStarted) {
                this.fillViewForm(data.timer);
                this.fillCreateForm(data.defaultProjectId);
                this.switchState(this._states.viewing);
            }
            else {
                this.fillCreateForm(data.defaultProjectId);
                this.switchState(this._states.creating);
            }
        }).catch(() => {
            this.isConnectionRetryEnabledAction().then(retrying => {
                if (retrying) {
                    this.switchState(this._states.retrying);
                }
                else {
                    this.switchState(this._states.authenticating);
                }
            });
        });
    }
    callBackground(request) {
        return new Promise(resolve => {
            chrome.runtime.sendMessage(request, (response) => {
                resolve(response);
            });
        });
    }
    close() {
        window.close();
    }
    setData(data) {
        if (data.timer) {
            this._activeTimer = data.timer;
            this._newIssue = this._newIssue || data.newIssue;
            this._accountId = data.accountId;
            this._profile = data.profile;
            this._timeFormat = data.profile.timeFormat;
            this._projects = data.projects;
            this._clients = data.clients;
            this._tags = data.tags.filter(tag => !!tag).sort((a, b) => this.compareTags(a, b));
            this._tagsByName = this._tags.reduce((map, tag) => (map[tag.tagName] = tag) && map, {});
            this._constants = data.constants;
            this._canCreateProjects = data.canCreateProjects;
            this._canCreateTags = data.canCreateTags;
            this._requiredFields = data.requiredFields;
            this._possibleWebTool = data.possibleWebTool;
        }
        else {
            this.close();
        }
    }
    putTimer(accountId, timer) {
        return this.putTimerAction({ accountId, timer }).then(() => {
            this.close();
        });
    }
    compareTags(t1, t2) {
        const diff = (t1.isWorkType ? 1 : 0) - (t2.isWorkType ? 1 : 0);
        if (diff) {
            return diff;
        }
        const name1 = t1.tagName.toLowerCase();
        const name2 = t2.tagName.toLowerCase();
        return name1 == name2 ? 0 : (name1 > name2 ? 1 : -1);
    }
    wrapBackgroundAction(action) {
        return (data) => {
            return new Promise((resolve, reject) => {
                this.callBackground({
                    action: action,
                    data: data
                }).then(response => {
                    if (response.error) {
                        reject(response.error);
                    }
                    else {
                        resolve(response.data);
                    }
                }).catch(error => {
                    reject(error);
                });
            });
        };
    }
    switchState(name) {
        const state = $('content').attr('class');
        if (state == name) {
            return;
        }
        $('content').attr('class', name);
        if (name == this._states.creating) {
            this.focusCreatingForm();
            if (!this.isPagePopup) {
                this.fillRecentTaskSelector();
            }
        }
        let logoText;
        let accountSelectorDisabled = true;
        switch (name) {
            case this._states.retrying:
                logoText = 'Error';
                break;
            case this._states.viewing:
                logoText = 'Active Timer';
                break;
            case this._states.creating:
                logoText = 'Start Timer';
                accountSelectorDisabled = false;
                break;
            case this._states.fixing:
                logoText = 'Fix Timer';
                break;
            case this._states.authenticating:
                logoText = 'Not Connected';
                break;
            default:
                logoText = '';
                break;
        }
        $('.logo-text').text(logoText);
        $('#account-selector .dropdown-toggle').prop('disabled', accountSelectorDisabled);
    }
    getAccountMembership(id) {
        return this._profile && this._profile.accountMembership.find(_ => _.account.accountId == id);
    }
    fillAccountSelector(profile, accountId) {
        if (!profile) {
            return;
        }
        const membership = profile.accountMembership;
        const selectedAccount = membership.find(_ => _.account.accountId == accountId).account;
        const dropdown = $('#account-selector');
        $('.dropdown-toggle-text', dropdown).text(selectedAccount.accountName);
        const menu = $('.dropdown-menu', dropdown);
        menu.empty();
        const items = membership.map(_ => {
            const item = $('<button></button>')
                .addClass('dropdown-menu-item')
                .toggleClass('selected', _.account.accountId == accountId)
                .attr('data-value', _.account.accountId)
                .text(_.account.accountName);
            return item;
        });
        menu.append(items);
        dropdown.show();
    }
    changeAccount(accountId) {
        const state = $('content').attr('class');
        this._newIssue = {};
        this.getData(accountId).then(() => {
            this.switchState(state);
        });
    }
    fillFixForm(timer) {
        if (timer && timer.details) {
            $(this._forms.fix + ' .description').text(this.toDescription(timer.details.description));
            $(this._forms.fix + ' .startTime').text(this.toLongRunningDurationString(timer.startTime));
        }
    }
    getTaskLinkData(task) {
        if (!task) {
            return {};
        }
        let url = '';
        let text = '';
        const integrationUrl = task.integrationUrl || task.serviceUrl;
        const relativeUrl = task.relativeIssueUrl || task.issueUrl;
        const showIssueId = task.showIssueId;
        const issueId = task.externalIssueId || '' + (task.projectTaskId || '') || task.issueId;
        if (integrationUrl && relativeUrl) {
            url = integrationUrl + relativeUrl;
            if (showIssueId) {
                text = issueId;
            }
        }
        else if (issueId) {
            url = `${this._constants.serviceUrl}#/tasks/${this._accountId}/${issueId}`;
        }
        return { url, text };
    }
    fillWebToolAlert() {
        $('#webtool-alert').toggle(!!this._possibleWebTool);
        if (!this._possibleWebTool) {
            return;
        }
        const message = `We have noticed that you are using ${this._possibleWebTool.serviceName}. Do you want to integrate TMetric with ${this._possibleWebTool.serviceName}?`;
        $('#webtool-alert .alert-text').text(message);
    }
    fillTaskLink(link, url, text) {
        if (!url) {
            return;
        }
        link.attr('href', url);
        link.attr('target', '_blank');
        const iconClass = 'fa fa-external-link';
        if (text) {
            link.text(text);
            link.removeClass(iconClass);
        }
        else {
            link.text('');
            link.addClass(iconClass);
        }
    }
    fillViewForm(timer) {
        const details = timer && timer.details;
        if (!details) {
            return;
        }
        $(this._forms.view + ' .time').text(this.toDurationString(timer.startTime));
        const projectTask = details.projectTask;
        const { url, text } = this.getTaskLinkData(projectTask);
        if (url) {
            this.fillTaskLink($(this._forms.view + ' .task .id .link'), url, text);
            $(this._forms.view + ' .task')
                .attr('title', projectTask.description)
                .find('.name')
                .text(projectTask.description);
            if (projectTask.description == details.description) {
                $(this._forms.view + ' .notes').hide();
            }
            else {
                const description = this.toDescription(details.description);
                $(this._forms.view + ' .notes')
                    .attr('title', description)
                    .find('.description')
                    .text(description);
            }
        }
        else {
            $(this._forms.view + ' .task')
                .attr('title', this.toDescription(details.description))
                .find('.name')
                .text(this.toDescription(details.description));
            $(this._forms.view + ' .notes').hide();
        }
        const projectName = this.toProjectName(details.projectId);
        if (projectName) {
            $(this._forms.view + ' .project .name').text(projectName).show();
        }
        else {
            $(this._forms.view + ' .project').hide();
        }
        if (timer.tagsIdentifiers && timer.tagsIdentifiers.length) {
            $(this._forms.view + ' .tags .items').append(this.makeTimerTagsElement(timer.tagsIdentifiers)).show();
        }
        else {
            $(this._forms.view + ' .tags').hide();
        }
    }
    fillCreateForm(projectId) {
        $(this._forms.create + ' .task-recent').toggle(!this.isPagePopup);
        const task = $(this._forms.create + ' .task');
        const description = $(this._forms.create + ' .description');
        const descriptionInput = description.find('.input');
        descriptionInput.attr('maxlength', 400);
        const issue = this._newIssue;
        const { url, text } = this.getTaskLinkData(issue);
        if (url) {
            this.fillTaskLink(task.find('.link'), url, text);
            task.css('display', 'inline-flex');
            task.find('.name').text(issue.issueName);
            description.find('.label').text('Notes');
            description.removeClass('required');
            descriptionInput.attr('placeholder', 'Describe your activity');
            descriptionInput.val(issue.description);
        }
        else {
            task.css('display', 'none');
            description.find('.label').text('Task');
            description.toggleClass('required', !!(this._requiredFields.description && !this._requiredFields.taskLink));
            descriptionInput.attr('placeholder', 'Enter description');
            descriptionInput.val(issue.description || issue.issueName);
        }
        this.initProjectSelector(projectId);
        $(this._forms.create + ' .new-project .input').attr('maxlength', 255);
        $(this._forms.create + ' .project').toggleClass('required', !!this._requiredFields.project);
        $(this._forms.create + ' .tags').toggleClass('required', !!this._requiredFields.tags);
    }
    focusCreatingForm() {
        setTimeout(() => {
            $(window).focus();
            if (this.isPagePopup && this._newIssue.issueName) {
                $(this._forms.create + ' .project .input').select2('open').select2('close');
            }
            else {
                $(this._forms.create + ' .description .input').focus().select();
            }
        }, 100);
    }
    fillRecentTaskSelector() {
        const dropdown = $('#recent-task-selector');
        const toggle = $('.dropdown-toggle', dropdown);
        toggle.prop('disabled', true);
        const menu = $('.dropdown-menu', dropdown);
        menu.empty();
        return this.getRecentTasksAction(this._accountId).then(recentTasks => {
            this._recentTasks = recentTasks;
            if (this._recentTasks && this._recentTasks.length) {
                toggle.prop('disabled', false);
                const items = this._recentTasks.map((task, index) => this.formatRecentTaskSelectorItem(task, index));
                menu.append(items);
            }
        });
    }
    formatRecentTaskSelectorItem(task, index) {
        const item = $('<button></button>')
            .addClass('dropdown-menu-item')
            .attr('data-value', index);
        const description = $('<span>').text(task.details.description);
        description.attr('title', task.details.description);
        item.append(description);
        if (task.details.projectId) {
            const project = this.formatExistingProjectCompact(task.details.projectId);
            item.append(project);
        }
        return item;
    }
    fillFormWithRecentTask(index) {
        if (!this._recentTasks || !this._recentTasks.length) {
            return;
        }
        const task = this._recentTasks[index];
        if (!task) {
            return;
        }
        const issue = {};
        let projectId = null;
        issue.description = task.details.description;
        if (task.tagsIdentifiers) {
            issue.tagNames = task.tagsIdentifiers.map(id => {
                const tag = this.getTag(id);
                return tag && tag.tagName;
            }).filter(_ => !!_);
        }
        if (task.details) {
            const project = this.getProject(task.details.projectId);
            if (project) {
                issue.projectName = project.projectName;
                projectId = project.projectId;
            }
            const projectTask = task.details.projectTask;
            if (projectTask) {
                issue.issueId = projectTask.externalIssueId || '' + (projectTask.projectTaskId || '');
                issue.issueName = projectTask.description;
                issue.issueUrl = projectTask.relativeIssueUrl;
                issue.serviceUrl = projectTask.integrationUrl;
                issue.showIssueId = projectTask.showIssueId;
            }
        }
        this._newIssue = issue;
        this.fillCreateForm(projectId);
        this.focusCreatingForm();
    }
    getDuration(startTime) {
        const startDate = startTime instanceof Date ? startTime : new Date(startTime);
        const result = new Date().getTime() - startDate.getTime();
        return result > 0 ? result : 0;
    }
    toDurationString(startTime) {
        const MINUTE = 1000 * 60;
        const HOUR = MINUTE * 60;
        const duration = this.getDuration(startTime);
        const hours = Math.floor(duration / HOUR);
        const minutes = Math.floor((duration - hours * HOUR) / MINUTE);
        const result = [];
        if (hours) {
            result.push(hours + ' h');
        }
        result.push(minutes + ' min');
        return result.join(' ');
    }
    isLongRunning(startTime) {
        const HOUR = 1000 * 60 * 60;
        const LONG_RUNNING_DURATION = this._constants.maxTimerHours * HOUR;
        const duration = this.getDuration(startTime);
        return duration >= LONG_RUNNING_DURATION;
    }
    toLongRunningDurationString(startTime) {
        const duration = this.getDuration(startTime);
        const now = new Date();
        const durationToday = this.getDuration(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
        const durationYesterday = this.getDuration(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
        const startDate = new Date(startTime);
        let result = '';
        if (duration <= durationToday) {
            result = 'Started today';
        }
        else if (duration <= durationYesterday) {
            result = 'Started yesterday';
        }
        else {
            result = 'Started ' + this._weekdaysShort[startDate.getDay()] + ', ' + startDate.getDate() + ' ' + this._monthsShort[startDate.getMonth()];
        }
        let hours = startDate.getHours();
        const minutes = startDate.getMinutes();
        if (this._timeFormat == 'H:mm') {
            result += ' at ' + hours + ':' + (minutes < 10 ? '0' + minutes : minutes);
        }
        else {
            let period;
            if (hours >= 12) {
                period = 'pm';
                hours -= 12;
            }
            else {
                period = 'am';
            }
            result += ' at ' + (hours == 0 ? 12 : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes) + ' ' + period;
        }
        return result;
    }
    toDescription(description) {
        return description || '(No description)';
    }
    toProjectName(projectId) {
        if (projectId && this._projects) {
            const projects = this._projects.filter(_ => _.projectId === projectId);
            if (projects.length) {
                return projects[0].projectName;
            }
        }
        return '';
    }
    getProject(id) {
        let project = null;
        if (this._projects) {
            const projects = this._projects.filter(project => project.projectId === id);
            if (projects.length) {
                project = projects[0];
            }
        }
        return project;
    }
    getClient(id) {
        if (this._clients) {
            const clients = this._clients.filter(client => client.clientId === id);
            if (clients.length) {
                return clients[0];
            }
        }
        return null;
    }
    getTag(id) {
        if (this._tags) {
            const tags = this._tags.filter(tag => tag.tagId === id);
            if (tags.length) {
                return tags[0];
            }
        }
        return null;
    }
    makeTimerTagsElement(timerTags) {
        const sortedTags = timerTags.map(id => this.getTag(id))
            .filter(tag => !!tag)
            .sort(this.compareTags);
        const container = $('<span>');
        sortedTags.forEach(tag => {
            const span = $('<span>').addClass('tag').addClass('tag-default');
            if (tag.isWorkType) {
                const i = $('<i>').addClass('tag-icon').addClass('fa fa-dollar');
                span.append(i);
            }
            span.append($('<span>').text(tag.tagName));
            container.append(span);
        });
        return container;
    }
    makeTagItem(name, isWorkType) {
        return {
            id: name,
            text: name,
            isWorkType: !!isWorkType
        };
    }
    makeTagItems(projectId = null) {
        const items = [];
        const accountTagNames = {};
        const projectWorkTypeIds = {};
        const project = this.getProject(projectId);
        if (project) {
            project.workTypeIdentifires.forEach(id => {
                projectWorkTypeIds[id] = true;
            });
        }
        this._tags.forEach(tag => {
            const key = tag.tagName.toLowerCase();
            accountTagNames[key] = true;
            if (!project || !tag.isWorkType || projectWorkTypeIds[tag.tagId]) {
                items.push(this.makeTagItem(tag.tagName, tag.isWorkType));
            }
        });
        if (this._canCreateTags && this._newIssue.tagNames) {
            this._newIssue.tagNames.forEach(tagName => {
                const key = tagName.toLowerCase();
                if (!accountTagNames[key]) {
                    items.push(this.makeTagItem(tagName, false));
                }
            });
        }
        return items;
    }
    makeTagSelectedItems() {
        return this._newIssue.tagNames || [];
    }
    initProjectSelector(defaultProjectId) {
        const query = this._forms.create + ' .project .input';
        let existingProjectId;
        const newProjectName = this._newIssue && this._newIssue.projectName;
        const items = [];
        if (this._canCreateProjects) {
            items.push(this.createProjectOption);
        }
        items.push(this.noProjectOption);
        items.push(...this._projects.map(project => {
            const projectCode = project.projectCode ? ` [${project.projectCode}]` : '';
            const projectClient = project.clientId ? ` / ${this.getClient(project.clientId).clientName}` : '';
            if (newProjectName && project.projectName.toLowerCase() == newProjectName.toLowerCase()) {
                existingProjectId = project.projectId;
            }
            return { id: project.projectId, text: project.projectName + projectCode + projectClient };
        }));
        if (!defaultProjectId) {
            if (existingProjectId) {
                defaultProjectId = existingProjectId;
            }
            else if (this.isPagePopup && this._canCreateProjects && newProjectName) {
                defaultProjectId = this.createProjectOption.id;
            }
            else {
                defaultProjectId = this.noProjectOption.id;
            }
        }
        $(query)
            .empty()
            .select2({
            data: items,
            templateSelection: (options) => this.formatSelectedProject(options),
            templateResult: (options) => this.formatProjectItem(options)
        })
            .val(defaultProjectId.toString())
            .trigger('change');
        const data = $(query).select2('data');
        const selectedItem = data[0];
        if (selectedItem) {
            selectedItem.selected = true;
        }
    }
    formatProjectItem(data) {
        const id = parseInt(data.id);
        if (!id) {
            return $('<span>').text(data.text);
        }
        if (id == -1) {
            return $('<strong>').text(data.text);
        }
        return this.formatExistingProject(data, true);
    }
    formatSelectedProject(data) {
        const id = parseInt(data.id);
        if (!id) {
            return $('<span class="mute-text">').text('Select project');
        }
        if (id == -1) {
            return $('<span>').text(data.text);
        }
        return this.formatExistingProject(data, false);
    }
    formatExistingProject(data, includeCodeAndClient) {
        const projectId = parseInt(data.id);
        const result = $('<span class="flex-container-with-overflow" />');
        const projectPartsContainer = $('<span class="text-overflow" />');
        const project = this.getProject(projectId);
        const avatarElement = this.formatProjectAvatar(project);
        result.append(avatarElement);
        const projectName = project ? project.projectName : data.text;
        const projectNameElement = $('<span class="text-overflow">').text(projectName);
        projectPartsContainer.append(projectNameElement);
        let projectTitle = projectName;
        if (project && includeCodeAndClient) {
            if (project.projectCode) {
                const projectCode = ' [' + project.projectCode + ']';
                const projectCodeElement = $('<span />').text(projectCode);
                projectPartsContainer.append(projectCodeElement);
                projectTitle += projectCode;
            }
            if (project.clientId) {
                const projectClient = ' / ' + this.getClient(project.clientId).clientName;
                const projectClientElement = $('<span class="text-muted" />').text(projectClient);
                projectPartsContainer.append(projectClientElement);
                projectTitle += projectClient;
            }
        }
        projectPartsContainer.attr('title', projectTitle);
        result.append(projectPartsContainer);
        return result;
    }
    formatExistingProjectCompact(id) {
        const result = $('<span class="" />');
        const project = this.getProject(id);
        result.append(this.formatProjectAvatar(project));
        const name = project ? project.projectName : '';
        result.append(name);
        result.attr('title', name);
        return result;
    }
    formatProjectAvatar(project) {
        let avatarUrl = project && project.avatar || 'Content/Avatars/project.svg';
        avatarUrl = avatarUrl.replace(/^\//, '');
        if (!/^https?:/.test(avatarUrl)) {
            avatarUrl = `${this._constants.storageUrl}${avatarUrl}`;
        }
        if (!/\.svg$/.test(avatarUrl)) {
            avatarUrl = avatarUrl.replace(/(.+)(\.\w+)$/, '$1~s48$2');
        }
        return $(`<img src="${avatarUrl}" />`).addClass('project-avatar-image');
    }
    initTagSelector(projectId = null) {
        const query = this._forms.create + ' .tags';
        const items = this.makeTagItems(projectId);
        const selectedItems = this.makeTagSelectedItems();
        const allowNewItems = this._canCreateTags;
        this._selectedTagNames = selectedItems;
        $(query + ' .input')
            .empty()
            .select2({
            data: items,
            tags: allowNewItems,
            matcher: (a, b) => {
                const params = a;
                const option = b;
                const term = $.trim(params.term || "").toLowerCase();
                const text = $(option.element).text().toLowerCase();
                const isSelected = !!(option.element && option.element.selected);
                const isTermIncluded = text.length >= term.length && text.indexOf(term) > -1;
                const isEqual = text == term;
                if ((isSelected && isEqual) ||
                    (!isSelected && isTermIncluded)) {
                    return option;
                }
                return null;
            },
            createTag: (params) => {
                const name = $.trim(params.term);
                if (name) {
                    const foundOptions = $(query)
                        .find('option')
                        .filter((i, option) => $(option).text().toLowerCase() == name.toLowerCase());
                    if (!foundOptions.length) {
                        return this.makeTagItem(name);
                    }
                }
            },
            templateSelection: (options) => this.formatTag(options, false),
            templateResult: (options) => this.formatTag(options, true)
        })
            .val(selectedItems)
            .trigger('change');
        $(query + ' .select2-search__field').attr('maxlength', 50);
    }
    formatTag(data, useIndentForTag) {
        const textSpan = $('<span>').text(data.text);
        if (data.isWorkType) {
            const i = $('<i>').addClass('tag-icon').addClass('fa fa-dollar');
            return $('<span>').append(i).append(textSpan);
        }
        if (useIndentForTag) {
            textSpan.addClass('tag-without-icon');
        }
        return textSpan;
    }
    showRequiredInputError(query) {
        const field = $(query);
        const fieldInput = $('.input', field);
        field.addClass('error');
        fieldInput.focus();
        if (!field.hasClass('validated')) {
            field.addClass('validated');
            fieldInput.on('input', (event) => {
                field.toggleClass('error', !$(event.target).val());
            });
        }
    }
    showRequiredSelectError(query) {
        const field = $(query);
        const fieldSelect = $('.input', field);
        field.addClass('error');
        fieldSelect.select2('open').select2('close');
        if (!field.hasClass('validated')) {
            field.addClass('validated');
            fieldSelect.on('change', (event) => {
                field.toggleClass('error', $(event.target).val() == 0);
            });
        }
    }
    checkRequiredFields(timer) {
        $(this._forms.create + ' .error').removeClass('error');
        if (this._requiredFields.description && !timer.issueName && !timer.description) {
            this.showRequiredInputError(this._forms.create + ' .description');
        }
        else if (this._requiredFields.project && !timer.projectName) {
            if ($(this._forms.create + ' .project .input').val() == -1) {
                this.showRequiredInputError(this._forms.create + ' .new-project');
            }
            else {
                this.showRequiredSelectError(this._forms.create + ' .project');
            }
        }
        else if (this._requiredFields.tags && (!timer.tagNames || !timer.tagNames.length)) {
            this.showRequiredSelectError(this._forms.create + ' .tags');
        }
        return $(this._forms.create + ' .error').length == 0;
    }
    initControls() {
        $('#site-link').click(() => (this.onSiteLinkClick(), false));
        $('#task-link').click(() => (this.onTaskLinkClick(), false));
        $('#login').click(() => (this.onLoginClick(), false));
        $('#retry').click(() => (this.onRetryClick(), false));
        $('#fix').click(() => (this.onFixClick(), false));
        $('#start').click(() => (this.onStartClick(), false));
        $('#stop').click(() => (this.onStopClick(), false));
        $('#create').click(() => (this.onCreateClick(), false));
        $(this._forms.create + ' .project .input').change(() => (this.onProjectSelectChange(), false));
        $(this._forms.create + ' .tags .input').change(() => (this.onTagsSelectChange(), false));
        $('.cancel-btn').click(() => (this.onCancelClick(), false));
        $('#settings-btn').click(() => (this.onSettingsClick(), false));
        $('#integrate-webtool').click(() => (this.onIntegrateWebToolClick(), false));
        this.initDropdown('#account-selector', (accountId) => {
            this.changeAccount(accountId);
        });
        this.initDropdown('#recent-task-selector', (index) => {
            this.fillFormWithRecentTask(index);
        });
        $('#clear-create-form').click(() => this.onClearCreateFormClick());
        window.addEventListener('keydown', event => {
            if (event.keyCode == 27) {
                if (!$('body > .select2-container').length) {
                    this.close();
                }
            }
        }, true);
    }
    initDropdown(selector, onItemClick) {
        const dropdown = $(selector);
        const toggle = $('.dropdown-toggle', dropdown);
        const toggleIcon = $('.fa', toggle);
        const menu = $('.dropdown-menu', dropdown);
        function checkCloseClick(event) {
            if (!$(event.target).closest(dropdown).length) {
                toggleDropdown(false);
            }
        }
        function toggleDropdown(open) {
            dropdown.toggleClass('open', open);
            toggleIcon.toggleClass('fa-angle-up', open);
            toggleIcon.toggleClass('fa-angle-down', !open);
            if (open) {
                $(document.body).on('click', checkCloseClick);
            }
            else {
                $(document.body).off('click', checkCloseClick);
            }
        }
        toggle.click(() => {
            if (toggle.prop('disabled')) {
                return;
            }
            const isOpen = dropdown.hasClass('open');
            toggleDropdown(!isOpen);
        });
        menu.click(event => {
            const target = $(event.target);
            const item = target.hasClass('dropdown-menu-item') ? target : target.closest('.dropdown-menu-item');
            if (!item.length) {
                return;
            }
            const value = $(item).attr('data-value');
            onItemClick(value);
            toggleDropdown(false);
        });
    }
    onCancelClick() {
        this.close();
    }
    onSettingsClick() {
        this.openOptionsPage();
    }
    onIntegrateWebToolClick() {
        return __awaiter(this, void 0, void 0, function* () {
            const manager = new PermissionManager();
            const map = WebToolManager.toServiceTypesMap([this._possibleWebTool]);
            const result = yield manager.requestPermissions(map);
            if (result) {
                this.close();
            }
        });
    }
    onProjectSelectChange() {
        const newProjectContainer = $(this._forms.create + ' .new-project');
        const newProjectInput = $('.input', newProjectContainer);
        const value = parseInt($(this._forms.create + ' .project .input').val());
        if (value == -1) {
            const issueProjectName = (this._newIssue.projectName) || '';
            newProjectInput.val(issueProjectName);
            newProjectContainer.css('display', 'block');
        }
        else {
            newProjectContainer.css('display', 'none');
        }
        this.initTagSelector(value);
    }
    onTagsSelectChange() {
        const select = $(this._forms.create + ' .tags .input');
        const oldTagNames = this._selectedTagNames;
        const newTagNames = (select.val() || []);
        const addedTagNames = newTagNames.filter(_ => oldTagNames.indexOf(_) < 0);
        const oldWorkTypeName = oldTagNames.find(tagName => {
            const tag = this._tagsByName[tagName];
            return tag && tag.isWorkType;
        });
        const newWorkTypeName = addedTagNames.find(tagName => {
            const tag = this._tagsByName[tagName];
            return tag && tag.isWorkType;
        });
        const filteredWorkTypeName = newWorkTypeName || oldWorkTypeName;
        const filteredTagNames = newTagNames.filter(tagName => {
            const tag = this._tagsByName[tagName];
            return !tag || !tag.isWorkType || tag.tagName == filteredWorkTypeName;
        });
        this._selectedTagNames = filteredTagNames;
        if (newTagNames.length != filteredTagNames.length) {
            select.val(filteredTagNames).trigger('change');
        }
    }
    onSiteLinkClick() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.openTrackerAction();
            this.close();
        });
    }
    onTaskLinkClick() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = $('#task-link').attr('href');
            if (url) {
                yield this.openPageAction(url);
                this.close();
            }
        });
    }
    onLoginClick() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loginAction();
            this.close();
        });
    }
    onRetryClick() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.retryAction();
            this.close();
        });
    }
    onFixClick() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.fixTimerAction();
            this.close();
        });
    }
    onStartClick() {
        const timer = Object.assign({}, this._newIssue);
        const selectedProject = $(this._forms.create + ' .project .input').select2('data')[0];
        const selectedProjectId = Number(selectedProject.id);
        if (!selectedProject || !selectedProject.selected || !selectedProjectId) {
            timer.projectName = '';
        }
        else if (selectedProjectId > 0) {
            const project = this._projects.filter(_ => _.projectId == selectedProjectId)[0];
            timer.projectName = project && project.projectName;
            timer.projectId = project && project.projectId;
        }
        else {
            timer.projectName = $.trim($(this._forms.create + ' .new-project .input').val());
        }
        timer.isStarted = true;
        timer.description = $(this._forms.create + ' .description .input').val();
        timer.tagNames = $(this._forms.create + ' .tags .input').select().val() || [];
        if (!this.checkRequiredFields(timer)) {
            return;
        }
        const accountId = this._accountId;
        this.putTimer(accountId, timer).then(() => {
            const projectName = this._newIssue.projectName || '';
            const newProjectName = timer.projectName || '';
            const existingProjects = this._projects.filter(_ => _.projectName == newProjectName);
            const existingProject = existingProjects.find(p => p.projectId == timer.projectId) || existingProjects[0];
            if (newProjectName == projectName && existingProjects.length < 2) {
                this.saveProjectMapAction({ accountId, projectName, projectId: null });
            }
            else if (existingProject) {
                this.saveProjectMapAction({ accountId, projectName, projectId: existingProject.projectId });
            }
            if (timer.issueId && timer.description != this._newIssue.description) {
                this.saveDescriptionMapAction({
                    taskName: this._newIssue.issueName,
                    description: timer.description
                });
            }
        });
    }
    onStopClick() {
        this.putTimer(this._profile.activeAccountId, { isStarted: false });
    }
    onCreateClick() {
        this.switchState(this._states.creating);
    }
    onClearCreateFormClick() {
        this._newIssue = {};
        this.fillCreateForm(null);
        this.focusCreatingForm();
    }
}
