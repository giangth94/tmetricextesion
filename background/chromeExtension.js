class ChromeExtension extends ExtensionBase {
    constructor() {
        super();
        const patternToRegExp = (matchPattern) => new RegExp('^' + matchPattern
            .replace(/[\-\/\\\^\$\+\?\.\(\)\|\[\]\{\}]/g, '\\$&')
            .replace(/\*/g, '.*'));
        let contentScripts = chrome.runtime.getManifest().content_scripts
            .map(group => Object.assign({
            regexp_matches: (group.matches || []).map(patternToRegExp),
            regexp_exclude_matches: (group.exclude_matches || []).map(patternToRegExp)
        }, group));
        chrome.tabs.query({}, tabs => tabs && tabs.forEach(tab => {
            let loadedFiles = {};
            contentScripts.forEach(group => {
                let jsFiles = (group.js || []).filter(path => !loadedFiles[path]);
                let cssFiles = (group.css || []).filter(path => !loadedFiles[path]);
                let runAt = group.run_at;
                const isMatched = (regexps) => regexps.some(r => r.test(tab.url));
                if (isMatched(group.regexp_matches) && !isMatched(group.regexp_exclude_matches)) {
                    jsFiles.forEach(file => {
                        chrome.tabs.executeScript(tab.id, { file, runAt });
                        loadedFiles[file] = true;
                    });
                    cssFiles.forEach(file => {
                        chrome.tabs.insertCSS(tab.id, { file });
                        loadedFiles[file] = true;
                    });
                }
            });
        }));
    }
    getBrowserSchema() {
        return 'chrome-extension';
    }
    getExtensionUUID() {
        return chrome.runtime.id;
    }
}
new ChromeExtension();
