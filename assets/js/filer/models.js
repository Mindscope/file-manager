(function($){
    Filer.File = Backbone.Model.extend({
        defaults: {
            'id': null,
            'filename': undefined,
            'content': undefined,
            'actions': [],
            'bookmarked': false,
            'size': Math.round(Math.random() * 30)
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
})($);
