import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import html2canvas from 'html2canvas';
import { ImportExportDataService } from '../data/import-export.data.service';
import { catchError } from 'rxjs/operators';
import * as FileSaver from 'file-saver';

/**
 * Convert html to pdf step
 */
export enum ConvertHtmlToPDFStep {
  INITIALIZED,
  CONVERTING_HTML_TO_PDF,
  EXPORTING_PDF
}

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
    },
    stateChanged?: (step: ConvertHtmlToPDFStep) => void
  ): Observable<void> {
    // step
    if (stateChanged) {
      stateChanged(ConvertHtmlToPDFStep.INITIALIZED);
    }

    // execute
    return new Observable((subscriber) => {
      setTimeout(() => {
        this.convertHTML2DataUriPNG(
          htmlElement, {
            onclone: options?.onclone
          }
        ).pipe(
          // handle error
          catchError((err) => {
            // send further
            subscriber.error(err);
            subscriber.complete();

            // finished
            return throwError(err);
          })
        ).subscribe((dataBase64) => {
          // step
          if (stateChanged) {
            stateChanged(ConvertHtmlToPDFStep.CONVERTING_HTML_TO_PDF);
          }

          // convert html to pdf
          return this.importExportDataService
            .exportImageToPdf({
              image: dataBase64,
              responseType: 'blob',
              splitFactor: 1,
              splitType: options?.splitType
            })
            .pipe(
              // handle error
              catchError((err) => {
                // send further
                subscriber.error(err);
                subscriber.complete();

                // finished
                return throwError(err);
              })
            )
            .subscribe((blob) => {
              // step
              if (stateChanged) {
                stateChanged(ConvertHtmlToPDFStep.EXPORTING_PDF);
              }

              // export file
              FileSaver.saveAs(
                blob,
                fileName
              );

              // finished
              subscriber.next();
              subscriber.complete();
            });
        });
      }, 200);
    });
  }
}
