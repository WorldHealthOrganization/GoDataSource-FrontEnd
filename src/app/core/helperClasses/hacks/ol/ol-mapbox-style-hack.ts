import VectorTileLayer from 'ol/layer/VectorTile';
import { Vector as VectorLayer } from 'ol/layer';
import * as olStyle from 'ol-mapbox-style';
import applyStyleFunction from './ol-mapbox-style-function-hack';

/**
 * This class should be removed after angular build-optimizer is fixed to properly build open-layers (mapbox)
 */
export abstract class OlMapboxStyleHack {
    // regex
    private static SPRITE_REGEX = /^(.*)(\?.*)$/;

    /**
     * With Path
     */
    private static withPath(url, path) {
        if (path && url.indexOf('.') === 0) {
            url = path + url;
        }
        return url;
    }

    /**
     * To Sprite URL
     */
    private static toSpriteUrl(url, path, extension) {
        url = OlMapboxStyleHack.withPath(url, path);
        const parts = url.match(OlMapboxStyleHack.SPRITE_REGEX);
        return parts ?
            parts[1] + extension + (parts.length > 2 ? parts[2] : '') :
            url + extension;
    }

    /**
     * #TODO TO BE REMOVED after upgrading angular since Angular might fix the buildOptimizer issue
     */
    static applyStyle(layer, glStyle, source, path, resolutions?): Promise<any> {
        return new Promise(function (resolve, reject) {
            // TODO: figure out where best place to check source type is
            // Note that the source arg is an array of gl layer ids and each must be
            // dereferenced to get source type to validate
            if (typeof glStyle !== 'object') {
                glStyle = JSON.parse(glStyle);
            }
            if (glStyle.version !== 8) {
                return reject(new Error('glStyle version 8 required.'));
            }
            if (!(layer instanceof VectorLayer || layer instanceof VectorTileLayer)) {
                return reject(new Error('Can only apply to VectorLayer or VectorTileLayer'));
            }
            let spriteScale, spriteData, spriteImageUrl, style;
            function onChange() {
                if (!style && (!glStyle.sprite || spriteData)) {
                    style = applyStyleFunction(layer, glStyle, source, resolutions, spriteData, spriteImageUrl, olStyle._getFonts);
                    if (!layer.getStyle()) {
                        reject(new Error('Nothing to show for source [' + source + ']'));
                    } else {
                        resolve();
                    }
                } else if (style) {
                    layer.setStyle(style);
                    resolve();
                } else {
                    reject(new Error('Something went wrong trying to apply style.'));
                }
            }
            if (glStyle.sprite) {
                spriteScale = window.devicePixelRatio >= 1.5 ? 0.5 : 1;
                const sizeFactor_1 = spriteScale === 0.5 ? '@2x' : '';
                let spriteUrl_1 = OlMapboxStyleHack.toSpriteUrl(glStyle.sprite, path, sizeFactor_1 + '.json');
                fetch(spriteUrl_1, { credentials: 'same-origin' })
                    .then(function (response) {
                        if (!response.ok && (sizeFactor_1 !== '')) {
                            spriteUrl_1 = OlMapboxStyleHack.toSpriteUrl(glStyle.sprite, path, '.json');
                            return fetch(spriteUrl_1, { credentials: 'same-origin' });
                        } else {
                            return response;
                        }
                    })
                    .then(function (response) {
                        if (response.ok) {
                            return response.json();
                        } else {
                            reject(new Error('Problem fetching sprite from ' + spriteUrl_1 + ': ' + response.statusText));
                        }
                    })
                    .then(function (spritesJson) {
                        if ((spritesJson === undefined)) {
                            return reject(new Error('No sprites found.'));
                        }
                        spriteData = spritesJson;
                        spriteImageUrl = OlMapboxStyleHack.toSpriteUrl(glStyle.sprite, path, sizeFactor_1 + '.png');
                        onChange();
                    })
                    .catch(function (err) {
                        reject(new Error('Sprites cannot be loaded: ' + spriteUrl_1 + ': ' + err.message));
                    });
            } else {
                onChange();
            }
        });
    }
}
