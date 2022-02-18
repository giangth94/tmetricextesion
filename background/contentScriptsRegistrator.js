var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class ContentScriptsRegistrator {
    constructor() {
        this.scripts = {};
        if (!ContentScriptsRegistrator.instance) {
            ContentScriptsRegistrator.instance = this;
            chrome.permissions.onAdded.addListener(event => this.register(event.origins));
            chrome.permissions.onRemoved.addListener(event => this.unregister(event.origins));
        }
        return ContentScriptsRegistrator.instance;
    }
    addRequiredScriptOptions(scripts) {
        const js = [
            { file: 'in-page-scripts/utils.js' },
            { file: 'in-page-scripts/integrationService.js' },
            { file: 'in-page-scripts/page.js' },
            ...(scripts.js || []),
            { file: 'in-page-scripts/init.js' }
        ];
        const css = [
            { file: 'css/timer-link.css' },
            ...(scripts.css || [])
        ];
        const origins = Object.keys(scripts.matches.reduce((map, url) => (map[WebToolManager.toOrigin(url)] = true) && map, {}));
        return [
            {
                matches: scripts.matches,
                js: js,
                css: css,
                allFrames: scripts.allFrames || false,
                runAt: 'document_end'
            },
            {
                matches: origins,
                js: [
                    { file: 'in-page-scripts/topmostPage.js' }
                ],
                allFrames: false,
                runAt: scripts.runAt
            }
        ];
    }
    register(origins) {
        return __awaiter(this, void 0, void 0, function* () {
            void 0;
            yield this.unregister(origins);
            const serviceTypes = yield WebToolManager.getServiceTypes();
            const serviceTypeUrls = Object.keys(serviceTypes);
            const serviceTypeUrlRegExps = serviceTypeUrls.reduce((map, url) => (map[url] = WebToolManager.toUrlRegExp(url)) && map, {});
            const webToolDescriptions = getWebToolDescriptions().reduce((map, item) => (map[item.serviceType] = item) && map, {});
            let serviceUrls = serviceTypeUrls;
            if (origins) {
                serviceUrls = serviceUrls.filter(url => origins.some(origin => WebToolManager.isMatch(url, origin)));
            }
            serviceUrls = serviceUrls.filter(a => {
                return serviceTypeUrls.every(b => {
                    return b == a
                        || serviceTypes[b] != serviceTypes[a]
                        || !serviceTypeUrlRegExps[b].test(a);
                });
            });
            serviceUrls = (yield Promise.all(serviceUrls.map(serviceUrl => new Promise(resolve => chrome.permissions.contains({ origins: [serviceUrl] }, result => resolve(result ? serviceUrl : null)))))).filter(item => !!item);
            void 0;
            serviceUrls.forEach((serviceUrl) => __awaiter(this, void 0, void 0, function* () {
                const serviceType = serviceTypes[serviceUrl];
                const webToolDescription = webToolDescriptions[serviceType];
                if (!webToolDescription || !webToolDescription.scripts) {
                    return;
                }
                const scripts = webToolDescription.scripts;
                const matches = [serviceUrl];
                const options = {
                    allFrames: scripts.allFrames,
                    js: (scripts.js || []).map(file => ({ file })),
                    css: (scripts.css || []).map(file => ({ file })),
                    matches: matches
                };
                const scriptsOptions = this.addRequiredScriptOptions(options);
                this.scripts[serviceUrl] = [...yield Promise.all(scriptsOptions.map(this.registerInternal))];
                this.checkContentScripts(matches, scripts.allFrames);
            }));
        });
    }
    unregister(origins) {
        return __awaiter(this, void 0, void 0, function* () {
            void 0;
            const serviceUrls = Object.keys(this.scripts).filter(url => origins ? origins.some(origin => WebToolManager.isMatch(url, origin)) : true);
            serviceUrls.forEach(serviceUrl => {
                const script = this.scripts[serviceUrl];
                if (!script) {
                    return;
                }
                script.forEach(s => s.unregister());
                delete this.scripts[serviceUrl];
            });
        });
    }
    registerInternal(options) {
        let method;
        if (typeof browser === 'object' && browser.contentScripts) {
            method = browser.contentScripts.register;
        }
        else if (typeof chrome === 'object' && chrome.contentScripts) {
            method = chrome.contentScripts.register;
        }
        else {
            method = (options) => Promise.resolve({ unregister: () => undefined });
        }
        return method(options);
    }
    checkContentScripts(matches, allFrames) {
        void 0;
        if (typeof browser === 'object' && browser.contentScripts) {
        }
        else if (typeof chrome === 'object' && chrome.contentScripts) {
            chrome.tabs.query({ url: matches, status: 'complete' }, tabs => {
                tabs.forEach(tab => {
                    void 0;
                    chrome.tabs.executeScript(tab.id, {
                        code: `chrome.runtime.sendMessage({action:'checkContentScripts'})`,
                        allFrames
                    });
                });
            });
        }
    }
}
