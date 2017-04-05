var EventController = (function () {
    return {
        get: function () {
            var all = document.querySelectorAll("*"),
                events_list = ["onclick", "onmouseover", "onmousedown", "onmouseup", "onkeyup",
                               "onkeydown", "onkeypress", "onblur", "onfocus", "onchange", "onsubmit"];
            for (var l = 0; l < all.length; l++) {
                for (var k = 0; k < events_list.length; k++) {
                    if (all[l][events_list[k]]) {
                        var target = all[l],
                            selector = "";

                        while (target.parentElement != null) {
                            selector = (selector.length === 0 ?
                                target.tagName.toLowerCase() :
                                target.tagName.toLowerCase() + " > " + selector);
                            target = target.parentElement;
                        }
                        if (selector.length > 0) {
                            window.events.push({
                                event: events_list[k],
                                selector: selector
                            });
                        }
                    }
                }
            };

            return window.events;
        }
    };
}());
window.EventController = EventController;
