(function () {
    window.position = function (element) {
        if (element.parentElement == null)
            return { left: element.offsetLeft, top: element.offsetTop };
        var parent_element = window.position(element.parentElement);
        return {
            left: (element.offsetLeft + parent_element.left),
            top: (element.offsetTop + parent_element.top),
            width: element.offsetWidth,
            height: element.offsetHeight,
            html: element.outerHTML
        };
    };
    window.MutationController = (function () {
        var added_elements = [],
            all_elements = null;

        function _childs (element) {
            var result = [], children = (element.children ? element.children : []);

            if (children.length === 0)
                return [];

            result.push(_calculate_childs_data(children, element));
            return result;
        }
        function _calculate_childs_data (children, element) {
            var attributes = ["width", "height", "numberOfElements", "top", "left"],
                result;

            result = {
                html: element.outerHTML,
                number_childs: children.length
            };

            for (var j = 0; j < attributes.length; j++) {
                var avg = 0, meta_data,
                    sd = 0;
                for (var i = 0; i < children.length; i++) {
                    meta_data = _meta_data(children[i]);
                    avg += meta_data[attributes[j]];
                };
                avg = avg / children.length;
                for (var i = 0; i < children.length; i++) {
                    meta_data = _meta_data(children[i]);
                    sd += Math.pow(avg - meta_data[attributes[j]], 2);
                };
                sd = Math.sqrt(sd / children.length);
                result[attributes[j] + "_avg"] = avg;
                result[attributes[j] + "_sd"] = sd;
            };
            return result;
        }
        function _meta_data(element) {
            var result = _position(element);
            result.html = element.outerHTML;
            result.numberOfElements = _number_of_elements(element);
            result.numberOfWords = _number_of_words(element);
            result.depth = _depth(element);
            result.wide = _wide(element);

            /* Related work */
            result.presenceTable = _presence_of_element(element, 'table');
            result.presenceUl = _presence_of_element(element, 'ul');
            result.presenceInput = _presence_of_element(element, 'input');
            result.presenceWidgetName = _menu_name(element);
            result.presenceDate = _date(element);
            result.presenceImg = _presence_of_element(element, 'img');
            result.numberTextNodes = _number_of_textnodes(element);
            result.proportionNumberTextNodes = _proportion_number_in_textnodes(element);
            result.percentLinks = _80_percent_links(element);
            return result;
        }
        function _depth (element) {
            var max = 0, depth_i;
            if (!element.children)
                return 1;
            if (element.children.length === 0)
                return 1;
            for (var i = 0; i < element.children.length; i++) {
                depth_i = _depth(element.children[i]);
                if (depth_i > max)
                    max = depth_i;
            };
            return max + 1;
        }
        function _wide (element) {
            var result = 0, wide_i;
            if (!element.children)
                return 1;
            if (element.children.length === 0)
                return 1;
            for (var i = 0; i < element.children.length; i++) {
                wide_i = _wide(element.children[i]);
                result += wide_i;
            };
            return result;
        }
        function _number_of_words (element) {
            var target = element,
                aux = null, elements = [],
                number_of_words = 0;

            elements.push(target);
            while (elements.length != 0) {
                aux = elements.pop();
                for (var i = 0; i < aux.childNodes.length; i++) {
                    if (aux.childNodes[i].nodeType === 3) {
                        number_of_words += aux.childNodes[i].nodeValue.split(" ").length;
                    }
                    if (aux.childNodes[i].nodeType === 1)
                        elements.push(aux.childNodes[i]);
                }
            }
            return number_of_words;
        }
        function _number_of_elements (element) {
            return element.querySelectorAll('*').length;
        }
        function _80_percent_links (element) {
            var target = element,
                table = target.querySelector("table"),
                ul = target.querySelector("ul"),
                childs, childs2;

            if (table) {
                childs = table.querySelectorAll("*").length;
                childs2 = table.querySelectorAll("a").length;
                if ((childs2/childs) > 0.8)
                    return 1;
                else
                    return 0;
            }
            if (ul) {
                childs = ul.querySelectorAll("*").length;
                childs2 = ul.querySelectorAll("a").length;
                if ((childs2/childs) > 0.8)
                    return 1;
                else
                    return 0;
            }
            return 0;
        }
        function _proportion_number_in_textnodes (element) {
            var target = element,
                aux = null, elements = [],
                number_of_numbers = 0;

            elements.push(target);
            while (elements.length != 0) {
                aux = elements.pop();
                for (var i = 0; i < aux.childNodes.length; i++) {
                    if (aux.childNodes[i].nodeType === 3) {
                        if (!isNaN(parseInt(aux.childNodes[i].nodeValue)))
                            number_of_numbers++;
                    }
                    if (aux.childNodes[i].nodeType === 1)
                        elements.push(aux.childNodes[i]);

                }
            }
            return number_of_numbers;
        }
        function _number_of_textnodes (element) {
            var target = element,
                aux = null, elements = [],
                number_of_child_nodes = 0;

            elements.push(target);
            while (elements.length != 0) {
                aux = elements.pop();
                for (var i = 0; i < aux.childNodes.length; i++) {
                    if (aux.childNodes[i].nodeType === 3)
                        number_of_child_nodes++;
                    if (aux.childNodes[i].nodeType === 1)
                        elements.push(aux.childNodes[i]);
                }
            }
            return number_of_child_nodes;
        }
        function _date (element) {
            var aux = (element.type) ? element.type : '',
                childs = element.querySelectorAll("*");
            for (var i = 0; i < childs.length; i++) {
                aux += ' ' + childs[i].type;
            };
            return (aux.search('date') >= 0);
        }
        function _menu_name (element) {
            var aux = (element.className) ? element.className : '',
                childs = element.querySelectorAll("*");
            for (var i = 0; i < childs.length; i++) {
                aux += ' ' + childs[i].className;
            };
            return (aux.search('menu') >= 0 ||
                    aux.search('dropdown') >= 0 ||
                    aux.search('drop-down') >= 0);
        }
        function _presence_of_element (element, tagName) {
            return (element.querySelectorAll(tagName).length !== 0);
        }
        _position = window.position;
        function _contains (target, element) {
            if (target === null)
                return false;
            var childs = target.querySelectorAll('*');
            for (var i = 0; i < childs.length; i++) {
                if (childs[i] === element)
                    return true;
            };
            return false;
        }

        window.observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.addedNodes && mutation.addedNodes.length > 0 &&
                    mutation.addedNodes[0].nodeType === 1) {
                    for (var j = 0; j < mutation.addedNodes.length; j++) {
                        added_elements.push(mutation.addedNodes[j]);
                    }
                } else if (mutation.target) {
                    added_elements.push(mutation.target);
                }
            });
        });
        window.observer.observe(document.body, {attributes: true, childList: true, subtree: true});

        return {
            check_mutation_changes: function () {
                var result = [];
                for (var i = 0; i < added_elements.length; i++) {
                    result.push(_meta_data(added_elements[i]));
                    result[i].childs = _childs(added_elements[i]);
                };
                added_elements = [];
                return result;
            }
        };
    }());
}());
