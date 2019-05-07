/* A polyfill for browsers that don't support ligatures. */
/* The script tag referring to this file must be placed before the ending body tag. */

/* To provide support for elements dynamically added, this script adds
   method 'icomoonLiga' to the window object. You can pass element references to this method.
*/
(function () {
    'use strict';
    function supportsProperty(p) {
        var prefixes = ['Webkit', 'Moz', 'O', 'ms'],
            i,
            div = document.createElement('div'),
            ret = p in div.style;
        if (!ret) {
            p = p.charAt(0).toUpperCase() + p.substr(1);
            for (i = 0; i < prefixes.length; i += 1) {
                ret = prefixes[i] + p in div.style;
                if (ret) {
                    break;
                }
            }
        }
        return ret;
    }
    var icons;
    if (!supportsProperty('fontFeatureSettings')) {
        icons = {
            'ellipse_shape': '&#xe92f;',
            'pentagon_shape': '&#xe930;',
            'rectangle_shape': '&#xe931;',
            'star_shape': '&#xe932;',
            'contacts': '&#xe924;',
            'person_add': '&#xe925;',
            'turned_in': '&#xe926;',
            'nature_people': '&#xe927;',
            'airline_seat_flat': '&#xe928;',
            'commute': '&#xe929;',
            'touch_app': '&#xe92a;',
            'hotel': '&#xe92b;',
            'pan_tool': '&#xe92c;',
            'free_breakfast': '&#xe92d;',
            'supervisor': '&#xe920;',
            'arrowDropdownCircle': '&#xe91f;',
            'visibilityOf': '&#xe91d;',
            'visibility': '&#xe91e;',
            'swapVertical': '&#xe91c;',
            'close': '&#xe91b;',
            'person_pin': '&#xe91a;',
            'columns': '&#xe919;',
            'groupWork': '&#xe918;',
            'location': '&#xe917;',
            'barChart': '&#xe915;',
            'timelineChart': '&#xe916;',
            'filter': '&#xe914;',
            'thinArrowRight': '&#xe913;',
            'addCircle': '&#xe900;',
            'fileCopy': '&#xe911;',
            'account': '&#xe912;',
            'language': '&#xe906;',
            'bug': '&#xe902;',
            'newFolder': '&#xe903;',
            'event': '&#xe904;',
            'thinArrowDown': '&#xe905;',
            'people': '&#xe907;',
            'settings': '&#xe910;',
            'help': '&#xe90f;',
            'link': '&#xe90e;',
            'delete': '&#xe90d;',
            'arrowDown': '&#xe90c;',
            'moreVertical': '&#xe90b;',
            'search': '&#xe908;',
            'add': '&#xe909;',
            'menu': '&#xe90a;',
            'home': '&#xe901;',
            'info': '&#xe923;',
            'refresh': '&#xe92e;',
            'lab': '&#xe9aa;',
            'arrowADown': '&#xe922;',
            'arrowAUp': '&#xe921;',
          '0': 0
        };
        delete icons['0'];
        window.icomoonLiga = function (els) {
            var classes,
                el,
                i,
                innerHTML,
                key;
            els = els || document.getElementsByTagName('*');
            if (!els.length) {
                els = [els];
            }
            for (i = 0; ; i += 1) {
                el = els[i];
                if (!el) {
                    break;
                }
                classes = el.className;
                if (/xt-icon/.test(classes)) {
                    innerHTML = el.innerHTML;
                    if (innerHTML && innerHTML.length > 1) {
                        for (key in icons) {
                            if (icons.hasOwnProperty(key)) {
                                innerHTML = innerHTML.replace(new RegExp(key, 'g'), icons[key]);
                            }
                        }
                        el.innerHTML = innerHTML;
                    }
                }
            }
        };
        window.icomoonLiga();
    }
}());
