import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { I18nService } from './core/services/helper/i18n.service';
import { environment } from '../environments/environment';

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

        // setup google api with key retrieved from env
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.defer = true;
        script.async = true;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleApiKey}`;
        document.head.appendChild(script);
    }
}
