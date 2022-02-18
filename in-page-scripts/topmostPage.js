if (typeof document !== 'undefined') {
    const sendBackgroundMessage = (message) => {
        chrome.runtime.sendMessage(message, response => {
            const error = chrome.runtime.lastError;
            if (error) {
                void 0;
            }
        });
    };
    const popupId = 'tmetric-popup';
    let constants;
    let framesetRows;
    let framesetCols;
    const showPopup = () => {
        if (document.querySelector('#' + popupId)) {
            return;
        }
        const body = document.body;
        const isFrameSet = body.tagName == 'FRAMESET';
        let refChild = null;
        const frame = document.createElement(isFrameSet ? 'frame' : 'iframe');
        frame.id = popupId;
        frame.src = `${constants.browserSchema}://${constants.extensionUUID}/popup/popup.html?integration`;
        if (isFrameSet) {
            framesetRows = body.getAttribute('rows');
            framesetCols = body.getAttribute('cols');
            body.removeAttribute('cols');
            body.setAttribute('rows', '*');
            refChild = body.firstChild;
        }
        else {
            Object.assign(frame.style, {
                position: 'fixed',
                zIndex: 999999,
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'block'
            });
        }
        body.insertBefore(frame, refChild);
    };
    const hidePopup = () => {
        const popupFrame = document.querySelector('#' + popupId);
        if (popupFrame) {
            popupFrame.remove();
            if (framesetRows != null) {
                document.body.setAttribute('rows', framesetRows);
            }
            else {
                document.body.removeAttribute('rows');
            }
            if (framesetCols != null) {
                document.body.setAttribute('cols', framesetCols);
            }
        }
    };
    chrome.runtime.onMessage.addListener((message) => {
        switch (message.action) {
            case 'showPopup':
                showPopup();
                break;
            case 'hidePopup':
                hidePopup();
                break;
            case 'setConstants':
                constants = message.data;
                break;
            case 'initPage':
                sendBackgroundMessage({ action: 'getConstants' });
                break;
            case 'error':
                const a = alert;
                a(constants.extensionName + '\n\n' + message.data.message);
                break;
        }
    });
    sendBackgroundMessage({ action: 'getConstants' });
}
