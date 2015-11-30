var LOCALSTORAGE_NAME = "files-store";

var filer = {},
    initialData = [
        {"filename": "index.html", "size": 13},
        {"filename": "contact.html", "size": 12},
        {"filename": "sample.png", "size": 65}
    ];

filer.File = Backbone.Model.extend({
    initialize : function() {
        // Set fileType attribute according to file extension
        var fileType, extension = this.attributes.filename.split(".").pop();
        switch( extension ) {
            case "html":
                fileType = "Web page";
                break;
            case "png":
                fileType = "PNG image";
                break;
            case "jpeg":
            case "jpg":
                fileType = "JPEG image";
                break;
            case "txt":
                fileType = "Text file";
                break;
            default:
                fileType = "Unknown file type"
        }

        this.set('fileType', fileType);
    }
});

filer.Files = Backbone.Collection.extend({
    model: filer.File,
    localStorage: new Backbone.LocalStorage(LOCALSTORAGE_NAME),

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

// Load initial data into files collection
var filesCollection = new filer.Files();


var FileListView = Backbone.View.extend({
    el: '#container',
    tagName: 'ul',
    className: 'file-list',
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

        this.$el.append(newFileView.render().el);
    }
});

var FileView = Backbone.View.extend({
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

var filerAppView = new FileListView({collection: filesCollection});

//filesCollection.add(initialData);