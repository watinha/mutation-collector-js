var webpage = require("webpage"),
    system = require("system"),
    fs = require("fs"),
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
        target_list,
        mutations_list = [];
    setTimeout(function () {
        target_list = page.evaluate(function () {
            window.all = document.querySelectorAll("*"),
                result = [];
            for (var i = 0; i < window.all.length; i++) {
                result.push(window.position(window.all[i]));
            };
            return result;
        });
        page.render("output/XXXXX1.png");
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
                         if (mutations.length > 0) {
                             var output = "";
                             for (var i = 0; i < mutations.length; i++) {
                                 output += mutations[i].html + " ** *** ** " + index + "-" + i + "\n";
                                 mutations[i].activatorId = index;
                                 mutations[i].changeId = i;
                                 mutations[i].activator = target;
                                 mutations_list.push(mutations[i]);
                             };
                             fs.write('output/' + index + '.activator.txt', target.html, 'w');
                             fs.write('output/' + index + '.widgets.txt', output, 'w');
                             page.render("output/" + index + ".png");
                         }
                     }, {}, 1000);
                }
            })();
        }
        chain.add(function () {
            var csv = 'activator-id,mutation-id,displayed,height,width,top,left,activatorTop,activatorLeft,distanceTop,distanceLeft,distance,numberElements,elements/size,numberWords,textNodes,Words/TextNodes,table,list,input,widgetName,date,img,proportionNumbers,links80percent,Result\n',
                row, serial, distanceTop, distanceLeft, distance;
            for (var i = 0; i < mutations_list.length; i++) {
                row = mutations_list[i];
                serial = [];
                serial.push(row.activatorId);
                serial.push(row.changeId);
                serial.push(0);
                serial.push(row.height);
                serial.push(row.width);
                serial.push(row.top);
                serial.push(row.left);
                serial.push(row.activator.top);
                serial.push(row.activator.left);
                distanceTop = Math.abs(row.top - row.activator.top);
                serial.push(distanceTop);
                distanceLeft = Math.abs(row.left - row.activator.left);
                serial.push(distanceLeft);
                distance = Math.abs(Math.abs(distanceTop - distanceLeft) - Math.max(distanceTop, distanceLeft));
                serial.push(distance);
                serial.push(row.numberOfElements);
                if (row.height * row.width == 0)
                    serial.push(-1);
                else
                    serial.push(row.numberOfElements / (row.height * row.width));
                serial.push(row.numberOfWords);
                serial.push(row.numberTextNodes);
                if (row.numberTextNodes === 0)
                    serial.push(0);
                else
                    serial.push(row.numberOfWords / row.numberTextNodes);
                serial.push(row.presenceTable);
                serial.push(row.presenceUl);
                serial.push(row.presenceInput);
                serial.push(row.presenceWidgetName);
                serial.push(row.presenceDate);
                serial.push(row.presenceImg);
                serial.push(row.proportionNumberTextNodes);
                serial.push(row.percentLinks);
                csv += serial.join(',') + '\n';
            };
            fs.write('output/results.csv', csv, 'w');
            phantom.exit();
        }, {}, 500);

        chain.run();
    }, 5000);
});
