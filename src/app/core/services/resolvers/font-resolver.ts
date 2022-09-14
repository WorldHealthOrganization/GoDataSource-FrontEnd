import { Injectable, OnDestroy } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, Subscriber } from 'rxjs';
import { DialogV2Service } from '../helper/dialog-v2.service';

@Injectable()
export class FontResolver implements Resolve<any>, OnDestroy {
  // timeout
  private _checkTimeout: any;

  // required fonts
  private _loadingKey: string = 'font';
  private _requiredFonts: {
    [fontFamily: string]: true
  } = {
      'Roboto': true,
      'Material Icons': true
    };

  /**
   * Constructor
   */
  constructor(
    private dialogV2Service: DialogV2Service
  ) {}

  /**
   * Stop timeout - probably never called when relevant
   */
  ngOnDestroy(): void {
    // stop timeout
    this.stopTimeout();
  }

  /**
   * Clear timeout
   */
  private stopTimeout(): void {
    if (this._checkTimeout) {
      clearTimeout(this._checkTimeout);
      this._checkTimeout = undefined;
    }
  }

  /**
   * Start timeout
   */
  private checkFonts(observer: Subscriber<void>): void {
    // clear previous timeout
    this.stopTimeout();

    // start
    this._checkTimeout = setTimeout(() => {
      // determine if required fonts were loaded
      let fontsLoaded: boolean = true;
      document.fonts.forEach((font) => {
        // check if font loaded
        if (
          this._requiredFonts[font.family] &&
          font.status !== 'loaded'
        ) {
          // font not loaded
          fontsLoaded = false;

          // do we need to force loading ?
          if (font.status === 'unloaded') {
            font.load();
          }
        }
      });

      // clear
      this._checkTimeout = undefined;

      // finished ?
      if (fontsLoaded) {
        // hide loading
        this.dialogV2Service.hideGlobalLoadingDialog(this._loadingKey);

        // resolve
        observer.next();
        observer.complete();

        // stop check loop
        return;
      }

      // check again later
      this.checkFonts(observer);
    }, 200);
  }

  /**
   * Fonts loaded, we can display the website pages
   */
  resolve(): Observable<any> {
    return new Observable((observer: Subscriber<void>) => {
      // show loading
      this.dialogV2Service.showGlobalLoadingDialog(this._loadingKey);

      // check if required fonts were loaded
      this.checkFonts(observer);
    });
  }
}
