function initShowPopupSelector() {
    chrome.storage.sync.get({ showPopup: 0 }, (settings) => {
        document.body.style.visibility = 'visible';
        const showOptions = {
            [0]: 'Always',
            [1]: 'When project is not specified',
            [2]: 'Never'
        };
        let items = [];
        for (let option in showOptions) {
            items.push($('<option />').text(showOptions[option]).val(option.toString()));
        }
        $('#show-popup-settings')
            .append(items)
            .val(settings.showPopup.toString())
            .on('change', () => {
            chrome.storage.sync.set({
                showPopup: $('#show-popup-settings :selected').val()
            });
        })
            .select2({
            minimumResultsForSearch: Infinity
        })
            .trigger('change');
    });
}
function setIntegrationsScrollArea() {
    if ($('.settings-page').length > 0) {
        const mainHeight = $('.settings-main .main-content').outerHeight();
        const filterHeight = $('.filter-section').outerHeight();
        const containerMargins = 22;
        const scrollAreaHeight = mainHeight - containerMargins - filterHeight;
        $('.settings-page .logos-section').css("height", scrollAreaHeight + "px");
    }
}
function navTabs() {
    $('.tabset a').on('click', function (e) {
        e.preventDefault();
        if (!$(this).parent('li').hasClass('active')) {
            $('.tab-box.visible').hide().removeClass('visible');
            $('.tabset li.active').removeClass('active');
            const tabBox = $(this).attr('href');
            $(this).parent('li').addClass('active');
            $(tabBox).addClass('visible').fadeIn(400);
            setIntegrationsScrollArea();
        }
    });
}
$(document).ready(() => {
    initShowPopupSelector();
    setIntegrationsScrollArea();
    navTabs();
    $('.copyright').text(`© ${new Date().getFullYear()} Devart`);
    $(window).resize(function () {
        setIntegrationsScrollArea();
    });
});
