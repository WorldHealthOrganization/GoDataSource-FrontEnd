import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { map } from 'rxjs/operators';
import { I18nService } from './i18n.service';
import { ToastrService } from 'ngx-toastr';
import { v4 as uuid } from 'uuid';
import { IToastV2, ToastV2Type } from './models/toast.model';

@Injectable()
export class ToastV2Service implements OnDestroy {
  // Keep a list of errors that can be viewed later
  private static _HISTORY: {
    id: string,
    title: string,
    details: string,
    definition: IToastV2
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
  private static readonly _TOASTS: {
    [messageId: string]: {
      id: number,
      definition: IToastV2
    }
  } = {};

  // history changed
  readonly historyChanged: BehaviorSubject<void> = new BehaviorSubject<void>(null);

  // language handler
  private languageSubscription: Subscription;

  /**
   * Constructor
   */
  constructor(
    private i18nService: I18nService,
    private toastrService: ToastrService
  ) {
    this.languageSubscription = this.i18nService.languageChangedEvent
      .subscribe(() => {
        // reprocess ToastV2Service._TOASTS
        Object.keys(ToastV2Service._TOASTS).forEach((messageId) => {
          // retrieve definition
          const definition: IToastV2 = ToastV2Service._TOASTS[messageId].definition;

          // remove
          this.hide(messageId);

          // show again with new translation - works as long as we have tokens in definition and not translated text...which is a different matter
          this.processDefinition(definition);
        });

        // reprocess ToastV2Service._HISTORY
        ToastV2Service._HISTORY.forEach((item) => {
          // retrieve definition
          const definition: IToastV2 = item.definition;

          // remove
          this.removeHistory(item.id);

          // show again with new translation - works as long as we have tokens in definition and not translated text...which is a different matter
          this.processDefinition(definition);
        });
      });
  }

  /**
   * Destroyed
   */
  ngOnDestroy(): void {
    // stop refresh language tokens
    this.releaseLanguageChangeListener();
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

  /**
   * Process definition
   */
  private processDefinition(definition: IToastV2): void {
    switch (definition.type) {
      case ToastV2Type.ERROR:
        // show error
        this.error(
          definition.err,
          definition.translateData,
          definition.messageId,
          definition.details
        );

        // finished
        break;

      case ToastV2Type.SUCCESS:
        // show error
        this.success(
          definition.message,
          definition.translateData,
          definition.messageId
        );

        // finished
        break;

      case ToastV2Type.NOTICE:
        // show error
        this.notice(
          definition.message,
          definition.translateData,
          definition.messageId
        );

        // finished
        break;
    }
  }

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
            ToastV2Service._TOASTS[messageId]
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
              details,
              definition: {
                type: ToastV2Type.ERROR,
                err,
                translateData,
                messageId,
                details
              }
            });

            // push change
            this.historyChanged.next();
          }

          // add toast to list of maps to easily hide it later
          if (messageId) {
            // map
            ToastV2Service._TOASTS[messageId] = {
              id: toast.toastId,
              definition: {
                type: ToastV2Type.ERROR,
                err,
                translateData,
                messageId,
                details
              }
            };

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
          ToastV2Service._TOASTS[messageId]
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
          ToastV2Service._TOASTS[messageId] = {
            id: toast.toastId,
            definition: {
              type: ToastV2Type.SUCCESS,
              message,
              translateData,
              messageId
            }
          };

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
          ToastV2Service._TOASTS[messageId]
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
          ToastV2Service._TOASTS[messageId] = {
            id: toast.toastId,
            definition: {
              type: ToastV2Type.NOTICE,
              message,
              translateData,
              messageId
            }
          };

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
      !ToastV2Service._TOASTS[messageId]
    ) {
      return;
    }

    // hide toast
    this.toastrService.remove(ToastV2Service._TOASTS[messageId].id);
    delete ToastV2Service._TOASTS[messageId];
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
