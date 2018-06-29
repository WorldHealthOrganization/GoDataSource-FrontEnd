import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { I18nService } from './core/services/helper/i18n.service';

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
    }
}
