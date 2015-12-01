var LOCALSTORAGE_NAME = 'files-store',
    AVAILABLE_ACTIONS = {
        DOWNLOAD: 'download',
        PREVIEW: 'preview',
        BOOKMARK: 'bookmark',
        EDIT: 'edit'
    },
    INITIAL_DATA = [
        {id: 1, 'filename': 'index.html', 'size': 13},
        {id: 2, 'filename': 'contact.html', 'size': 12},
        {id: 3, 'filename': 'sample.png', 'size': 65}
    ],
    DEFAULT_ACTIONS_PER_TYPE = {
        'default': null,
        'html': [
            AVAILABLE_ACTIONS.DOWNLOAD,
            AVAILABLE_ACTIONS.BOOKMARK,
            AVAILABLE_ACTIONS.PREVIEW,
            AVAILABLE_ACTIONS.EDIT
        ],
        'jpg': [AVAILABLE_ACTIONS.DOWNLOAD, AVAILABLE_ACTIONS.BOOKMARK, AVAILABLE_ACTIONS.PREVIEW],
        'png': [AVAILABLE_ACTIONS.DOWNLOAD, AVAILABLE_ACTIONS.BOOKMARK, AVAILABLE_ACTIONS.PREVIEW],
        'txt': [
            AVAILABLE_ACTIONS.DOWNLOAD,
            AVAILABLE_ACTIONS.BOOKMARK,
            AVAILABLE_ACTIONS.PREVIEW,
            AVAILABLE_ACTIONS.EDIT
        ]
    };

var Filer = {
    Views: {},
    Extensions: {},
    router: null,

    init: function () {
        this.router = new Filer.Router();
        Backbone.history.start();
    }
};

Filer.Router = Backbone.Router.extend({

    routes: {
        '': 'home',
        'bookmarks': 'bookmarks'
        //'create': 'create',
        //'edit': 'edit',
    },
    _currentView: null,

    views: [],

    showView: function (view, args) {
        args = args || {};

        if (view != this._currentView) {
            if (this._currentView != null && this._currentView.remove != null) {
                this._currentView.remove();
                delete this._currentView;
            }
            this._currentView = new view(args);
        }
    },

    home: function () {
        // Load initial data into files collection
        var filesCollection = new Filer.FileCollection();

        this.showView(Filer.Views.FileListView, {collection: filesCollection});
    },

    bookmarks: function() {
        var filesCollection = new Filer.FileCollection();
        var bookmarked = new Filer.FileCollection(filesCollection.where({ bookmarked : true }));

        this.showView(Filer.Views.BookmarkListView, {collection: bookmarked});
    }
});

Filer.File = Backbone.Model.extend({
    defaults: {
        'id': null,
        'filename': undefined,
        'content': undefined,
        'actions': [],
        'bookmarked': false
    },
    initialize : function() {
        // Set fileType attribute according to file extension
        var filetype,
            extension = this.attributes.filename.split('.').pop();
        switch( extension ) {
            case 'html':
                filetype = 'Web page';
                break;
            case 'png':
                filetype = 'PNG image';
                break;
            case 'jpeg':
            case 'jpg':
                filetype = 'JPEG image';
                extension = 'jpg';
                break;
            case 'txt':
                filetype = 'Text file';
                break;
            default:
                filetype = 'Unknown file type'
        }

        this.set('filetype', filetype);

        // Check if extension is configured for
        // default actions per file type
        if (extension in DEFAULT_ACTIONS_PER_TYPE)
            this.set('actions', DEFAULT_ACTIONS_PER_TYPE[extension]);
    }
});

Filer.FileCollection = Backbone.Collection.extend({
    model: Filer.File,
    localStorage: new Backbone.LocalStorage(LOCALSTORAGE_NAME),

    // Available sort strategies
    strategies: {
        filename: function (file) { return file.get('filename'); },
        filetype: function (file) { return file.get('filetype'); },
        size: function (file) { return file.get('size'); }
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
            this.add(INITIAL_DATA);
        } else {
            return Backbone.Collection.prototype.fetch.call(this, options);
        }
    }
});

Filer.Views.BaseView = Backbone.View.extend({
    remove: function(clear) {
        clear = clear || false;

        console.log("%s", (clear) ? "Removing" : "Cleansing", this);

        // If clear is true call super remove method
        // Else empty HTML element
        if (clear)
            Backbone.View.prototype.remove.call(this, arguments);
        else
            this.$el.empty();

        this.unbind().off();
        this.stopListening();
        this.undelegateEvents();
    }
});

Filer.Views.FileListView = Filer.Views.BaseView.extend({
    el: "#file-list",
    templateName: '#file-list-template',

    // Need to respond to clicks on the table headers
    events: {
        'click th.sortable': 'headerClick',
        'click .file': 'fileClick'
    },

    selectedFile: null,
    actionsView: null,

    initialize: function() {
        this.template = _.template($(this.templateName).html());

        this.listenTo(this.collection, 'add', this.renderFile, this);

        this.render();
    },
    render: function() {
        this.$el.empty();
        this.$el.append(this.template());

        // fetch initial data
        this.collection.fetch();

        this.renderActions();

        return this;
    },

    /**
     * Override close method to close actions view
     */
    remove: function() {
        if (this.actionsView)
            this.actionsView.remove(true);

        Filer.Views.BaseView.prototype.remove.apply(this, arguments);
    },

    /**
     * Renders all available actions for the current selectedFile
     */
    renderActions: function() {
        var actionParams = {parent: this};

        if (this.selectedFile !== null)
            actionParams['actions'] = this.selectedFile.get('actions');

        console.log("Rendering actions for:", this.actionsView);

        if (this.actionsView) {
            this.actionsView.remove(true);
            this.actionsView = null;
        }

        console.log("After delete", this.actionsView);

        this.actionsView = new Filer.Views.ActionListView(actionParams);
        //this.actionsView.on('performAction', this.performAction, this);

        console.log("After instantiation:", this.actionsView);

        this.$el.append(this.actionsView.el);
    },

    /**
     * Performs the given action on the current selectedFile
     *
     * @param action
     */
    performAction: function(action) {
        console.log(action);
    },

    /**
     * Render a single File instance
     *
     * @param files
     */
    renderFile: function(files) {
        var newFileView = new Filer.Views.FileView({model: files.toJSON()});
        files.save();

        var $tbody = this.$("tbody");
        $tbody.append(newFileView.render().el);
    },

    /**
     * Event triggered by a table header click
     *
     * @param event
     */
    headerClick: function(event){
        var $el = $(event.currentTarget),
            sortProperty = $el.attr('data-sort');

        // If column is already sorting then change sorting order
        // by calling collection's method and change element's classes
        if ($el.hasClass('selected')) {
            if ($el.hasClass('asc')) {
                $el
                    .addClass('desc')
                    .removeClass('asc');
            } else {
                $el
                    .addClass('asc')
                    .removeClass('desc');
            }

            this.collection.changeSortOrder();
        } else {
            $el.addClass('selected asc');
        }

        // Set sort property and call sort
        this.collection.changeSort(sortProperty);
        this.collection.sort();

        this.refreshList();

        // Remove selected class from previous selection and
        // add class to new selection
        $el.siblings('.selected').removeClass('selected asc desc');
    },

    /**
     * Table row click event, selects an File instance
     *
     * @param event
     */
    fileClick: function(event) {
        var $el = $(event.currentTarget);

        $el.siblings('.selected').removeClass('selected');
        $el.addClass('selected');

        this.selectedFile = this.collection.get($el.data('id'));
        this.renderActions();
    },

    /**
     * Refreshes the file list. Useful for sorting and File creation/deletion
     */
    refreshList: function() {
        // Render file list
        this.$('tbody').empty();
        this.collection.each(this.renderFile);
    }
});

Filer.Views.FileView = Filer.Views.BaseView.extend({
    tagName: 'tr',
    className: 'file',
    initialize: function() {
        this.template = _.template($('#file-template').html());
        this.render();
    },
    render: function() {
        this.$el.html(this.template({file: this.model}));

        // Add id to element for future reference
        this.$el.data('id', this.model.id);

        return this;
    }
});

Filer.Views.ActionListView = Filer.Views.BaseView.extend({
    id: 'file-actions',
    events: {
        'click .action': 'callAction'
    },
    options: {},
    initialize: function(options) {
        // Assign actions from options, even if undefined
        this.actions = {'actions': options['actions']};
        this.parent = options['parent'];

        this.template = _.template($('#file-actions-template').html());
        this.render();
    },
    render: function() {
        var params = $.extend(this.actions, {selectedFile: this.parent.selectedFile});

        this.$el.html(this.template(params));

        return this;
    },

    /**
     * Action element click event
     *
     * @param event
     */
    callAction: function(event) {
        var $el = $(event.currentTarget);

        this.trigger('performAction', $el.data('action'));
    }
});

Filer.Views.BookmarkListView = Filer.Views.FileListView.extend({
    templateName: '#bookmark-list-template',

    initialize: function() {
        this.template = _.template($(this.templateName).html());
        this.render();
    }
});

$(function() {
    Filer.init();
});

/**
 * Reverts the sort order for a Collection's comparator
 *
 * @param sortByFunction
 * @returns {Function}
 */
function reverseSortBy(sortByFunction) {
    return function(left, right) {
        var l = sortByFunction(left);
        var r = sortByFunction(right);

        if (l === void 0) return -1;
        if (r === void 0) return 1;

        return l < r ? 1 : l > r ? -1 : 0;
    };
}