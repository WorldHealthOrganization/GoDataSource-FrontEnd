import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { I18nService } from './core/services/helper/i18n.service';
import * as momentTimezone from 'moment-timezone';

@Component({
    selector: 'app-root',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {

    constructor(
        private i18nService: I18nService
    ) {}

    ngOnInit() {
        // load the default language
        this.i18nService.loadUserLanguage().subscribe();

        // set default timezone to utc
        momentTimezone.tz.setDefault('utc');

        // used by OpenLayers
        // The script below is only needed for old environments like Internet Explorer and Android 4.x
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://cdn.polyfill.io/v2/polyfill.min.js?features=requestAnimationFrame,Element.prototype.classList,URL';
        document.head.appendChild(script);

        // used by OpenLayers
        // css
        const style = document.createElement('link');
        style.rel = 'stylesheet';
        style.type = 'text/css';
        style.href = 'https://openlayers.org/en/v5.3.0/css/ol.css';
        document.head.appendChild(style);
    }
}
