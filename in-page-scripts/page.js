if (typeof window != 'undefined' && !window.initPage) {
    let oldUrl = '';
    let oldTitle = '';
    let changeCheckerHandle;
    let mutationObserver;
    const pingTimeouts = {};
    let isInitialized = false;
    let isFinalized = false;
    let parseAfterPings = true;
    window.initPage = function () {
        function onBackgroundMessage(message) {
            if (isFinalized) {
                return;
            }
            if (pingTimeouts[message.action]) {
                clearTimeout(pingTimeouts[message.action]);
                pingTimeouts[message.action] = null;
            }
            if (message.action == 'initPage') {
                window.sendBackgroundMessagee({ action: 'getConstants' });
                window.sendBackgroundMessagee({ action: 'getTimer' });
                return;
            }
            if (message.action == 'setTimer') {
                IntegrationService.setTimer(message.data);
                if (IntegrationService.needsUpdate()) {
                    parseAfterPings = true;
                }
            }
            else if (message.action == 'setIssuesDurations') {
                IntegrationService.setIssuesDurations(message.data);
            }
            else if (message.action == 'setConstants') {
                const constants = message.data;
                IntegrationService.setConstants(constants);
            }
            if (parseAfterPings) {
                window.parsePage();
            }
            initialize();
        }
        chrome.runtime.onMessage.addListener(onBackgroundMessage);
        window.sendBackgroundMessagee = function (message) {
            const callbackAction = message.action + '_callback';
            if (pingTimeouts[callbackAction]) {
                clearTimeout(pingTimeouts[callbackAction]);
            }
            pingTimeouts[callbackAction] = setTimeout(() => finalize(), 30000);
            try {
                chrome.runtime.sendMessage(message, response => {
                    const error = chrome.runtime.lastError;
                    if (error) {
                        void 0;
                    }
                });
            }
            catch (e) {
                finalize();
            }
        };
        function startCheckChanges() {
            if (changeCheckerHandle == null) {
                changeCheckerHandle = setInterval(() => {
                    if (document.title != oldTitle || document.URL != oldUrl) {
                        window.parsePage();
                    }
                    if (!document.hasFocus()) {
                        clearInterval(changeCheckerHandle);
                        changeCheckerHandle = null;
                    }
                }, 100);
            }
        }
        function initialize() {
            if (!isInitialized && !isFinalized) {
                isInitialized = true;
                window.addEventListener('focus', startCheckChanges);
                if (document.hasFocus()) {
                    startCheckChanges();
                }
            }
        }
        function finalize() {
            isFinalized = true;
            for (const ping in pingTimeouts) {
                if (pingTimeouts[ping]) {
                    clearTimeout(pingTimeouts[ping]);
                    pingTimeouts[ping] = null;
                }
            }
            if (mutationObserver) {
                mutationObserver.disconnect();
                mutationObserver = null;
            }
            window.removeEventListener('focus', startCheckChanges);
            if (changeCheckerHandle != null) {
                clearInterval(changeCheckerHandle);
                changeCheckerHandle = null;
            }
        }
        function parsePage() {
            for (const ping in pingTimeouts) {
                if (pingTimeouts[ping]) {
                    parseAfterPings = true;
                    return;
                }
            }
            parseAfterPings = false;
            const url = document.URL;
            const title = document.title;
            const checkAllIntegrations = url != oldUrl;
            oldUrl = url;
            oldTitle = title;
            const { issues, observeMutations } = IntegrationService.updateLinks(checkAllIntegrations);
            if (!isFinalized && observeMutations && !mutationObserver) {
                mutationObserver = new MutationObserver(parsePage);
                mutationObserver.observe(document, { childList: true, subtree: true });
            }
        }
        IntegrationService.onIssueLinksUpdated = () => {
            if (mutationObserver) {
                mutationObserver.takeRecords();
            }
        };
        window.parsePage = parsePage;
        IntegrationService.clearPage();
        window.sendBackgroundMessagee({ action: 'getConstants' });
        window.sendBackgroundMessagee({ action: 'getTimer' });
    };
}
