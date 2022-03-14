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

    // determine if this is a demo or production instance
    this.systemSettingsDataService
      .getAPIVersion()
      .subscribe((systemSettingsVersion) => {
        this.systemSettingsVersion = systemSettingsVersion;
      });
  }
}
