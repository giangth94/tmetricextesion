var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class WebToolManager {
    static toOrigin(input) {
        if (!input) {
            return;
        }
        const match = WebToolManager.urlRe.exec(input);
        if (!match) {
            return;
        }
        const [all, protocol = 'https://', host, port = ''] = match;
        if (!host) {
            return;
        }
        if (['http://', 'https://'].indexOf(protocol) < 0) {
            return;
        }
        return `${protocol}${host}${port}/*`;
    }
    static toServiceUrl(input) {
        if (!input) {
            return;
        }
        const match = WebToolManager.urlRe.exec(input);
        if (!match) {
            return;
        }
        const [all, protocol = 'https://', host, port = ''] = match;
        let path = match[4] || '/';
        if (!path.endsWith('*')) {
            path += '*';
        }
        if (!path.endsWith('/*')) {
            path = path.replace(/\*$/, '/*');
        }
        if (!host) {
            return;
        }
        if (['http://', 'https://'].indexOf(protocol) < 0) {
            return;
        }
        return `${protocol}${host}${port}${path}`;
    }
    static toUrlRegExp(url) {
        const pattern = '^' + url
            .replace(/[\/\.]/g, '\\$&')
            .replace(/\*/g, '.+');
        return new RegExp(pattern, 'i');
    }
    static isMatch(url, origin) {
        const urlOrigin = this.toOrigin(url);
        const originRegExp = this.toUrlRegExp(origin);
        return originRegExp.test(urlOrigin);
    }
    static toServiceTypesMap(webTools) {
        return webTools.reduce((map, webTool) => webTool.origins.map(origin => map[origin] = webTool.serviceType) && map, {});
    }
    static isAllowed(origins) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => chrome.permissions.contains({ origins }, resolve));
        });
    }
    static _getServiceTypes(callback) {
        chrome.storage.local.get({ serviceTypes: {} }, ({ serviceTypes }) => {
            this.serviceTypes = serviceTypes;
            callback && callback(serviceTypes);
        });
    }
    static _setServiceTypes(serviceTypes, callback) {
        this.serviceTypes = serviceTypes;
        chrome.storage.local.set({ serviceTypes: serviceTypes }, () => {
            callback && callback();
        });
    }
    static getServiceTypes() {
        return new Promise(resolve => this._getServiceTypes(resolve));
    }
    static onStoreChange(changes, areaName) {
        if (areaName != 'local') {
            return;
        }
        const serviceTypes = changes['serviceTypes'];
        if (serviceTypes) {
            WebToolManager.serviceTypes = serviceTypes.newValue;
        }
    }
    static getServiceUrls(serviceTypes = this.serviceTypes) {
        const serviceUrls = Object.keys(serviceTypes).sort().reduce((map, url) => {
            const serviceType = serviceTypes[url];
            let urls = map[serviceType] || [];
            urls.push(url);
            map[serviceType] = urls;
            return map;
        }, {});
        return serviceUrls;
    }
    static addServiceTypes(serviceTypes) {
        return this.updateServiceTypes(serviceTypes);
    }
    static removeServiceTypes(serviceTypes) {
        return this.updateServiceTypes(undefined, serviceTypes);
    }
    static toOriginServiceTypesMap(serviceTypesMap) {
        return Object.keys(serviceTypesMap).reduce((map, url) => {
            const serviceType = serviceTypesMap[url];
            const origin = WebToolManager.toOrigin(url);
            map[origin] = (map[origin] || []).concat(serviceType);
            return map;
        }, {});
    }
    static updateServiceTypes(serviceTypesAdded = {}, serviceTypesRemoved = {}) {
        const serviceTypes = this.serviceTypes;
        Object.keys(serviceTypesAdded).forEach(serviceUrl => serviceTypes[serviceUrl] = serviceTypesAdded[serviceUrl]);
        Object.keys(serviceTypesRemoved).forEach(serviceUrl => delete serviceTypes[serviceUrl]);
        const origins = this.toOriginServiceTypesMap(serviceTypes);
        const originsAdded = this.toOriginServiceTypesMap(serviceTypesAdded);
        const originsRemoved = this.toOriginServiceTypesMap(serviceTypesRemoved);
        Object.keys(originsAdded).forEach(origin => {
            if (originsAdded[origin] && originsRemoved[origin]) {
                delete originsAdded[origin];
                delete originsRemoved[origin];
            }
        });
        Object.keys(originsRemoved).forEach(origin => {
            if (origins[origin]) {
                delete originsRemoved[origin];
            }
        });
        this._setServiceTypes(serviceTypes);
        return { originsAdded, originsRemoved };
    }
    static cleanupServiceTypes() {
        return __awaiter(this, void 0, void 0, function* () {
            const serviceTypes = yield this.getServiceTypes();
            yield Promise.all(Object.keys(serviceTypes).map(origin => this.isAllowed([origin]).then(result => !result && delete serviceTypes[origin])));
            this._setServiceTypes(serviceTypes);
        });
    }
}
WebToolManager.urlRe = /^([^:]+:\/\/)?([^:/?#]+)(:\d+)?(\/[^?#]*)?(\?[^?#]*)?(\#[^?#]*)?$/i;
WebToolManager.serviceTypes = (() => {
    chrome.storage.onChanged.addListener(WebToolManager.onStoreChange);
    WebToolManager._getServiceTypes();
    return {};
})();
