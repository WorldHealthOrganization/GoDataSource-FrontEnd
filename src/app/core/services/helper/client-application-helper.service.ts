import { Injectable } from '@angular/core';
import { SystemClientApplicationModel } from '../../models/system-client-application.model';
import { environment } from '../../../../environments/environment';
import { Observable, of, Subscriber } from 'rxjs';
import { IGeneralAsyncValidatorResponse } from '../../../shared/forms-v2/validators/general-async-validator.directive';
import * as _ from 'lodash';
import { SystemSettingsDataService } from '../data/system-settings.data.service';
import { catchError } from 'rxjs/operators';
import { DialogV2Service } from './dialog-v2.service';
import { ExportDataExtension, ExportDataMethod } from './models/dialog-v2.model';
import { I18nService } from './i18n.service';
import { LocalizationHelper } from '../../helperClasses/localization-helper';
import { IV2SideDialogConfigInputText, V2SideDialogConfigInputType } from '../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';

@Injectable({
  providedIn: 'root'
})
export class ClientApplicationHelperService {
  /**
   * Constructor
   */
  constructor(
    private systemSettingsDataService: SystemSettingsDataService,
    private dialogV2Service: DialogV2Service,
    private i18nService: I18nService
  ) {}

  /**
   * Download Configuration File
   */
  downloadConfFile(clientApplication: SystemClientApplicationModel): void {
    // construct api url if necessary
    let apiUrl: string = environment.apiUrl;
    apiUrl = apiUrl.indexOf('http://') === 0 || apiUrl.indexOf('https://') === 0 ?
      apiUrl : (
        (apiUrl.indexOf('/') === 0 ? '' : '/') +
        window.location.origin +
        apiUrl
      );

    // define api async check
    let apiURL: string;
    const apiObserver = new Observable((subscriber: Subscriber<boolean | IGeneralAsyncValidatorResponse>) => {
      if (
        _.isString(apiURL) &&
        apiURL.includes('localhost')
      ) {
        subscriber.next({
          isValid: false,
          errMsg: 'LNG_FORM_VALIDATION_ERROR_FIELD_URL'
        });
        subscriber.complete();
      } else {
        this.systemSettingsDataService
          .getAPIVersion(apiURL)
          .pipe(
            // throw error
            catchError(() => {
              // if request fails then error should be handled by subscribe (else branch)
              return of([]);
            })
          )
          .subscribe((versionData: any) => {
            // handle
            if (versionData.version) {
              subscriber.next(true);
            } else {
              subscriber.next({
                isValid: false,
                errMsg: 'LNG_FORM_VALIDATION_ERROR_FIELD_URL'
              });
            }

            // finished
            subscriber.complete();
          });
      }
    });

    // display export dialog
    this.dialogV2Service.showExportData({
      title: {
        get: () => 'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DOWNLOAD_CONF_FILE_DIALOG_TITLE'
      },
      export: {
        url: `/client-applications/${clientApplication.id}/configuration-file`,
        async: false,
        method: ExportDataMethod.GET,
        fileName: this.i18nService.instant('LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DOWNLOAD_CONF_FILE_FILE_NAME') +
          ' - ' +
          LocalizationHelper.now().format('YYYY-MM-DD'),
        allow: {
          types: [
            ExportDataExtension.QR
          ]
        },
        inputs: {
          append: [
            {
              type: V2SideDialogConfigInputType.TEXT,
              placeholder: 'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DOWNLOAD_CONF_FILE_DIALOG_URL_LABEL',
              name: 'url',
              value: apiUrl,
              validators: {
                required: () => true,
                async: (data) => {
                  apiURL = (data.map.url as IV2SideDialogConfigInputText).value;
                  return apiObserver;
                }
              }
            }
          ]
        }
      }
    });
  }
}
