import { Component, HostListener, OnInit, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { I18nService } from './core/services/helper/i18n.service';
import { SystemSettingsDataService } from './core/services/data/system-settings.data.service';
import { SystemSettingsVersionModel } from './core/models/system-settings-version.model';
import { BulkCacheHelperService } from './core/services/helper/bulk-cache-helper.service';
import { LocalizationHelper } from './core/helperClasses/localization-helper';

@Component({
  selector: 'app-root',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  // instance configuration
  systemSettingsVersion: SystemSettingsVersionModel;

  /**
   * Constructor
   */
  constructor(
    private i18nService: I18nService,
    private systemSettingsDataService: SystemSettingsDataService,
    protected bulkCacheHelperService: BulkCacheHelperService,
    // used by ngx color picker - to display as popup
    // ngx-color-picker.mjs:1352 You are using cpUseRootViewContainer, but the root component is not exposing viewContainerRef!Please expose it by adding 'public vcRef: ViewContainerRef' to the constructor.
    public viewContainerRef: ViewContainerRef
  ) {
    // update once
    this.updateVHOnWindowResize();
  }

  /**
   * Component initialized
   */
  ngOnInit() {
    // load the default language
    this.i18nService.loadUserLanguage().subscribe();

    // determine if this is a demo or production instance
    // - we need to retrieve no cache to make sure we have the latest timezone
    this.systemSettingsDataService
      .getAPIVersionNoCache()
      .subscribe((systemSettingsVersion) => {
        // retrieve api info
        this.systemSettingsVersion = systemSettingsVersion;

        // set default timezone
        // IMPORTANT: this could be done at user level at a later stage, for now it was proposed but WHO decided to keep it per instance
        LocalizationHelper.initialize(this.systemSettingsVersion.timezone);
      });

    // clear expired cache data
    this.bulkCacheHelperService.clearBulkSelected(true);
  }

  /**
   * Update vh
   * - fix for mobile height not being determined properly
   */
  @HostListener('window:resize')
  private updateVHOnWindowResize(): void {
    const vh: number = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
}
