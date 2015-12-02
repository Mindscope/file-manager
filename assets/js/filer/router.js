(function($) {
    Filer.Router = Backbone.Router.extend({

        routes: {
            '': 'home',
            'bookmarks': 'bookmarks',
            'file': 'create',
            'file/:id': 'edit'
        },
        _currentView: null,

        showView: function (view, args) {
            var interval = PAGE_TRANSITION_INTERVAL,
                that = this;

            args = args || {};

            if (view != this._currentView) {
                if (this._currentView != null) {
                    this._currentView.$el.removeClass("in").addClass("transition out");
                } else {
                    interval = 0;
                }

                setTimeout(function () {
                    if (that._currentView != null && that._currentView.remove != null)
                        that._currentView.remove();

                    that._currentView = null;

                    that._currentView = new view(args);
                    that._currentView.$el.removeClass("out").addClass("in");
                }, interval);

            }
        },

        home: function () {
            // Load initial data into files collection
            var filesCollection = new Filer.FileCollection();
            filesCollection.fetch();

            this.showView(Filer.Views.FileListView, {collection: filesCollection});
        },

        bookmarks: function () {
            var filesCollection = new Filer.FileCollection();
            filesCollection.fetch();

            var bookmarked = new Filer.FileCollection(filesCollection.bookmarked());

            this.showView(Filer.Views.BookmarkListView, {collection: bookmarked});
        },

        create: function () {
            this.showView(Filer.Views.EditView);
        },

        edit: function (id) {
            this.showView(Filer.Views.EditView, id);
        }
    });
})($);