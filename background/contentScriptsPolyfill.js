var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
if (typeof chrome === 'object' && !chrome.contentScripts) {
    const contentScriptOptionsStore = [];
    const getContentScriptOptions = function (url) {
        return contentScriptOptionsStore
            .filter(i => i.matches.test(url))
            .map(i => i.options);
    };
    const getRawRegex = function (matchPattern) {
        return '^' + matchPattern
            .replace(/[\-\/\\\^\$\+\?\.\(\)\|\[\]\{\}]/g, '\\$&')
            .replace(/\*/g, '.*');
    };
    const patternToRegex = function (...matchPatterns) {
        return new RegExp(matchPatterns.map(getRawRegex).join('|'), 'i');
    };
    const isOriginPermitted = function (url) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                chrome.permissions.contains({ origins: [new URL(url).origin + '/*'] }, resolve);
            });
        });
    };
    const getInjectedScriptsFunction = function () {
        const scripts = document['tmetricContentScripts'] || {};
        return scripts;
    };
    const setInjectedScriptFunction = function (file) {
        const scripts = document['tmetricContentScripts'] || {};
        scripts[file] = true;
        document['tmetricContentScripts'] = scripts;
    };
    const getInjectedScripts = function (tabId, frameId) {
        return new Promise(resolve => {
            chrome.tabs.executeScript(tabId, {
                frameId,
                code: `(${getInjectedScriptsFunction.toString()})()`,
                runAt: 'document_end'
            }, result => resolve(result[0]));
        });
    };
    const setInjectedScript = function (tabId, frameId, file) {
        return new Promise(resolve => {
            chrome.tabs.executeScript(tabId, {
                frameId,
                code: `(${setInjectedScriptFunction.toString()})('${file}')`,
                runAt: 'document_end'
            }, () => resolve());
        });
    };
    const injectCss = function (tabId, frameId, file) {
        return new Promise(resolve => {
            chrome.tabs.insertCSS(tabId, { frameId, file }, () => setInjectedScript(tabId, frameId, file).then(resolve));
        });
    };
    const injectJs = function (tabId, frameId, file) {
        return new Promise(resolve => {
            chrome.tabs.executeScript(tabId, { frameId, file }, () => setInjectedScript(tabId, frameId, file).then(resolve));
        });
    };
    const injectContentScripts = function (tabId, frameId, options, injectedScripts) {
        return __awaiter(this, void 0, void 0, function* () {
            void 0;
            const isFrame = frameId > 0;
            yield Promise.all(options.map(options => {
                if (isFrame && !options.allFrames) {
                    return;
                }
                return Promise.all([
                    ...(options.css || []).map(({ file }) => !injectedScripts[file] && injectCss(tabId, frameId, file)),
                    ...(options.js || []).map(({ file }) => !injectedScripts[file] && injectJs(tabId, frameId, file))
                ]);
            }));
        });
    };
    const checkInProgress = {};
    const checkFrame = function (tabId, frameId, url) {
        return __awaiter(this, void 0, void 0, function* () {
            void 0;
            if (checkInProgress[`${tabId}-${frameId}`]) {
                void 0;
                return;
            }
            checkInProgress[`${tabId}-${frameId}`] = true;
            const options = getContentScriptOptions(url);
            if (options.length) {
                if (yield isOriginPermitted(url)) {
                    const scripts = yield getInjectedScripts(tabId, frameId);
                    yield injectContentScripts(tabId, frameId, options, scripts);
                }
            }
            delete checkInProgress[`${tabId}-${frameId}`];
        });
    };
    const onNavigation = function (details) {
        const { tabId, frameId, url } = details;
        checkFrame(tabId, frameId, url);
    };
    const addWebNavigationListeners = function () {
        chrome.webNavigation.onCompleted.addListener(onNavigation);
    };
    const addMessageListener = function () {
        chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
            if (!sender.tab) {
                return;
            }
            if (message.action == 'checkContentScripts') {
                checkFrame(sender.tab.id, sender.frameId, sender.url);
                senderResponse(null);
            }
        });
    };
    addWebNavigationListeners();
    addMessageListener();
    chrome.contentScripts = {
        register(contentScriptOptions, callback) {
            return __awaiter(this, void 0, void 0, function* () {
                const { matches } = contentScriptOptions;
                const matchesRegex = patternToRegex(...matches);
                const item = { matches: matchesRegex, options: contentScriptOptions };
                contentScriptOptionsStore.push(item);
                const registeredContentScript = {
                    unregister() {
                        return __awaiter(this, void 0, void 0, function* () {
                            const index = contentScriptOptionsStore.indexOf(item);
                            if (index > -1) {
                                contentScriptOptionsStore.splice(index, 1);
                            }
                        });
                    }
                };
                if (typeof callback === 'function') {
                    callback(registeredContentScript);
                }
                return Promise.resolve(registeredContentScript);
            });
        }
    };
}
