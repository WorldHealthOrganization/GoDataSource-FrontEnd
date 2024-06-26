import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-fancy-tooltip',
  templateUrl: './fancy-tooltip.component.html',
  styleUrls: ['./fancy-tooltip.component.scss']
})
export class FancyTooltipComponent implements OnInit, OnDestroy {
  // tooltip
  private _tooltipToken: string;
  private _tooltip: string | SafeHtml;
  @Input() set tooltip(tooltip: string | SafeHtml) {
    // keep original token for later use
    this._tooltipToken = tooltip ? tooltip.toString() : tooltip as string;

    // translate tokens if necessary
    this._tooltip = this._tooltipToken ?
      this.i18nService.instant(this._tooltipToken) :
      this._tooltipToken;

    // sanitize if necessary
    this._tooltip = this._tooltip ?
      this.sanitized.bypassSecurityTrustHtml(this._tooltip as string) :
      this._tooltip;
  }
  get tooltip(): string | SafeHtml {
    return this._tooltip;
  }

  // language subscription
  private languageSubscription: Subscription;

  /**
   * Constructor
   */
  constructor(
    protected i18nService: I18nService,
    private sanitized: DomSanitizer
  ) {}

  /**
   * Component initialized
   */
  ngOnInit(): void {
    // subscribe to language change
    this.initializeLanguageChangeListener();
  }

  /**
   * Component destroyed
   */
  ngOnDestroy(): void {
    // stop refresh language tokens
    this.releaseLanguageChangeListener();
  }

  /**
   *  Subscribe to language change
   */
  private initializeLanguageChangeListener(): void {
    // stop refresh language tokens
    this.releaseLanguageChangeListener();

    // attach event
    this.languageSubscription = this.i18nService.languageChangedEvent
      .subscribe(() => {
        this.tooltip = this._tooltipToken;
      });
  }

  /**
   * Release language listener
   */
  private releaseLanguageChangeListener(): void {
    // release language listener
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
      this.languageSubscription = null;
    }
  }

}
