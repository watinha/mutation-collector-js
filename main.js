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
                selector = ev_type + " --> " + selector;
                window.events.push(selector);
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
    setTimeout(function () {
        console.log(page.evaluate(function () {
            var all = document.querySelectorAll("*");
            for (var l = 0; l < all.length; l++) {
                if (all[l].onmouseover) {
                    var target = all[l],
                        selector = "";

                    while (target.parentElement != null) {
                        selector = (selector.length === 0 ?
                            target.tagName.toLowerCase() :
                            target.tagName.toLowerCase() + " > " + selector);
                        target = target.parentElement;
                    }
                    if (selector.length > 0)
                        window.events.push(selector);
                }
            };

            return window.events.join("\n");
        }));
        page.render("abobrinha.png");
        phantom.exit();
    }, 10000);
});
