import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, Subscriber } from 'rxjs';
import { DialogV2Service } from '../helper/dialog-v2.service';

@Injectable()
export class ImageResolver implements Resolve<any> {
  // required images
  private static _requiredImages: {
    [imagePath: string]: boolean
  } = {
      'images/gd-logo.svg': false,
      'images/gd-logomark.svg': false
    };
  private _loadingKey: string = 'image';

  /**
   * Constructor
   */
  constructor(
    private dialogV2Service: DialogV2Service
  ) {}

  /**
   * Load Images
   */
  private loadImages(observer: Subscriber<void>): void {
    // determine image paths to load
    const imgKeys: string[] = Object.keys(ImageResolver._requiredImages);

    // resolve
    const resolve = () => {
      // hide loading
      this.dialogV2Service.hideGlobalLoadingDialog(this._loadingKey);

      // resolve
      observer.next();
      observer.complete();
    };

    // nothing to load ?
    if (imgKeys.length < 1) {
      // finished
      resolve();
      return;
    }

    // images loaded ?
    const imagesLoaded: () => boolean = () => {
      // check if everything was loaded
      let allLoaded: boolean = true;
      for (let imgIndex = 0; imgIndex < imgKeys.length; imgIndex++) {
        if (!ImageResolver._requiredImages[imgKeys[imgIndex]]) {
          allLoaded = false;
          break;
        }
      }

      // images loaded ?
      return allLoaded;
    };

    // check if images are already loaded
    if (imagesLoaded()) {
      // finished
      resolve();
      return;
    }

    // load images
    imgKeys.forEach((img) => {
      // init image
      const imgObject = new Image();

      // load handler
      imgObject.onload = () => {
        // mark as loaded
        ImageResolver._requiredImages[img] = true;

        // all images loaded ?
        if (imagesLoaded()) {
          // finished
          resolve();
        }
      };

      // image to load
      imgObject.src = `assets/${img}`;
    });
  }

  /**
   * Images loaded, we can display the website pages
   */
  resolve(): Observable<any> {
    return new Observable((observer: Subscriber<void>) => {
      // show loading
      this.dialogV2Service.showGlobalLoadingDialog(this._loadingKey);

      // check if required fonts were loaded
      this.loadImages(observer);
    });
  }
}
