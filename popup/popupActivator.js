if (typeof document != undefined) {
    document.body.style.visibility = 'visible';
    let controller = location.search == '?integration' ?
        new PagePopupController() :
        new PopupController();
}
