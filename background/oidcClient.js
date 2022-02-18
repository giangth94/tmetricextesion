var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class OidcClient {
    static init(authorityUrl) {
        this.authorityUrl = authorityUrl;
    }
    static isLoggedIn() {
        return Promise.all([
            this.getStorageValue('access_token'),
            this.getStorageValue('refresh_token')
        ]).then(tokens => tokens.every(_ => !!_));
    }
    static getLoginUrl() {
        return `${this.authorityUrl}extension/login.html`;
    }
    static getTokensByAuthorizationCode(authorizationCode) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${this.authorityUrl}core/connect/token`);
            xhr.onload = () => {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText));
                }
                else {
                    reject(xhr.status);
                }
            };
            xhr.onerror = () => {
                reject(xhr.status);
            };
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.send(`client_id=browser_extension&grant_type=authorization_code&code=${authorizationCode}&redirect_uri=${this.authorityUrl}extension/callback.html`);
        });
    }
    static getTokensByRefresh(refreshToken) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${this.authorityUrl}core/connect/token`);
            xhr.onload = () => {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText));
                }
                else {
                    reject(xhr.status);
                }
            };
            xhr.onerror = () => {
                reject(xhr.status);
            };
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.send(`client_id=browser_extension&grant_type=refresh_token&refresh_token=${refreshToken}&redirect_uri=${this.authorityUrl}extension/callback.html`);
        });
    }
    static getStorageValue(key) {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], function (result) {
                resolve(result[key]);
            });
        });
    }
    static setStorageValue(key, value) {
        return new Promise((resolve) => {
            const obj = {};
            obj[key] = value;
            chrome.storage.local.set(obj, function () {
                resolve();
            });
        });
    }
    static authorize() {
        return __awaiter(this, void 0, void 0, function* () {
            const authorizationCode = yield this.getStorageValue('authorization_code');
            if (authorizationCode) {
                yield this.setStorageValue('authorization_code', null);
                const tokens = yield this.getTokensByAuthorizationCode(authorizationCode);
                if (tokens && tokens.refresh_token && tokens.access_token) {
                    yield this.setStorageValue('refresh_token', tokens.refresh_token);
                    yield this.setStorageValue('access_token', tokens.access_token);
                    return true;
                }
            }
            return false;
        });
    }
    static ajax(url, options, dataReq) {
        return __awaiter(this, void 0, void 0, function* () {
            const accessToken = yield this.getStorageValue('access_token');
            if (accessToken) {
                try {
                    return yield this.ajaxInternal(accessToken, url, options, dataReq);
                }
                catch (error) {
                    if (error.statusCode != 401) {
                        throw error;
                    }
                    const refreshToken = yield this.getStorageValue('refresh_token');
                    if (refreshToken) {
                        const tokens = yield this.getTokensByRefresh(refreshToken);
                        if (tokens && tokens.refresh_token && tokens.access_token) {
                            yield this.setStorageValue('refresh_token', tokens.refresh_token);
                            yield this.setStorageValue('access_token', tokens.access_token);
                            return yield this.ajaxInternal(tokens.access_token, url, options, dataReq);
                        }
                    }
                }
            }
            throw 'No credentials to connect';
        });
    }
    static ajaxInternal(token, url, method, dataReq) {
        const settings = {};
        settings.url = url;
        if (dataReq !== undefined) {
            settings.data = JSON.stringify(dataReq);
            settings.contentType = "application/json";
        }
        const isGet = method == 'GET';
        const isPost = method == 'POST';
        settings.headers = {};
        settings.headers['Authorization'] = 'Bearer ' + token;
        if (isGet || isPost) {
            settings.type = method;
        }
        else {
            settings.type = 'POST';
            settings.headers['X-HTTP-Method-Override'] = method;
        }
        return new Promise((callback, reject) => {
            const xhr = $.ajax(settings);
            function fail() {
                const statusCode = xhr.status;
                let statusText = xhr.statusText;
                let responseMessage;
                if (xhr.responseJSON) {
                    responseMessage = xhr.responseJSON.message || xhr.responseJSON.Message;
                }
                if (statusText == 'error') {
                    statusText = '';
                }
                if (statusCode && !statusText) {
                    statusText = ServerConnection.statusDescriptions[statusCode];
                }
                reject({ statusCode, statusText, responseMessage });
            }
            xhr.done(dataRes => {
                if (xhr.status >= 200 && xhr.status < 400) {
                    callback(dataRes);
                }
                else {
                    reject(fail);
                }
            });
            xhr.fail(fail);
        });
    }
}
