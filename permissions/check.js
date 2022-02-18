var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
$(document).ready(() => __awaiter(this, void 0, void 0, function* () {
    const skipPermissionsRequest = yield new Promise(resolve => {
        chrome.storage.local.get({ skipPermissionsRequest: false }, ({ skipPermissionsRequest }) => resolve(skipPermissionsRequest));
    });
    let onClick = () => {
        chrome.tabs.getCurrent(tab => {
            chrome.tabs.remove(tab.id);
        });
    };
    if (!skipPermissionsRequest) {
        const message = {
            action: 'getIntegratedServices'
        };
        const map = yield new Promise(resolve => {
            chrome.runtime.sendMessage(message, resolve);
        });
        onClick = () => __awaiter(this, void 0, void 0, function* () {
            if (map) {
                const permissionManager = new PermissionManager();
                yield permissionManager.requestPermissions(map);
                yield new Promise(resolve => {
                    chrome.storage.local.set({ skipPermissionsRequest: true }, () => resolve());
                });
            }
            window.location.href = chrome.runtime.getURL('permissions/permissions.html');
        });
    }
    $('#continue').click(onClick);
}));
