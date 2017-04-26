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
    page.injectJs("page-mod/mutation-controller.js");
};

page.open(system.args[1], function () {
    page.navigationLocked = true;
    page.injectJs("page-mod/mutation-controller.js");
    var chain = CommandChain(),
        target_list;
    setTimeout(function () {
        target_list = page.evaluate(function () {
            window.all = document.querySelectorAll("*"),
                result = [];
            for (var i = 0; i < window.all.length; i++) {
                result.push(window.position(window.all[i]));
            };
            return result;
        });
        page.render("output/01.png");
        for (var i = 0; i < target_list.length; i++) {
            (function () {
                var target = target_list[i],
                    index = i;
                if (target.width && target.height) {
                     chain.add(function () {
                         page.sendEvent("mousemove", target.left + 1, target.top + 1);
                     }, {}, 1000);
                     chain.add(function () {
                         page.sendEvent("click", target.left + 1, target.top + 1);
                     }, {}, 1000);
                     chain.add(function () {
                         var mutations = page.evaluate(function () {
                             return window.MutationController.check_mutation_changes();
                         });
                         if (mutations.length > 0)
                             page.render("output/" + index + ".png");
                     }, {}, 1000);
                }
            })();
        }
        chain.add(function () {
            phantom.exit();
        }, {}, 500);

        chain.run();
    }, 5000);
});
