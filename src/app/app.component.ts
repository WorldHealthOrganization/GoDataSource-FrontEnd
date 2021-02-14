import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { I18nService } from './core/services/helper/i18n.service';
import { SystemSettingsDataService } from './core/services/data/system-settings.data.service';
import { SystemSettingsVersionModel } from './core/models/system-settings-version.model';

@Component({
    selector: 'app-root',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
    // instance configuration
    systemSettingsVersion: SystemSettingsVersionModel;

    /**
     * Constructor
     */
    constructor(
        private i18nService: I18nService,
        private systemSettingsDataService: SystemSettingsDataService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        // load the default language
        this.i18nService.loadUserLanguage().subscribe();

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

        // determine if this is a demo or production instance
        this.systemSettingsDataService
            .getAPIVersion()
            .subscribe((systemSettingsVersion) => {
                this.systemSettingsVersion = systemSettingsVersion;
            });
    }
}
