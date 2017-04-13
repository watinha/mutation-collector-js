var webpage = require("webpage"),
    system = require("system"),
    page = webpage.create();

if (system.args.length < 2) {
    console.log("Arguments missing...");
    phantom.exit();
}

var CommandChain = function (page) {
    var commands = [],
        chain = [];
    return {
        add: function (f, context, time) {
            commands.push({
                f: f,
                context: context,
                time: time
            });
        },
        run: function () {
            for (var i = 0; i < commands.length; i++) {
                (function () {
                    var index = i;
                    chain[index] = function () {
                        setTimeout(function () {
                            console.log('Command chain: running command ' + index);
                            commands[index].f.apply(commands[index].context, []);
                            if (chain[index + 1])
                                chain[index + 1]();
                        }, commands[index].time);
                    };
                }());
            };
            chain[0]();
        }
    };
};

page.settings.userAgent = 'Mozilla/5.0 (X11; Linux x86_64; rv:49.0) Gecko/20100101 Firefox/49.0';
page.viewportSize = { width: 1200, height: 600 };
page.settings.XSSAuditingEnabled = true;
page.settings.webSecurityEnabled = false;
page.onError = function () {};
page.onInitialized = function () {
    page.injectJs("page-mod/event-controller.js");
    page.injectJs("page-mod/mutation-controller.js");
};

page.open(system.args[1], function () {
    page.navigationLocked = true;
    var chain = CommandChain();
    chain.add(function () {
        var event_controller_list = page.evaluate(function () {
            return window.EventController.get();
        });
        for (var i = 0; i < event_controller_list.length; i++) {
            console.log(event_controller_list[i].event + " *** " + event_controller_list[i].selector);
        }
        phantom.exit();

    }, {}, 10000);
    chain.run();
});
