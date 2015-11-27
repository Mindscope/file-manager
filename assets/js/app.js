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
            default:
                fileType = "Text file";
        }

        this.set('fileType', fileType);
    }
});

filer.Files = Backbone.Collection.extend({
    model: filer.File
});

// Load initial data into files collection
var filesCollection = new filer.Files(initialData);


var FileListView = Backbone.View.extend({
    el: '#container',
    tagName: 'ul',
    className: 'file-list',
    initialize: function() {
        this.template = _.template($('#file-list-template').html());
        this.render();
    },
    render: function() {
        var scope = this;
        this.$el.empty();
        this.$el.append(this.template());
        this.collection.each(function(model) {
            scope.$el.append(new FileView({model: model.toJSON()}).render().el);
        });
        return this;
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
