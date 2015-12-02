var LOCALSTORAGE_NAME = 'files-store',
    AVAILABLE_ACTIONS = {
        DOWNLOAD: 'download',
        PREVIEW: 'preview',
        BOOKMARK: 'bookmark',
        EDIT: 'edit'
    },
    INITIAL_DATA = [
        {'filename': 'index.html', 'size': 13},
        {'filename': 'contact.html', 'size': 12, bookmarked: true},
        {'filename': 'sample.png', 'size': 65},
        {'filename': 'sample.txt', content: 'Lorem Ipsum dolor sit amet.'}
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
    },
    PAGE_TRANSITION_INTERVAL = 300;

var Filer = {
    Views: {},
    router: null,

    init: function () {

        // Set initial data to localStorage if no data is saved
        if (!localStorage.getItem(LOCALSTORAGE_NAME)) {

            var initialDataCollection = new Filer.FileCollection();
            initialDataCollection.add(INITIAL_DATA);

            initialDataCollection.each(function (file) {
                file.save();
            });
        }

        // Start router and history
        this.router = new Filer.Router();
        Backbone.history.start();
    }
};

$(function() {
    Filer.init();
});

