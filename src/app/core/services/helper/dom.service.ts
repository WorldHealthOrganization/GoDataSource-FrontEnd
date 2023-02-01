import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import html2canvas from 'html2canvas';
import { ImportExportDataService } from '../data/import-export.data.service';
import { map } from 'rxjs/operators';
import * as FileSaver from 'file-saver';

@Injectable()
export class DomService {
  /**
   * Constructor
   */
  constructor(
    private importExportDataService: ImportExportDataService
  ) {}

  /**
     * Scroll to the end of the list of elements with the given css selector
     * @param selector
     * @param block
     */
  scrollItemIntoView(
    selector,
    block: string = 'end'
  ) {
    setTimeout(function() {
      const item = document.querySelector(selector);
      if (
        item &&
                item.scrollIntoView
      ) {
        item.scrollIntoView({
          behavior: 'smooth',
          block: block
        } as ScrollIntoViewOptions);
      }
    });
  }

  /**
   * Convert html to base 64 png
   */
  convertHTML2DataUriPNG(
    htmlElement: HTMLElement,
    options?: {
      onclone?: (document: Document, element: HTMLElement) => void
    }
  ): Observable<string> {
    return new Observable<string>((subscriber) => {
      html2canvas(
        htmlElement, {
          allowTaint: true,
          backgroundColor: null,
          logging: false,
          removeContainer: true,
          ignoreElements: (node): boolean => {
            return node.tagName === 'A' ||
              node.tagName === 'BUTTON' ||
              node.tagName === 'APP-FORM-SELECT-SINGLE-V2';
          },
          onclone: options?.onclone
        }
      ).then((canvas) => {
        // determine image uri
        const dataBase64: string = canvas.toDataURL('image/png')
          .replace('data:image/png;base64,', '');

        // finished
        subscriber.next(dataBase64);
        subscriber.complete();
      }).catch((err) => {
        subscriber.error(err);
        subscriber.complete();
      });
    });
  }

  /**
   * Convert html to base 64 png
   */
  convertHTML2PDF(
    htmlElement: HTMLElement,
    fileName: string,
    options?: {
      onclone?: (document: Document, element: HTMLElement) => void,
      splitType?: 'grid' | 'auto'
    }
  ): Observable<void> {
    return this.convertHTML2DataUriPNG(
      htmlElement, {
        onclone: options?.onclone
      }
    ).pipe(
      switchMap((dataBase64) => {
        return this.importExportDataService
          .exportImageToPdf({
            image: dataBase64,
            responseType: 'blob',
            splitFactor: 1,
            splitType: options?.splitType
          });
      }),
      map((blob) => {
        // export file
        FileSaver.saveAs(
          blob,
          fileName
        );
      })
    );
  }
}
