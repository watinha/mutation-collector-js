var webpage = require("webpage"),
    system = require("system"),
    page = webpage.create();

if (system.args.length < 2) {
    console.log("Arguments missing...");
    phantom.exit();
}
page.onError = function () {};
page.onInitialized = function () {
    page.evaluate(function () {
        var true_addEventListener = HTMLElement.prototype.addEventListener;
        window.events = [];
        HTMLElement.prototype.addEventListener = function (ev_type) {
            var target = this,
                selector = "";

            while (target.parentElement != null) {
                selector = (selector.length === 0 ?
                    target.tagName.toLowerCase() :
                    target.tagName.toLowerCase() + " > " + selector);
                target = target.parentElement;
            }
            if (selector.length > 0) {
                window.events.push({
                    event: ev_type,
                    selector: selector
                });
            }
            true_addEventListener.apply(this, arguments);
        };
    });
};

page.settings.userAgent = 'Mozilla/5.0 (X11; Linux x86_64; rv:49.0) Gecko/20100101 Firefox/49.0';
page.viewportSize = { width: 1200, height: 600 };
page.settings.XSSAuditingEnabled = true;
page.settings.webSecurityEnabled = false;
page.open(system.args[1], function () {
    page.navigationLocked = true;
    page.injectJs("page-mod/event-controller.js");
    setTimeout(function () {
        var event_controller_list = page.evaluate(function () {
            return window.EventController.get();
        });
        for (var i = 0; i < event_controller_list.length; i++) {
            console.log(event_controller_list[i].event + " *** " + event_controller_list[i].selector);
        }
        phantom.exit();
    }, 10000);
});
