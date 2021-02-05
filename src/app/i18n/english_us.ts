// tslint:disable:max-line-length
export const EnglishUsLang = {
    id: 'english_us',
    tokens: {
        /**
         * IMPORTANT: All the tokens must belong to a group mentioned in a comment like this one
         * IMPORTANT: The group must be mentioned with space separator ("Example group") or in camelCase format ("exampleGroup")
         */

        /**
         * Example group
         */
        // 'LNG_EXAMPLE_TOKEN': 'Example value'

        /**
         * uiBackupFields
         */
         'LNG_BACKUP_FIELD_LABEL_DURATION': 'Duration',

        /**
         * New group
         * referenceDataOutbreakMapServerType
         */
        'LNG_REFERENCE_DATA_OUTBREAK_MAP_SERVER_TYPE': 'Map Type',
        'LNG_REFERENCE_DATA_OUTBREAK_MAP_SERVER_TYPE_DESCRIPTION': '' +
            '<div style="padding-bottom: 10px">Specify the layer source of the REST service for this layer of map information. If you leave this blank when creating an outbreak, the system will default to using WHO\'s source layer.</div>' +
            '<div style="padding-bottom: 10px"><span style="color: #770000; font-weight: bold;">[Tile - TileArcGISRest]</span> - Layer source that provide pre-rendered, tiled images in grids that are organized by zoom levels for specific resolutions.<div>' +
            '<div style="padding-bottom: 10px"><span style="color: #770000; font-weight: bold;">[Tile - XYZ]</span> - Layer source for tile data with URLs in a set XYZ format that are defined in a URL template. By default, this follows the widely-used Google grid where x 0 and y 0 are in the top left. Grids like TMS where x 0 and y 0 are in the bottom left can be used by using the {-y} placeholder in the URL template, so long as the source does not have a custom tile grid.' +
            '<div style="padding-bottom: 10px"><span style="color: #770000; font-weight: bold;">[VectorTile - VectorTileLayer]</span> - Layer source for vector tile data that is rendered client-side.<div>',
        'LNG_REFERENCE_DATA_OUTBREAK_MAP_SERVER_TYPE_TILE_TILE_ARC_GIS_REST_DESCRIPTION': 'Layer source that provide pre-rendered, tiled images in grids that are organized by zoom levels for specific resolutions.',
        'LNG_REFERENCE_DATA_OUTBREAK_MAP_SERVER_TYPE_TILE_XYZ': 'Tile - XYZ',
        'LNG_REFERENCE_DATA_OUTBREAK_MAP_SERVER_TYPE_TILE_XYZ_DESCRIPTION': 'Layer source for tile data with URLs in a set XYZ format that are defined in a URL template. By default, this follows the widely-used Google grid where x 0 and y 0 are in the top left. Grids like TMS where x 0 and y 0 are in the bottom left can be used by using the {-y} placeholder in the URL template, so long as the source does not have a custom tile grid.',
        'LNG_REFERENCE_DATA_OUTBREAK_MAP_SERVER_TYPE_VECTOR_TILE_VECTOR_TILE_LAYER': 'VectorTile - VectorTileLayer',
        'LNG_REFERENCE_DATA_OUTBREAK_MAP_SERVER_TYPE_VECTOR_TILE_VECTOR_TILE_LAYER_DESCRIPTION': 'Layer source for vector tile data that.',

        /**
         * REMOVE the tokens from below
         */
        // ...
    }
};
