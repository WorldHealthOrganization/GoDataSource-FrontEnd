import { Component, HostListener, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { I18nService } from './core/services/helper/i18n.service';
import { SystemSettingsDataService } from './core/services/data/system-settings.data.service';
import { SystemSettingsVersionModel } from './core/models/system-settings-version.model';
import { BulkCacheHelperService } from './core/services/helper/bulk-cache-helper.service';

@Component({
  selector: 'app-root',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // instance configuration
  systemSettingsVersion: SystemSettingsVersionModel;

  /**
   * Constructor
   */
  constructor(
    i18nService: I18nService,
    systemSettingsDataService: SystemSettingsDataService,
    bulkCacheHelperService: BulkCacheHelperService,
    // used by ngx color picker - to display as popup
    // ngx-color-picker.mjs:1352 You are using cpUseRootViewContainer, but the root component is not exposing viewContainerRef!Please expose it by adding 'public vcRef: ViewContainerRef' to the constructor.
    public viewContainerRef: ViewContainerRef
  ) {
    // update once
    this.updateVHOnWindowResize();

    // load the default language
    i18nService.loadUserLanguage().subscribe();

    // determine if this is a demo or production instance
    // - we need to retrieve no cache to make sure we have the latest timezone
    systemSettingsDataService
      .getAPIVersion()
      .subscribe((systemSettingsVersion) => {
        // retrieve api info
        this.systemSettingsVersion = systemSettingsVersion;
      });

    // clear expired cache data
    bulkCacheHelperService.clearBulkSelected(true);
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
