window.makeTable = function(selector, collection) {
    $(selector).text(vkbeautify.json(collection));
};