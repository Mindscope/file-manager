var LOCALSTORAGE_NAME = "files-store";

var Filer = {},
    initialData = [
        {"filename": "index.html", "size": 13},
        {"filename": "contact.html", "size": 12},
        {"filename": "sample.png", "size": 65}
    ];

Filer.File = Backbone.Model.extend({
    defaults: {
        "filename": undefined
    },
    initialize : function() {
        // Set fileType attribute according to file extension
        var filetype, extension = this.attributes.filename.split(".").pop();
        switch( extension ) {
            case "html":
                filetype = "Web page";
                break;
            case "png":
                filetype = "PNG image";
                break;
            case "jpeg":
            case "jpg":
                filetype = "JPEG image";
                break;
            case "txt":
                filetype = "Text file";
                break;
            default:
                filetype = "Unknown file type"
        }

        this.set('filetype', filetype);
    }
});

Filer.FileCollection = Backbone.Collection.extend({
    model: Filer.File,
    localStorage: new Backbone.LocalStorage(LOCALSTORAGE_NAME),

    // Available sort strategies
    strategies: {
        filename: function (file) { return file.get("filename"); },
        filetype: function (file) { return file.get("filetype"); },
        size: function (file) { return file.get("size"); },
    },

    // Current property defined as sort attribute
    sortAttribute: null,

    // Sort order
    sortOrder: 1,

    // Change sort property
    changeSort: function (sortProperty) {
        this.comparator = this.strategies[sortProperty];

        if (this.sortOrder < 0) {
            this.comparator = reverseSortBy(this.comparator);
        }
    },

    changeSortOrder: function() {
        this.sortOrder = -1 * this.sortOrder;
    },

    // Override fetch method to check if localStorage is set
    // If not set load data from JSON
    // Else maintain default fetch behaviour
    fetch: function(options) {
        // check if data is already on localStorage
        if (!localStorage.getItem(LOCALSTORAGE_NAME)) {
            this.add(initialData);
        } else {
            return Backbone.Collection.prototype.fetch.call(this, options);
        }
    }
});

function reverseSortBy(sortByFunction) {
    return function(left, right) {
        var l = sortByFunction(left);
        var r = sortByFunction(right);

        if (l === void 0) return -1;
        if (r === void 0) return 1;

        return l < r ? 1 : l > r ? -1 : 0;
    };
}

var FileListView = Backbone.View.extend({
    el: '#container',
    tagName: 'table',
    className: 'file-list',

    // Need to respond to clicks on the table headers
    events: {
        "click th.sortable": "headerClick"
    },

    initialize: function() {
        this.template = _.template($('#file-list-template').html());
        this.render();

        this.collection.on("add", this.renderFile, this);

        // fetch initial data
        this.collection.fetch();
    },
    render: function() {
        this.$el.empty();
        this.$el.append(this.template());

        return this;
    },
    renderFile: function(files) {
        var newFileView = new FileView({model: files.toJSON()});
        files.save();

        var $tbody = this.$("tbody");
        $tbody.append(newFileView.render().el);
    },
    headerClick: function(event){
        var $el = $(event.currentTarget),
            sortProperty = $el.attr("data-sort");

        // If column is already sorting then change sorting order
        // by calling collection's method and change element's classes
        if ($el.hasClass("selected")) {
            if ($el.hasClass("asc")) {
                $el
                    .addClass("desc")
                    .removeClass("asc");
            } else {
                $el
                    .addClass("asc")
                    .removeClass("desc");
            }

            this.collection.changeSortOrder();
        }

        // Set sort property and call sort
        this.collection.changeSort(sortProperty);
        this.collection.sort();

        // Rerender file list
        this.$("tbody").empty();
        this.collection.each(this.renderFile);

        $el.siblings(".selected").removeClass("selected");
        $el.addClass("selected");
    }
});

var FileView = Backbone.View.extend({
    tagName: 'tr',
    className: 'file',
    initialize: function() {
        this.template = _.template($('#file-template').html());
        this.render();
    },
    render: function() {
        this.$el.html(this.template({file: this.model}));
        return this;
    }
});

// Load initial data into files collection
var filesCollection = new Filer.FileCollection();
var filerAppView = new FileListView({collection: filesCollection});