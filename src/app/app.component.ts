import { Component, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
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
    this.systemSettingsDataService
      .getAPIVersion()
      .subscribe((systemSettingsVersion) => {
        this.systemSettingsVersion = systemSettingsVersion;
      });
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
