var $$ = function (selector, element, condition) {
    element = element || document;
    if (!condition) {
        return element.querySelector(selector);
    }
    let nodeList = element.querySelectorAll(selector);
    for (let i = 0; i < nodeList.length; i++) {
        if (condition(nodeList[i])) {
            return nodeList[i];
        }
    }
    return null;
};
$$.try = function (selector, element, condition) {
    return $$(selector, element, condition) || {};
};
$$.create = function (tagName, ...classNames) {
    let element = document.createElement(tagName);
    classNames.push(IntegrationService.affix + '-' + tagName.toLowerCase());
    element.classList.add(...classNames);
    return element;
};
$$.all = function (selector, element) {
    element = element || document;
    let nodeList = element.querySelectorAll(selector);
    let result = [];
    for (let i = nodeList.length - 1; i >= 0; i--) {
        result[i] = nodeList[i];
    }
    return result;
};
$$.visible = function (selector, element) {
    return $$(selector, element, el => {
        if (!el.offsetWidth && !el.offsetHeight && !el.getClientRects().length) {
            return false;
        }
        while (el) {
            if (el === document.body) {
                return true;
            }
            if (el.style.visibility === 'hidden' || el.style.visibility === 'collapse') {
                return false;
            }
            el = el.parentElement;
        }
        return false;
    });
};
$$.closest = function (selector, element, condition) {
    while (element) {
        if (element.matches(selector) && (!condition || condition(element))) {
            return element;
        }
        element = element.parentElement;
    }
};
$$.prev = function (selector, element) {
    while (element) {
        if (element.matches(selector)) {
            return element;
        }
        element = element.previousElementSibling;
    }
};
$$.next = function (selector, element) {
    while (element) {
        if (element.matches(selector)) {
            return element;
        }
        element = element.nextElementSibling;
    }
};
$$.getAttribute = function (selector, attributeName, element) {
    let result;
    let child = $$(selector, element);
    if (child) {
        result = child.getAttribute(attributeName);
    }
    return result || '';
};
$$.getRelativeUrl = function (baseUrl, url) {
    let c = console;
    if (!url) {
        c.error('Url is not specified.');
        url = '/';
    }
    else if (!baseUrl) {
        c.error('Base url is not specified.');
    }
    else {
        if (baseUrl[baseUrl.length - 1] != '/') {
            baseUrl += '/';
        }
        if (url.indexOf(baseUrl) == 0) {
            url = '/' + url.substring(baseUrl.length);
        }
    }
    return url;
};
$$.findNode = (selector, nodeType, element) => {
    let elements = $$.all(selector, element);
    for (let el of elements) {
        let childNodes = el.childNodes;
        if (childNodes) {
            for (let i = 0; i < childNodes.length; i++) {
                let node = childNodes[i];
                if (node.nodeType == nodeType) {
                    return node;
                }
            }
        }
    }
};
$$.findAllNodes = (selector, nodeType, element) => {
    let result = [];
    let elements = $$.all(selector, element);
    for (let el of elements) {
        let childNodes = el.childNodes;
        if (childNodes) {
            for (let i = 0; i < childNodes.length; i++) {
                let node = childNodes[i];
                if (nodeType == null || node.nodeType === nodeType) {
                    result.push(node);
                }
            }
        }
    }
    return result;
};
$$.searchParams = query => {
    let params = {};
    if (!query) {
        return params;
    }
    query = query.replace(/^[^?]*\?/, '');
    if (/^#/.test(query)) {
        query = query.slice(1);
    }
    query.split('&').forEach(param => {
        let [key, value] = param.split('=');
        params[key] = decodeURIComponent((value || '').replace(/\+/g, ' '));
    });
    return params;
};
