import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { map } from 'rxjs/operators';
import { I18nService } from './i18n.service';
import { ToastrService } from 'ngx-toastr';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ToastV2Service {
  // Keep a list of errors that can be viewed later
  private static _HISTORY: {
    id: string,
    title: string,
    details: string
  }[] = [];
  static get HISTORY(): {
    data: {
      id: string,
      title: string,
      details: string
    }[],
    length: number
  } {
    return {
      data: ToastV2Service._HISTORY,
      length: ToastV2Service._HISTORY.length
    };
  }

  // Default timeout
  private static TIMEOUT: number = 5000;

  // keep toast id to payload
  private static TOASTS: {
    [messageId: string]: number
  } = {};

  // history changed
  readonly historyChanged: BehaviorSubject<void> = new BehaviorSubject<void>(null);

  /**
   * Constructor
   */
  constructor(
    private i18nService: I18nService,
    private toastrService: ToastrService
  ) {}

  /**
   * Clear history
   */
  clearHistory(): void {
    // clear
    ToastV2Service._HISTORY = [];

    // push change
    this.historyChanged.next();
  }

  /**
   * Remove one item from history
   */
  removeHistory(id: string): void {
    // clear
    ToastV2Service._HISTORY = ToastV2Service._HISTORY.filter((item) => item.id !== id);

    // push change
    this.historyChanged.next();
  }

  /**
   * Handles both show err and show api error
   */
  error(
    err: { code: string, message?: string } | string,
    translateData?: {
      [key: string]: string
    },
    messageId?: string,
    details?: string
  ): void {
    // is our error a token ?
    if (typeof err === 'string') {
      this.i18nService
        .get(err as string, translateData)
        .subscribe((messageTranslated) => {
          // don't add again if toast with same id exists
          if (
            messageId &&
            ToastV2Service.TOASTS[messageId]
          ) {
            return;
          }

          // show toast
          const toast = this.toastrService.error(
            messageTranslated,
            undefined, {
              timeOut: messageId ? 0 : ToastV2Service.TIMEOUT,
              disableTimeOut: !!messageId,
              tapToDismiss: !messageId
            }
          );

          // add it to history too
          if (!messageId) {
            // add to list
            ToastV2Service._HISTORY.push({
              id: uuid(),
              title: messageTranslated,
              details
            });

            // push change
            this.historyChanged.next();
          }

          // add toast to list of maps to easily hide it later
          if (messageId) {
            // map
            ToastV2Service.TOASTS[messageId] = toast.toastId;

            // handle tap - hide toast
            toast.onTap.subscribe((function(service: ToastV2Service, localMessageId: string) {
              return () => {
                service.hide(localMessageId);
              };
            })(this, messageId));
          }
        });

      // finished
      return;
    }

    // not a string, so it should be an error
    // get the error message for the received API Error Code
    let apiErrorCode = err.code ? err.code : 'UNKNOWN_ERROR';
    apiErrorCode = `LNG_API_ERROR_CODE_${apiErrorCode}`;
    this.i18nService
      .get(apiErrorCode, translateData)
      .subscribe((apiErrorMessage) => {
        if (apiErrorMessage === apiErrorCode) {
          // translation not found; show default error message
          return this.i18nService
            .get('LNG_API_ERROR_CODE_UNKNOWN_ERROR')
            .subscribe((defaultErrorMessage) => {
              this.error(
                defaultErrorMessage,
                translateData,
                messageId,
                err.message
              );
            });
        } else {
          // show the error message
          this.error(
            apiErrorMessage,
            translateData,
            messageId,
            err.message
          );
        }
      });
  }

  /**
   * Success message
   */
  success(
    message: string,
    translateData?: {
      [key: string]: string
    },
    messageId?: string
  ): void {
    this.i18nService
      .get(message, translateData)
      .subscribe((messageTranslated) => {
        // don't add again if toast with same id exists
        if (
          messageId &&
          ToastV2Service.TOASTS[messageId]
        ) {
          return;
        }

        // show toast
        const toast = this.toastrService.success(
          messageTranslated,
          undefined, {
            timeOut: messageId ? 0 : ToastV2Service.TIMEOUT,
            disableTimeOut: !!messageId,
            tapToDismiss: !messageId
          }
        );

        // add toast to list of maps to easily hide it later
        if (messageId) {
          // map
          ToastV2Service.TOASTS[messageId] = toast.toastId;

          // handle tap - hide toast
          toast.onTap.subscribe((function(service: ToastV2Service, localMessageId: string) {
            return () => {
              service.hide(localMessageId);
            };
          })(this, messageId));
        }
      });
  }

  /**
   * Notice message
   */
  notice(
    message: string,
    translateData?: {
      [key: string]: string
    },
    messageId?: string
  ): void {
    this.i18nService
      .get(message, translateData)
      .subscribe((messageTranslated) => {
        // don't add again if toast with same id exists
        if (
          messageId &&
          ToastV2Service.TOASTS[messageId]
        ) {
          return;
        }

        // show toast
        const toast = this.toastrService.info(
          messageTranslated,
          undefined, {
            timeOut: messageId ? 0 : ToastV2Service.TIMEOUT,
            disableTimeOut: !!messageId,
            tapToDismiss: !messageId
          }
        );

        // add toast to list of maps to easily hide it later
        if (messageId) {
          // map
          ToastV2Service.TOASTS[messageId] = toast.toastId;

          // handle tap - hide toast
          toast.onTap.subscribe((function(service: ToastV2Service, localMessageId: string) {
            return () => {
              service.hide(localMessageId);
            };
          })(this, messageId));
        }
      });
  }

  /**
   * Hide a sticky message
   */
  hide(messageId?: string): void {
    // do we have a toast with this id ?
    if (
      !messageId ||
      !ToastV2Service.TOASTS[messageId]
    ) {
      return;
    }

    // hide toast
    this.toastrService.remove(ToastV2Service.TOASTS[messageId]);
    delete ToastV2Service.TOASTS[messageId];
  }

  /**
   * Translate error message corresponding to the API Error received
   */
  translateErrors(
    errors: {
      err,
      translateData?: {},
      echo?: any
    }[]
  ): Observable<{ message: string, echo: any }[]> {
    // construct array of items to translate
    const observers: Observable<string>[] = [];
    (errors || []).forEach((errData) => {
      observers.push(new Observable((obs) => {
        // get the error message for the received API Error Code
        let apiErrorCode = errData.err.code ? errData.err.code : 'UNKNOWN_ERROR';

        // add language token prefix for API Error codes
        apiErrorCode = `LNG_API_ERROR_CODE_${apiErrorCode}`;

        // try using the api error in english...better than using general error
        const defaultApiErrorCode = 'LNG_API_ERROR_CODE_UNKNOWN_ERROR';
        if (
          apiErrorCode === defaultApiErrorCode &&
          errData.err.details.messages &&
          Object.keys(errData.err.details.messages).length > 0
        ) {
          // determine error message
          let finalMsg: string = '';
          Object.keys(errData.err.details.messages).forEach((key) => {
            finalMsg += (finalMsg ? '<br />' : '') + key + ' ' + (errData.err.details.messages[key] as string[]).join(', ');
          });

          // use this error message, no need to translate
          if (finalMsg) {
            obs.next(finalMsg);
            obs.complete();
            return;
          }
        }

        // translate
        return this.i18nService
          .get(apiErrorCode, errData.translateData)
          .subscribe((apiErrorMessage) => {
            if (apiErrorMessage === apiErrorCode) {
              // translation not found; show default error message
              return this.i18nService
                .get(defaultApiErrorCode)
                .subscribe((defaultErrorMessage) => {
                  obs.next(defaultErrorMessage);
                  obs.complete();
                });
            } else {
              obs.next(apiErrorMessage);
              obs.complete();
            }
          });
      }));
    });

    // execute joins in parallel
    return observers.length < 1 ?
      of([]) :
      forkJoin(observers)
        .pipe(
          map((data) => {
            return data.map((item, index) => {
              return {
                message: item,
                echo: errors[index] ?
                  errors[index].echo :
                  null
              };
            });
          })
        );
  }
}
