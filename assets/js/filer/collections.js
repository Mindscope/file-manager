(function(){
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

        _searchFields: ['filename'],

        /**
         * Special filter that returns all FIle instances that are bookmarked
         *
         * @returns {Array.<T>|*|{TAG, CLASS, ATTR, CHILD, PSEUDO}}
         */
        bookmarked: function() {
            return this.filter(function(file){return file.get('bookmarked') == true;});
        },

        /**
         * Search File instances for given key within the
         * searchable fields
         *
         * @param query
         */
        search: function( query ) {
            var matches = [];
            var collection = this;
            var pattern = new RegExp( $.trim( query).replace(/\*/g, '').replace( / /gi, '|' ), "i");

            this.each(function(file){
                for (var attr in collection._searchFields) {
                    if( file.attributes.hasOwnProperty(collection._searchFields[attr]) && pattern.test(file.attributes[collection._searchFields[attr]]) ){
                        matches.push(file);
                    }
                }
            });

            return matches;
        },

        /**
         * Set sort property
         *
         * @param sortProperty
         */
        changeSort: function (sortProperty) {
            this.comparator = this.strategies[sortProperty];

            if (this.sortOrder < 0) {
                this.comparator = reverseSortBy(this.comparator);
            }
        },

        /**
         * Invert sort order
         */
        changeSortOrder: function() {
            this.sortOrder = -1 * this.sortOrder;
        }
    });
})($);