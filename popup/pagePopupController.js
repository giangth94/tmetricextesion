class PagePopupController extends PopupController {
    constructor() {
        super(true);
        this.hidePopupAction = this.wrapBackgroundAction('hideAllPopups');
        this.initFrame();
    }
    close() {
        this.hidePopupAction();
    }
    initFrame() {
        let style = document.createElement('style');
        let css = `
html {
    background-color: rgba(0, 0, 0, .5) !important;
}
body {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    padding: 0 !important;
}
.container {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 460px;
    margin-left: -175px;
    margin-top: -211px;
    background-color: #ffffff;
}
`;
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
        $(document).mousedown(e => {
            if (e.target.tagName.toLowerCase() == 'body') {
                this.close();
            }
        });
    }
}
