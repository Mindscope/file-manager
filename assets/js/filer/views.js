(function($){
    Filer.Views.BaseView = Backbone.View.extend({
        remove: function(clear) {
            clear = clear || false;

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
        el: "#file-container",
        templateName: '#file-list-template',

        // Need to respond to clicks on the table headers
        events: {
            'click th.sortable': 'headerClick',
            'click .file': 'fileClick'
        },

        selectedFile: null,
        actionsView: null,
        searchView: null,
        _initCollection: null,

        initialize: function() {
            Filer.Views.BaseView.prototype.initialize.apply(this, arguments);

            this.template = _.template($(this.templateName).html());

            this._initCollection = _.clone(this.collection);

            // Set a document wide event to catch the generic click
            var view = this;
            $('body').on('click', function(){
                if (view.bodyClickCallback)
                    view.bodyClickCallback();
            });

            this.listenTo(this.collection, 'add', this.renderFile, this);

            this.render();
        },
        render: function() {
            this.$el.empty();
            this.$el.append(this.template());

            this.collection.each(this.renderFile, this);

            this.renderActions();

            this.renderSearch();

            return this;
        },

        /**
         * Override close method to close actions view
         */
        remove: function() {
            Filer.Views.BaseView.prototype.remove.apply(this, arguments);

            $('body').off('click');

            if (this.actionsView)
                this.actionsView.remove(true);
        },

        bodyClickCallback: function() {
            this.unselectFile();
        },

        /**
         * Renders all available actions for the current selectedFile
         */
        renderActions: function() {
            var actionParams = {parent: this};

            if (this.selectedFile !== null)
                actionParams['actions'] = this.selectedFile.get('actions');

            if (this.actionsView) {
                this.actionsView.remove(true);
                this.actionsView = null;
            }

            this.actionsView = new Filer.Views.ActionListView(actionParams);
            this.actionsView.on('performAction', this.performAction, this);

            this.$el.append(this.actionsView.el);
        },

        /**
         * Renders search form
         */
        renderSearch: function() {
            if ( this.searchView ) {
                this.searchView.remove(true);
                this.searchView = null;
            }

            this.searchView = new Filer.Views.SearchView();
            this.listenTo( this.searchView, 'search', this.performSearch, this );

            this.$el.prepend( this.searchView.el );
        },

        /**
         * Filters the initial collection with the given query.
         *
         * If selectedFile is not null then check if search contains it
         * or not and acts accordingly.
         *
         * @param query
         */
        performSearch: function( query ) {
            this.collection = new Filer.FileCollection(this._initCollection.search( query ));

            // Check if selectedFile is still on the collection
            if (this.selectedFile) {
                var selection = false,
                    selectedFileId = this.selectedFile.get( 'id' );

                this.collection.each(function( file ){
                    if (selectedFileId == file.get( 'id' )) {
                        selection = true;
                        return false;
                    }
                });

                if (!selection)
                    this.unselectFile();
            }

            this.refreshList();
        },

        /**
         * Performs the given action on the current selectedFile
         *
         * @param action
         */
        performAction: function( action ) {
            switch (action) {
                case AVAILABLE_ACTIONS.BOOKMARK:
                    this.performActionBookmark();
                    break;
                case AVAILABLE_ACTIONS.DOWNLOAD:
                case AVAILABLE_ACTIONS.PREVIEW:
                    alert("Action not implemented");
                    break;
                case AVAILABLE_ACTIONS.EDIT:
                    location.href = '#/file/' + this.selectedFile.get('id');
                    break;
            }
        },

        /**
         * Bookmar action callback
         *
         * TODO: get a dynamic way for defining action callbacks
         */
        performActionBookmark: function(){
            this.selectedFile.set('bookmarked', !this.selectedFile.get('bookmarked'));
            this.selectedFile.save();
        },

        /**
         * Render a single File instance
         *
         * @param files
         */
        renderFile: function(file) {
            var newFileView = new Filer.Views.FileView({model: file.toJSON()});
            file.save();

            var $tbody = this.$("tbody"),
                newFileHtml = newFileView.render().el;

            if (this.selectedFile && this.selectedFile.get('id') == file.get('id'))
                $(newFileHtml).addClass('selected');

            $tbody.append(newFileHtml);
        },

        /**
         * Event triggered by a table header click
         *
         * @param event
         */
        headerClick: function(event){
            event.preventDefault();
            event.stopPropagation();

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
            event.preventDefault();
            event.stopPropagation();

            var $el = $(event.currentTarget);

            $el.siblings('.selected').removeClass('selected');
            $el.addClass('selected');

            this.selectedFile = _.clone(this.collection.get($el.data('id')));
            this.listenTo(this.selectedFile, 'change', this.refreshList);

            this.renderActions();
        },

        /**
         * unselects the selectedFile by redrawing the actions view and removing
         * the selected clas from HTML element
         */
        unselectFile: function(){
            if (this.selectedFile == null || this.selectedFile == undefined)
                return;

            this.$('.file.selected').removeClass('selected');
            this.selectedFile = null;

            this.renderActions();
        },

        /**
         * Refreshes the file list. Useful for sorting and File changes
         */
        refreshList: function() {
            // Render file list
            this.$('tbody').empty();
            this.collection.each(this.renderFile, this);
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
            this.$el.html(this.template({file:this.model}));

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
            event.preventDefault();
            event.stopPropagation();

            var $el = $(event.currentTarget);

            this.trigger('performAction', $el.data('action'));
        }
    });

    Filer.Views.BookmarkListView = Filer.Views.FileListView.extend({
        templateName: '#bookmark-list-template',

        /**
         * Override bookmark action. On this view triggering this
         * action will only remove the selected file from the list
         */
        performActionBookmark: function(){
            this.collection.remove(this.selectedFile);
            this.selectedFile.set('bookmarked', !this.selectedFile.get('bookmarked'));
            this.selectedFile.save();

            this.unselectFile();
        }
    });

    Filer.Views.SearchView = Filer.Views.BaseView.extend({
        id: 'search-file',
        events: {
            'click #submit-search-file': 'submitSearch',
            'click #clear-search-file': 'clearSearch'
        },

        initialize: function() {
            this.template = _.template($('#file-search-template').html());
            this.render();
        },

        render: function() {
            this.$el.empty();
            this.$el.html(this.template());

            return this;
        },

        submitSearch: function(event) {
            event.preventDefault();
            event.stopPropagation();

            this.trigger('search', this.getQuery());
        },

        clearSearch: function(event) {
            event.preventDefault();
            event.stopPropagation();

            this.$('input[name=search]').val("");

            this.trigger('search', this.getQuery());
        },

        /**
         * Retrieves search value from input
         *
         * @returns String
         */
        getQuery: function() {
            return this.$('input[name=search]').val();
        }
    });

    Filer.Views.EditView = Filer.Views.BaseView.extend({
        el: "#file-container",
        events: {
            'click #submit-form': 'submitForm',
            'click #cancel-form': 'cancelForm'
        },
        selectedFile: undefined,
        initialize: function(id) {
            this.constructor.__super__.initialize.apply(this, arguments);

            if (id !== undefined) {
                var files = new Filer.FileCollection();
                files.fetch();

                // try to get File instance for given id
                try {
                    this.selectedFile = files.find(function(file) { return file.get('id') == id; });
                } catch( err ) {
                    console.error(err);
                }
            }

            this.template = _.template($('#edit-file-template').html());
            this.render();
        },

        submitForm: function(event) {
            event.preventDefault();
            event.stopPropagation();

            var data = this.$( 'form' ).serializeArray(),
                collection = new Filer.FileCollection(),
                fileData = {},
                file;

            $.map(data, function( prop ){
                fileData[prop['name']] = prop['value'];
            });

            // TODO: form validation

            // Only create TXT files so append txt extension
            if (fileData[ 'filename' ].split('.').pop() !== 'txt') {
                fileData[ 'filename' ] += '.txt';
            }

            if (this.selectedFile) {
                file = this.selectedFile;
                file.set(fileData);
            } else {
                file = new Filer.File(fileData);
            }

            collection.add(file);
            file.save();

            // navigate to homepage
            location.href ="#"
        },

        cancelForm: function(event) {
            event.preventDefault();
            event.stopPropagation();

            // navigate to homepage
            location.href ="#"
        },

        render: function() {
            this.$el.empty();
            this.$el.append(this.template({selectedFile: this.selectedFile}));

            return this;
        }
    });
})($);