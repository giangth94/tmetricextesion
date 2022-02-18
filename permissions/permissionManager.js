class PermissionManager {
    request(origins) {
        return typeof browser != 'undefined' ?
            browser.permissions.request({ origins }) :
            new Promise(resolve => chrome.permissions.request({ origins }, result => resolve(result)));
    }
    remove(origins) {
        return typeof browser != 'undefined' ?
            browser.permissions.remove({ origins }) :
            new Promise(resolve => chrome.permissions.remove({ origins }, result => resolve(result)));
    }
    requestPermissions(serviceTypes) {
        const { originsAdded } = WebToolManager.addServiceTypes(serviceTypes);
        return this.request(Object.keys(originsAdded));
    }
    removePermissions(serviceTypes) {
        const { originsRemoved } = WebToolManager.removeServiceTypes(serviceTypes);
        return this.remove(Object.keys(originsRemoved));
    }
    updatePermissions(serviceTypesAdded, serviceTypesRemoved) {
        const { originsAdded, originsRemoved } = WebToolManager.updateServiceTypes(serviceTypesAdded, serviceTypesRemoved);
        return Promise.all([
            this.request(Object.keys(originsAdded)),
            this.remove(Object.keys(originsRemoved)),
        ]);
    }
    cleanupPermissions() {
        let callback;
        chrome.permissions.getAll(allPermissions => {
            const manifest = chrome.runtime.getManifest();
            const requiredPermissions = manifest.permissions.concat(...manifest.content_scripts.map(_ => _.matches));
            const origins = allPermissions.origins.filter(o => requiredPermissions.indexOf(o) < 0);
            chrome.permissions.remove({ origins }, result => callback(result));
        });
        return new Promise(resolve => callback = resolve);
    }
}
