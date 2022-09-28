import { Injectable } from '@angular/core';
import { Observable, Subject, throwError } from 'rxjs';
import {
  IV2SideDialog,
  IV2SideDialogAdvancedFiltersResponse,
  IV2SideDialogConfig,
  IV2SideDialogConfigButtonType,
  IV2SideDialogConfigInputCheckbox,
  IV2SideDialogConfigInputFilterList,
  IV2SideDialogConfigInputFilterListFilter,
  IV2SideDialogConfigInputFilterListSort,
  IV2SideDialogConfigInputMultiDropdown,
  IV2SideDialogConfigInputSingleDropdown,
  IV2SideDialogConfigInputText,
  IV2SideDialogHandler,
  IV2SideDialogResponse,
  V2SideDialogConfigAction,
  V2SideDialogConfigInput,
  V2SideDialogConfigInputType
} from '../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { ExportButtonKey, ExportDataExtension, ExportDataMethod, IV2ExportDataConfig, IV2ExportDataConfigLoaderConfig, IV2ExportDataConfigProgressAnswer } from './models/dialog-v2.model';
import { IV2LoadingDialogHandler } from '../../../shared/components-v2/app-loading-dialog-v2/models/loading-dialog-v2.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppLoadingDialogV2Component } from '../../../shared/components-v2/app-loading-dialog-v2/app-loading-dialog-v2.component';
import { ImportExportDataService } from '../data/import-export.data.service';
import { FormHelperService } from './form-helper.service';
import { RequestFilterGenerator, RequestFilterOperator, RequestQueryBuilder, RequestSortDirection } from '../../helperClasses/request-query-builder';
import * as _ from 'lodash';
import { catchError } from 'rxjs/operators';
import * as FileSaver from 'file-saver';
import * as moment from 'moment';
import { Moment } from 'moment';
import { Constants, ExportStatusStep } from '../../models/constants';
import { ExportLogDataService } from '../data/export-log.data.service';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { AppBottomDialogV2Component } from '../../../shared/components-v2/app-bottom-dialog-v2/app-bottom-dialog-v2.component';
import { IV2BottomDialogConfig, IV2BottomDialogConfigButtonType, IV2BottomDialogConfigData, IV2BottomDialogHandler, IV2BottomDialogResponse } from '../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { ToastV2Service } from './toast-v2.service';
import { SavedFilterData, SavedFilterDataAppliedFilter, SavedFilterDataAppliedSort, SavedFilterModel } from '../../models/saved-filters.model';
import { ILabelValuePairModel } from '../../../shared/forms-v2/core/label-value-pair.model';
import {
  IV2AdvancedFilterAddress,
  IV2AdvancedFilterAddressPhoneNumber,
  IV2AdvancedFilterQuestionnaireAnswers,
  V2AdvancedFilter,
  V2AdvancedFilterComparatorType,
  V2AdvancedFilterQuestionWhichAnswer,
  V2AdvancedFilterType
} from '../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { UserModel } from '../../models/user.model';
import { SavedFiltersService } from '../data/saved-filters.data.service';
import { TranslateService } from '@ngx-translate/core';
import { AnswerModel, QuestionModel } from '../../models/question.model';
import { AddressModel } from '../../models/address.model';
import { IV2DateRange } from '../../../shared/forms-v2/components/app-form-date-range-v2/models/date.model';
import { AuthDataService } from '../data/auth.data.service';
import { BaseModel } from '../../models/base.model';
import { IResolverV2ResponseModel } from '../resolvers/data/models/resolver-response.model';
import { AppFormSelectGroupsV2Component } from '../../../shared/forms-v2/components/app-form-select-groups-v2/app-form-select-groups-v2.component';

@Injectable()
export class DialogV2Service {
  // export dialog width
  private static readonly EXPORT_DIALOG_WIDTH: string = '50rem';
  private static readonly STANDARD_ADVANCED_FILTER_DIALOG_WIDTH: string = '40rem';

  // used to show and update side dialog
  private _sideDialogSubject$: Subject<IV2SideDialog> = new Subject<IV2SideDialog>();

  // global loading
  private _globalLoading: IV2LoadingDialogHandler;
  private _globalLoadingInProgress: {
    [key: string]: true
  } = {};

  /**
   * Side dialog subject handler
   */
  get sideDialogSubject$(): Subject<IV2SideDialog> {
    return this._sideDialogSubject$;
  }

  /**
   * Constructor
   */
  constructor(
    private matDialog: MatDialog,
    private formHelperService: FormHelperService,
    private importExportDataService: ImportExportDataService,
    private exportLogDataService: ExportLogDataService,
    private matBottomSheet: MatBottomSheet,
    private toastV2Service: ToastV2Service,
    private savedFiltersService: SavedFiltersService,
    private translateService: TranslateService,
    private authDataService: AuthDataService
  ) {}

  /**
   * Show loading dialog
   */
  showLoadingDialog(): IV2LoadingDialogHandler {
    // create loading dialog handler
    const handler: IV2LoadingDialogHandler = {
      data: {
        message: undefined
      },
      close: () => {
        dialog.close();
      },
      message: (data) => {
        // update message
        handler.data.message = data.message;
        handler.data.messageData = data.messageData;

        // update ui
        dialog.componentInstance.detectChanges();
      }
    };

    // display dialog
    const dialog: MatDialogRef<AppLoadingDialogV2Component> = this.matDialog.open(
      AppLoadingDialogV2Component, {
        restoreFocus: false,
        autoFocus: false,
        delayFocusTrap: false,
        closeOnNavigation: false,
        disableClose: true,
        hasBackdrop: true,
        panelClass: 'gd-app-loading-dialog-panel',
        backdropClass: 'gd-app-loading-dialog-backdrop',
        width: '35rem',
        data: handler.data
      }
    );

    // show dialog
    dialog.afterClosed();

    // finished creating dialog
    return handler;
  }

  /**
   * Show global loading dialog
   */
  showGlobalLoadingDialog(key: string): void {
    // make sure loading is on for this key
    this._globalLoadingInProgress[key] = true;

    // already loading ?
    if (this._globalLoading) {
      return;
    }

    // show loading
    this._globalLoading = this.showLoadingDialog();
  }

  /**
   * hide global loading dialog
   * @param key
   */
  hideGlobalLoadingDialog(key: string): void {
    // hide loading is on for this key
    delete this._globalLoadingInProgress[key];

    // finished ?
    if (
      this._globalLoading &&
      Object.keys(this._globalLoadingInProgress).length < 1
    ) {
      this._globalLoading.close();
      this._globalLoading = undefined;
    }
  }

  /**
   * Show side dialog
   */
  showSideDialog(config: IV2SideDialogConfig): Observable<IV2SideDialogResponse> {
    return new Observable<IV2SideDialogResponse>((observer) => {
      this._sideDialogSubject$.next({
        action: V2SideDialogConfigAction.OPEN,
        config,
        responseSubscriber: (response) => {
          observer.next(response);
          observer.complete();
        }
      });
    });
  }

  /**
   * Show export data
   */
  showExportData(config: IV2ExportDataConfig): void {
    // construct list of inputs specific to export dialog
    const inputs: V2SideDialogConfigInput[] = [];

    // extra fields - prepend ?
    if (config.export.inputs?.prepend) {
      inputs.push(...config.export.inputs.prepend);
    }

    // attach export allowed file types
    inputs.push({
      type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
      placeholder: 'LNG_COMMON_LABEL_EXPORT_TYPE',
      name: 'fileType',
      value: config.export.allow.types.length === 1 ?
        config.export.allow.types[0] :
        undefined,
      validators: {
        required: () => true
      },
      options: config.export.allow.types.map((type) => ({
        label: type,
        value: type
      })),
      disabled: (data): boolean => {
        return (data.map.fileType as IV2SideDialogConfigInputSingleDropdown).options.length === 1;
      },
      change: (data): void => {
        // not JSON ?
        if ((data.map.fileType as IV2SideDialogConfigInputSingleDropdown).value !== ExportDataExtension.JSON) {
          const checkbox = (data.map.jsonReplaceUndefinedWithNull as IV2SideDialogConfigInputCheckbox);
          if (checkbox) {
            checkbox.checked = false;
          }
        }
      }
    });

    // attach encrypt
    if (config.export.allow.encrypt) {
      inputs.push({
        type: V2SideDialogConfigInputType.TEXT,
        placeholder: 'LNG_COMMON_LABEL_EXPORT_ENCRYPT_PASSWORD',
        name: 'encryptPassword',
        value: undefined
      });
    }

    // attach anonymize
    if (
      config.export.allow.anonymize &&
      config.export.allow.anonymize.fields
    ) {
      inputs.push({
        type: V2SideDialogConfigInputType.DROPDOWN_MULTI,
        placeholder: 'LNG_COMMON_LABEL_EXPORT_ANONYMIZE_FIELDS',
        name: config.export.allow.anonymize.key ?
          config.export.allow.anonymize.key :
          'anonymizeFields',
        values: [],
        options: config.export.allow.anonymize.fields
      });
    }

    // add divider for groups and fields
    if (
      config.export.allow.groups ||
      config.export.allow.fields
    ) {
      inputs.push({
        type: V2SideDialogConfigInputType.DIVIDER
      });
    }

    // groups
    if (config.export.allow.groups) {
      // all
      inputs.push(
        {
          type: V2SideDialogConfigInputType.CHECKBOX,
          placeholder: 'LNG_COMMON_LABEL_EXPORT_FIELDS_GROUPS_ALL',
          name: 'fieldsGroupAll',
          checked: true,
          change: (data): void => {
            // all fields groups checked ?
            if ((data.map.fieldsGroupAll as IV2SideDialogConfigInputCheckbox).checked) {
              // clear specific groups
              (data.map.fieldsGroupList as IV2SideDialogConfigInputMultiDropdown).values = [];

              // check all fields and clear specific fields
              if (data.map.fieldsAll) {
                (data.map.fieldsAll as IV2SideDialogConfigInputCheckbox).checked = true;
                (data.map.fieldsList as IV2SideDialogConfigInputMultiDropdown).values = [];
              }
            } else {
              // clear specific fields
              if (data.map.fieldsAll) {
                (data.map.fieldsAll as IV2SideDialogConfigInputCheckbox).checked = false;
                (data.map.fieldsList as IV2SideDialogConfigInputMultiDropdown).values = [];
              }
            }
          }
        }
      );

      // specific groups
      inputs.push(
        {
          type: V2SideDialogConfigInputType.DROPDOWN_MULTI,
          placeholder: 'LNG_COMMON_LABEL_EXPORT_FIELDS_GROUPS',
          name: 'fieldsGroupList',
          values: [],
          options: config.export.allow.groups.fields,
          disabled: (data): boolean => {
            return (data.map.fieldsGroupAll as IV2SideDialogConfigInputCheckbox).checked;
          },
          validators: {
            required: (data): boolean => {
              return !(data.map.fieldsGroupAll as IV2SideDialogConfigInputCheckbox).checked;
            }
          },
          change: (data): void => {
            // nothing to do ?
            if (
              !config.export.allow.groups ||
              !config.export.allow.groups.required
            ) {
              // finished
              return;
            }

            // do a map of selected values
            const selected: {
              [value: string]: true
            } = {};
            const selectedValues = (data.map.fieldsGroupList as IV2SideDialogConfigInputMultiDropdown).values;
            selectedValues.forEach((value) => {
              selected[value] = true;
            });

            // must auto-select required options ?
            const required = config.export.allow.groups.required;
            selectedValues.forEach((value) => {
              // nothing required for this option ?
              if (
                !required[value] ||
                required[value].length < 1
              ) {
                // finished
                return;
              }

              // options required - check if they are already selected, if not, select them
              required[value].forEach((requiredOption) => {
                // already selected ?
                if (selected[requiredOption]) {
                  return;
                }

                // not selected - select option
                selected[requiredOption] = true;
                selectedValues.push(requiredOption);
              });
            });
          }
        }
      );
    }

    // specific fields
    if (config.export.allow.fields) {
      // all
      inputs.push(
        {
          type: V2SideDialogConfigInputType.CHECKBOX,
          placeholder: 'LNG_COMMON_LABEL_EXPORT_FIELDS_ALL',
          name: 'fieldsAll',
          checked: true,
          disabled: (data): boolean => {
            return !data.map.fieldsGroupAll ?
              false :
              !(data.map.fieldsGroupAll as IV2SideDialogConfigInputCheckbox).checked;
          },
          change: (data): void => {
            // all fields ?
            if ((data.map.fieldsAll as IV2SideDialogConfigInputCheckbox).checked) {
              (data.map.fieldsList as IV2SideDialogConfigInputMultiDropdown).values = [];
            }
          }
        }
      );

      // specific fields
      inputs.push(
        {
          type: V2SideDialogConfigInputType.DROPDOWN_MULTI,
          placeholder: 'LNG_COMMON_LABEL_EXPORT_FIELDS',
          name: 'fieldsList',
          values: [],
          options: config.export.allow.fields,
          disabled: (data): boolean => {
            return (data.map.fieldsAll as IV2SideDialogConfigInputCheckbox).checked || (
              data.map.fieldsGroupAll &&
              !(data.map.fieldsGroupAll as IV2SideDialogConfigInputCheckbox).checked
            );
          },
          validators: {
            required: (data): boolean => {
              return !(data.map.fieldsAll as IV2SideDialogConfigInputCheckbox).checked && (
                !data.map.fieldsGroupAll ||
                (data.map.fieldsGroupAll as IV2SideDialogConfigInputCheckbox).checked
              );
            }
          }
        }
      );
    }

    // add divider for groups and fields
    if (
      config.export.allow.groups ||
      config.export.allow.fields
    ) {
      inputs.push({
        type: V2SideDialogConfigInputType.DIVIDER
      });
    }

    // add options title
    if (
      config.export.allow.dbColumns ||
      config.export.allow.dbValues ||
      config.export.allow.jsonReplaceUndefinedWithNull ||
      config.export.allow.questionnaireVariables
    ) {
      inputs.push(
        {
          type: V2SideDialogConfigInputType.DIVIDER,
          placeholder: 'LNG_COMMON_LABEL_EXPORT_OPTIONS'
        }
      );
    }

    // use db field names as column headers
    if (config.export.allow.dbColumns) {
      inputs.push({
        type: V2SideDialogConfigInputType.CHECKBOX,
        placeholder: 'LNG_COMMON_LABEL_EXPORT_USE_DB_COLUMNS',
        tooltip: 'LNG_COMMON_LABEL_EXPORT_USE_DB_COLUMNS_DESCRIPTION',
        name: 'useDbColumns',
        checked: false,
        change: (data): void => {
          // not JSON ?
          if (!(data.map.useDbColumns as IV2SideDialogConfigInputCheckbox).checked) {
            (data.map.dontTranslateValues as IV2SideDialogConfigInputCheckbox).checked = false;
          } else {
            const checkbox = (data.map.useQuestionVariable as IV2SideDialogConfigInputCheckbox);
            if (checkbox) {
              checkbox.checked = false;
            }
          }
        }
      });

      // use db values instead of formatting them like translating tokens etc...
      if (config.export.allow.dbValues) {
        inputs.push({
          type: V2SideDialogConfigInputType.CHECKBOX,
          placeholder: 'LNG_COMMON_LABEL_EXPORT_USE_DB_COLUMNS_NO_TRANSLATED_VALUES',
          tooltip: 'LNG_COMMON_LABEL_EXPORT_USE_DB_COLUMNS_NO_TRANSLATED_VALUES_DESCRIPTION',
          name: 'dontTranslateValues',
          checked: false,
          disabled: (data): boolean => {
            return !(data.map.useDbColumns as IV2SideDialogConfigInputCheckbox).checked;
          }
        });
      }
    }

    // when json type is selected allow user to replace undefined values with null, so he gets all data
    if (config.export.allow.jsonReplaceUndefinedWithNull) {
      inputs.push({
        type: V2SideDialogConfigInputType.CHECKBOX,
        placeholder: 'LNG_COMMON_LABEL_EXPORT_JSON_REPLACE_UNDEFINED_WITH_NULL',
        tooltip: 'LNG_COMMON_LABEL_EXPORT_JSON_REPLACE_UNDEFINED_WITH_NULL_DESCRIPTION',
        name: 'jsonReplaceUndefinedWithNull',
        checked: false,
        disabled: (data): boolean => {
          return (data.map.fileType as IV2SideDialogConfigInputSingleDropdown).value !== ExportDataExtension.JSON;
        }
      });
    }

    // use question variables instead of translating them
    if (config.export.allow.questionnaireVariables) {
      inputs.push({
        type: V2SideDialogConfigInputType.CHECKBOX,
        placeholder: 'LNG_COMMON_LABEL_EXPORT_USE_QUESTION_VARIABLE',
        tooltip: 'LNG_COMMON_LABEL_EXPORT_USE_QUESTION_VARIABLE_DESCRIPTION',
        name: 'useQuestionVariable',
        checked: false,
        disabled: (data): boolean => {
          return (data.map.useDbColumns as IV2SideDialogConfigInputCheckbox).checked;
        }
      });
    }

    // extra fields - append ?
    if (config.export.inputs?.append) {
      inputs.push(...config.export.inputs.append);
    }

    // display dialog
    this._sideDialogSubject$
      .next({
        action: V2SideDialogConfigAction.OPEN,
        config: {
          title: config.title,
          width: DialogV2Service.EXPORT_DIALOG_WIDTH,
          initialized: config.initialized,
          inputs: inputs,
          bottomButtons: [{
            type: IV2SideDialogConfigButtonType.OTHER,
            label: 'LNG_COMMON_LABEL_EXPORT',
            color: 'primary',
            key: ExportButtonKey.EXPORT,
            disabled: (_data, handler): boolean => {
              return !handler.form || handler.form.invalid;
            }
          }, {
            type: IV2SideDialogConfigButtonType.CANCEL,
            label: 'LNG_COMMON_BUTTON_CANCEL',
            color: 'text'
          }]
        },
        responseSubscriber: (response) => {
          // cancelled ?
          if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
            // finished
            return;
          }

          // format data that is sent to export
          const formData = this.formHelperService.getFields(response.handler.form);
          let extension: string = (response.data.map.fileType as IV2SideDialogConfigInputSingleDropdown).value;

          // for qr we need to replace it with png
          extension = extension === ExportDataExtension.QR ?
            'png' :
            extension;

          // do not send the checkbox all value to api
          delete formData.fieldsGroupAll;
          delete formData.fieldsAll;

          // clean form data
          Object.keys(formData).forEach((name) => {
            // must remove ?
            if (
              formData[name] === undefined || (
                formData[name] && (
                  (
                    Array.isArray(formData[name]) &&
                    formData[name].length < 1
                  ) || (
                    typeof formData[name] === 'object' &&
                    Object.keys(formData[name]).length < 1
                  )
                )
              )
            ) {
              delete formData[name];
            }
          });

          // append extra data ?
          if (config.export.extraFormData?.append) {
            Object.keys(config.export.extraFormData?.append).forEach((oKey) => {
              _.set(
                formData,
                oKey,
                config.export.extraFormData?.append[oKey]
              );
            });
          }

          // construct query builder
          const qb: RequestQueryBuilder = new RequestQueryBuilder();
          if (
            config.export.queryBuilder &&
            !config.export.queryBuilder.isEmpty()
          ) {
            _.each([
              'childrenQueryBuilders',
              'includedRelations',
              'filter',
              'sort',
              'deleted'
            ], (property: string) => {
              qb[property] = _.cloneDeep(config.export.queryBuilder[property]);
            });
          }

          // show loading dialog
          response.handler.loading.show();

          // start export
          (
            config.export.method === ExportDataMethod.POST ?
              this.importExportDataService
                .exportPOSTData(
                  config.export.url,
                  formData,
                  qb,
                  config.export.async ?
                    'json' :
                    'blob'
                ) :
              this.importExportDataService
                .exportData(
                  config.export.url,
                  formData,
                  qb,
                  config.export.async ?
                    'json' :
                    'blob'
                )
          )
            .pipe(
              catchError((err) => {
                // show error
                this.toastV2Service.error('LNG_COMMON_LABEL_EXPORT_ERROR');

                // close dialog
                response.handler.hide();

                // send error down the road
                return throwError(err);
              })
            )
            .subscribe((blobOrJson) => {
              // if not async then we should have file data, send it to browser download
              if (!config.export.async) {
                // save file
                FileSaver.saveAs(
                  blobOrJson as Blob,
                  `${config.export.fileName}.${extension}`
                );

                // close dialog
                response.handler.hide();

                // finished
                return;
              }

              // handle progress
              const progress = (data: IV2ExportDataConfigProgressAnswer) => {
                // display progress accordingly to status steps
                switch (data.step) {
                  case ExportStatusStep.LNG_STATUS_STEP_RETRIEVING_LANGUAGE_TOKENS:
                    // change message
                    response.handler.loading.message('LNG_PAGE_EXPORT_DATA_EXPORT_RETRIEVING_LANGUAGE_TOKENS');

                    // finished
                    break;

                  case ExportStatusStep.LNG_STATUS_STEP_PREPARING_PREFILTERS:
                    // change message
                    response.handler.loading.message('LNG_PAGE_EXPORT_DATA_EXPORT_PREPARING_PREFILTERS');

                    // finished
                    break;

                  case ExportStatusStep.LNG_STATUS_STEP_PREPARING_RECORDS:
                    // change message
                    response.handler.loading.message('LNG_PAGE_EXPORT_DATA_EXPORT_PREPARING');

                    // finished
                    break;

                  case ExportStatusStep.LNG_STATUS_STEP_PREPARING_LOCATIONS:
                    // change message
                    response.handler.loading.message('LNG_PAGE_EXPORT_DATA_EXPORT_PREPARING_LOCATIONS');

                    // finished
                    break;

                  case ExportStatusStep.LNG_STATUS_STEP_CONFIGURE_HEADERS:
                    // change message
                    response.handler.loading.message('LNG_PAGE_EXPORT_DATA_EXPORT_CONFIGURE_HEADERS');

                    // finished
                    break;

                  case ExportStatusStep.LNG_STATUS_STEP_EXPORTING_RECORDS:
                    // change message
                    response.handler.loading.message(
                      'LNG_PAGE_EXPORT_DATA_EXPORT_PROCESSED', {
                        processed: data.processed.toLocaleString('en'),
                        total: data.total.toLocaleString('en'),
                        estimatedEnd: data.estimatedEndDate ?
                          data.estimatedEndDate.format(Constants.DEFAULT_DATE_TIME_DISPLAY_FORMAT) :
                          '—'
                      }
                    );

                    // finished
                    break;

                  case ExportStatusStep.LNG_STATUS_STEP_ENCRYPT:
                    // change message
                    response.handler.loading.message('LNG_PAGE_EXPORT_DATA_EXPORT_ENCRYPTING');

                    // finished
                    break;

                  case ExportStatusStep.LNG_STATUS_STEP_ARCHIVE:
                    // change message
                    response.handler.loading.message('LNG_PAGE_EXPORT_DATA_EXPORT_ARCHIVING');

                    // finished
                    break;

                  case ExportStatusStep.LNG_STATUS_STEP_EXPORT_FINISHED:
                    if (
                      data.downloadedBytes === undefined ||
                      data.totalBytes === undefined
                    ) {
                      // change message
                      response.handler.loading.message('LNG_PAGE_EXPORT_DATA_EXPORT_FINISHING');
                    } else {
                      // change message
                      response.handler.loading.message(
                        'LNG_PAGE_EXPORT_DATA_EXPORT_DOWNLOADING', {
                          downloaded: data.downloadedBytes ?
                            data.downloadedBytes :
                            '',
                          total: data.totalBytes ?
                            data.totalBytes :
                            ''
                        }
                      );
                    }

                    // finished
                    break;
                }
              };

              // handler to check status periodically
              let startTime: Moment;
              let processedErrorForCorrectTime: number = 0;
              const checkStatusPeriodically = () => {
                this.exportLogDataService
                  .getExportLog((blobOrJson as { exportLogId: string }).exportLogId)
                  .pipe(
                    catchError((err) => {
                      // show error
                      this.toastV2Service.error('LNG_COMMON_LABEL_EXPORT_ERROR');

                      // close dialog
                      response.handler.hide();

                      // send error down the road
                      return throwError(err);
                    })
                  )
                  .subscribe((exportLogModel) => {
                    // determine end estimated date
                    let estimatedEndDate: Moment;
                    if (exportLogModel.processedNo > 0) {
                      // initialize start time if necessary
                      if (!startTime) {
                        startTime = moment();
                        processedErrorForCorrectTime = exportLogModel.processedNo;
                      }

                      // determine estimated time
                      const processed: number = exportLogModel.processedNo - processedErrorForCorrectTime;
                      const total: number = exportLogModel.totalNo - processedErrorForCorrectTime;
                      if (processed > 0) {
                        const processedSoFarTimeMs: number = moment().diff(startTime);
                        const requiredTimeForAllMs: number = processedSoFarTimeMs * total / processed;
                        const remainingTimeMs = requiredTimeForAllMs - processedSoFarTimeMs;
                        estimatedEndDate = moment().add(remainingTimeMs, 'ms');
                      }
                    }

                    // update progress
                    progress({
                      step: exportLogModel.statusStep,
                      processed: exportLogModel.processedNo,
                      total: exportLogModel.totalNo,
                      estimatedEndDate
                    });

                    // check if we still need to wait for data to be processed
                    if (exportLogModel.status === Constants.SYSTEM_SYNC_LOG_STATUS.IN_PROGRESS.value) {
                      // wait
                      setTimeout(() => {
                        checkStatusPeriodically();
                      }, 3000);

                      // finished
                      return;
                    }


                    // finished everything with success ?
                    if (exportLogModel.status === Constants.SYSTEM_SYNC_LOG_STATUS.SUCCESS.value) {
                      this.exportLogDataService
                        .download(
                          exportLogModel.id,
                          (
                            bytesLoaded: string
                          ) => {
                            // update progress message
                            progress({
                              step: exportLogModel.statusStep,
                              processed: exportLogModel.processedNo,
                              total: exportLogModel.totalNo,
                              downloadedBytes: bytesLoaded,
                              totalBytes: exportLogModel.sizeBytesHumanReadable
                            });
                          }
                        )
                        .pipe(
                          catchError((err) => {
                            // show error
                            this.toastV2Service.error('LNG_COMMON_LABEL_EXPORT_ERROR');

                            // close dialog
                            response.handler.hide();

                            // send error down the road
                            return throwError(err);
                          })
                        )
                        .subscribe((dataBlob) => {
                          // update progress message
                          progress({
                            step: exportLogModel.statusStep,
                            processed: exportLogModel.processedNo,
                            total: exportLogModel.totalNo
                          });

                          // save file
                          FileSaver.saveAs(
                            dataBlob,
                            `${config.export.fileName}.${exportLogModel.extension}`
                          );

                          // close dialog
                          response.handler.hide();
                        });
                    }

                    // process errors
                    if (exportLogModel.status === Constants.SYSTEM_SYNC_LOG_STATUS.FAILED.value) {
                      // show error
                      this.toastV2Service.error('LNG_COMMON_LABEL_EXPORT_ERROR');

                      // close dialog
                      response.handler.hide();
                    }
                  });
              };

              // update status periodically
              checkStatusPeriodically();
            });
        }
      });
  }

  /**
   * Show export data
   */
  showExportDataAfterLoadingData(config: IV2ExportDataConfigLoaderConfig): void {
    this.showSideDialog({
      title: config.title,
      width: DialogV2Service.EXPORT_DIALOG_WIDTH,
      inputs: [],
      bottomButtons: [],
      initialized: (handler) => {
        // show loading
        handler.loading.show();

        // wait for data to be loaded
        config.load((exportConfig) => {
          // hide previous dialog
          handler.hide();

          // show export
          this.showExportData(exportConfig);
        });
      }
    }).subscribe();
  }

  /**
   * Generate dialog without showing it
   */
  showBottomDialogBare(config: IV2BottomDialogConfig): MatBottomSheetRef<AppBottomDialogV2Component> {
    return this.matBottomSheet
      .open(
        AppBottomDialogV2Component, {
          data: config,
          hasBackdrop: true,
          panelClass: 'gd-app-bottom-dialog-panel',
          backdropClass: 'gd-app-bottom-dialog-backdrop',
          disableClose: true,
          closeOnNavigation: false
        }
      );
  }

  /**
   * Show bottom dialog
   */
  showBottomDialog(config: IV2BottomDialogConfig): Observable<IV2BottomDialogResponse> {
    return this.showBottomDialogBare(config).afterDismissed();
  }

  /**
   * Confirm dialog
   */
  showConfirmDialog(data: {
    // required
    config: IV2BottomDialogConfigData,

    // optional
    initialized?: (handler: IV2BottomDialogHandler) => void,
    yesLabel?: string,
    cancelLabel?: string
  }): Observable<IV2BottomDialogResponse> {
    return this.showBottomDialog({
      config: data.config,
      initialized: data.initialized,
      bottomButtons: [{
        type: IV2BottomDialogConfigButtonType.OTHER,
        label: data.yesLabel ?
          data.yesLabel :
          'LNG_DIALOG_CONFIRM_BUTTON_YES',
        key: 'yes',
        color: 'warn'
      }, {
        type: IV2BottomDialogConfigButtonType.CANCEL,
        label: data.cancelLabel ?
          data.cancelLabel :
          'LNG_DIALOG_CONFIRM_BUTTON_CANCEL',
        color: 'text'
      }]
    });
  }

  /**
   * Load saved filters
   */
  private loadSavedFilters(
    handler: IV2SideDialogHandler,
    filtersList: IV2SideDialogConfigInputFilterList,
    advancedFiltersApplied: SavedFilterData
  ): void {
    // operator
    filtersList.operatorValue = advancedFiltersApplied.appliedFilterOperator as RequestFilterOperator;

    // reset filters list
    filtersList.filters = [];
    filtersList.sorts = [];

    // add filters
    (advancedFiltersApplied.appliedFilters || []).forEach((appliedFilter) => {
      // add filter
      const advancedFilter = handler.update.addAdvancedFilter(filtersList);

      // set filter by value
      advancedFilter.filterBy.value = appliedFilter.filter.uniqueKey;

      // trigger filter by change
      advancedFilter.filterBy.change(
        handler.data,
        handler,
        advancedFilter as any
      );

      // set comparator value
      advancedFilter.comparator.value = appliedFilter.comparator;

      // trigger comparator change
      advancedFilter.comparator.change(
        handler.data,
        handler,
        advancedFilter as any
      );

      // filter value
      advancedFilter.value = appliedFilter.value;

      // if questionnaire then we need further process
      // - or within address...
      if (
        filtersList.optionsAsLabelValueMap[advancedFilter.filterBy.value]?.data.type === V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS || (
          filtersList.optionsAsLabelValueMap[advancedFilter.filterBy.value]?.data.type === V2AdvancedFilterType.ADDRESS &&
          advancedFilter.comparator.value === V2AdvancedFilterComparatorType.WITHIN
        )
      ) {
        // add extra values
        if (filtersList.optionsAsLabelValueMap[advancedFilter.filterBy.value]?.data.type === V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS) {
          handler.update.resetQuestionnaireFilter(advancedFilter);
        }

        // update extra values...values :)
        const valuesToPutBack = { ...appliedFilter.extraValues };
        Object.keys(advancedFilter.extraValues).forEach((prop) => {
          // nothing to do ?
          if (valuesToPutBack[prop] === undefined) {
            return;
          }

          // put back value
          if (prop === 'location') {
            advancedFilter.extraValues[prop] = valuesToPutBack[prop];
          } else {
            advancedFilter.extraValues[prop].value = valuesToPutBack[prop];
          }

          // finished
          // - remove so we know this one was handled
          delete valuesToPutBack[prop];
        });

        // attach remaining options
        Object.keys(valuesToPutBack).forEach((prop) => {
          // put back value
          if (prop === 'location') {
            advancedFilter.extraValues[prop] = valuesToPutBack[prop];
          } else {
            // SHOULDN'T have this case
            // advancedFilter.extraValues[prop].value = valuesToPutBack[prop];
          }
        });
      }
    });

    // add orders
    (advancedFiltersApplied.appliedSort || []).forEach((sortCriteria) => {
      // add sort
      const advancedSort = handler.update.addAdvancedSort(filtersList);

      // setup
      advancedSort.sortBy.value = sortCriteria.sort.uniqueKey;
      advancedSort.order.value = sortCriteria.direction;
    });
  }

  /**
   * Process template
   */
  private processTemplate(advancedFilter: IV2AdvancedFilterQuestionnaireAnswers): void {
    // get template questions
    const questions = advancedFilter.template() || [];

    // reset template options
    advancedFilter.templateOptions = [];
    advancedFilter.templateOptionsMap = {};

    // add question to list
    const addQuestion = (
      question: QuestionModel,
      prefixOrder: string,
      multiAnswerParent: boolean
    ) => {
      // add question to list
      const orderLabel: string = (
        prefixOrder ?
          (prefixOrder + '.') :
          ''
      ) + question.order;
      const label: string = `${orderLabel} ${this.translateService.instant(question.text)}`;

      // create option
      const options = {
        label,
        value: question.variable,
        data: {
          question,
          label,
          multiAnswerParent: multiAnswerParent
        }
      };

      // add to list of questions
      advancedFilter.templateOptions.push(options);

      // map question for easy access
      advancedFilter.templateOptionsMap[question.variable] = options;

      // add recursive sub-questions
      if (
        question.answers &&
        question.answers.length > 0
      ) {
        question.answers.forEach((answer: AnswerModel) => {
          if (
            answer.additionalQuestions &&
            answer.additionalQuestions.length > 0
          ) {
            answer.additionalQuestions
              // ignore some types of questions
              .filter((adQuestion) => adQuestion.answerType !== Constants.ANSWER_TYPES.MARKUP.value)
              .forEach((childQuestion: QuestionModel, index: number) => {
                childQuestion.order = index + 1;
                addQuestion(
                  childQuestion,
                  orderLabel,
                  multiAnswerParent
                );
              });
          }
        });
      }
    };

    // determine list of questions to display
    questions
      // ignore some types of questions
      .filter((adQuestion) => adQuestion.answerType !== Constants.ANSWER_TYPES.MARKUP.value)
      .forEach((question: QuestionModel, index: number) => {
        question.order = index + 1;
        addQuestion(
          question,
          '',
          question.multiAnswer
        );
      });
  }

  /**
   * Generate query builder from advanced filters
   */
  private generateQueryBuilderFromAdvancedFilters(
    filterOptions: ILabelValuePairModel[],
    appliedFilters: IV2SideDialogConfigInputFilterListFilter[],
    appliedSorts: IV2SideDialogConfigInputFilterListSort[],
    operator: RequestFilterOperator,
    optionsAsLabelValueMap: {
      [optionId: string]: ILabelValuePairModel
    }
  ): IV2SideDialogAdvancedFiltersResponse {
    // create a new Request Query Builder
    const queryBuilder = new RequestQueryBuilder();

    // set operator
    queryBuilder.filter.setOperator(operator);

    // map filter definition options
    const filterOptionsMap: {
      [value: string]: V2AdvancedFilter
    } = {};
    filterOptions.forEach((filterOption) => {
      filterOptionsMap[filterOption.value] = filterOption.data;
    });

    // init saved filter
    const advancedFiltersApplied: SavedFilterData = new SavedFilterData({});
    advancedFiltersApplied.appliedFilterOperator = operator;

    // set conditions
    appliedFilters.forEach((appliedFilter) => {
      // retrieve filter definition
      const filterDefinition: V2AdvancedFilter = filterOptionsMap[appliedFilter.filterBy.value];

      // add to saved filters
      advancedFiltersApplied.appliedFilters.push(new SavedFilterDataAppliedFilter({
        filter: {
          uniqueKey: `${filterDefinition.field}${filterDefinition.label}`
        },
        comparator: appliedFilter.comparator.value,
        value: appliedFilter.value,
        extraValues: _.isEmpty(appliedFilter.extraValues) ?
          undefined :
          _.transform(
            appliedFilter.extraValues,
            (acc, value, prop) => {
              // there are cases where we need to save the entire object
              // e.g. - extraValues.location
              acc[prop] = value.name ?
                value.value :
                value;
            },
            {}
          )
      }));

      // do we need to go into a relationship ?
      let qb: RequestQueryBuilder = queryBuilder;
      if (
        filterDefinition.relationshipPath &&
        filterDefinition.relationshipPath.length > 0
      ) {
        _.each(filterDefinition.relationshipPath, (relation) => {
          qb = qb.include(relation).queryBuilder;
        });
      }

      // children query builders
      if (filterDefinition.childQueryBuilderKey) {
        qb = qb.addChildQueryBuilder(
          filterDefinition.childQueryBuilderKey,
          false
        );
      }

      // relationship query builders
      if (filterDefinition.relationshipKey) {
        qb = qb.include(filterDefinition.relationshipKey).queryBuilder;
      }

      // do we need to merge extra conditions ?
      if (filterDefinition.extraConditions) {
        qb.merge(_.cloneDeep(filterDefinition.extraConditions));
      }

      // check if we need to flag value
      if (filterDefinition.flagIt) {
        // value ?
        let value;
        switch (filterDefinition.type) {
          case V2AdvancedFilterType.NUMBER:
            value = appliedFilter.value && appliedFilter.value !== 0 && typeof appliedFilter.value === 'string' ? parseFloat(appliedFilter.value) : appliedFilter.value;
            break;

          default:
            value = appliedFilter.value;
        }

        // add flag
        if (value !== undefined) {
          qb.filter.flag(
            filterDefinition.field,
            value
          );
        }
      } else if (filterDefinition.filterBy) {
        // custom filter
        filterDefinition.filterBy(
          qb,
          appliedFilter
        );
      } else {
        // filter
        let searchQb: RequestQueryBuilder;
        switch (filterDefinition.type) {
          case V2AdvancedFilterType.TEXT:
            switch (appliedFilter.comparator.value) {
              case V2AdvancedFilterComparatorType.IS:
                // filter
                qb.filter.byEquality(
                  filterDefinition.field,
                  appliedFilter.value,
                  false,
                  true
                );

                // finished
                break;

              case V2AdvancedFilterComparatorType.CONTAINS_TEXT:
                // filter
                qb.filter.byContainingText(
                  filterDefinition.field,
                  appliedFilter.value,
                  false
                );

                // finished
                break;

              case V2AdvancedFilterComparatorType.HAS_VALUE:
                // filter
                qb.filter.byHasValue(filterDefinition.field);

                // finished
                break;

              case V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE:
                // filter
                qb.filter.byNotHavingValue(
                  filterDefinition.field,
                  !!filterDefinition.havingNotHavingApplyMongo
                );

                // finished
                break;

              // V2AdvancedFilterComparatorType.TEXT_STARTS_WITH
              default:
                qb.filter.byText(
                  filterDefinition.field,
                  appliedFilter.value,
                  false,
                  filterDefinition.useLike
                );
            }

            // finished
            break;

          case V2AdvancedFilterType.NUMBER:
            switch (appliedFilter.comparator.value) {
              case V2AdvancedFilterComparatorType.BEFORE:
                // filter
                qb.filter.where({
                  [filterDefinition.field]: {
                    lte: _.isString(appliedFilter.value) ? parseFloat(appliedFilter.value) : appliedFilter.value
                  }
                });

                // finished
                break;

              case V2AdvancedFilterComparatorType.AFTER:
                // filter
                qb.filter.where({
                  [filterDefinition.field]: {
                    gte: _.isString(appliedFilter.value) ? parseFloat(appliedFilter.value) : appliedFilter.value
                  }
                });

                // finished
                break;

              // case FilterComparator.IS:
              default:
                qb.filter.byEquality(
                  filterDefinition.field,
                  _.isString(appliedFilter.value) ? parseFloat(appliedFilter.value) : appliedFilter.value
                );
            }

            // finished
            break;

          case V2AdvancedFilterType.ADDRESS:
          case V2AdvancedFilterType.LOCATION_SINGLE:
          case V2AdvancedFilterType.LOCATION_MULTIPLE:
            // contains / within
            switch (appliedFilter.comparator.value) {
              case V2AdvancedFilterComparatorType.LOCATION:
                qb.filter.where({
                  [`${filterDefinition.field}.parentLocationIdFilter`]: {
                    inq: appliedFilter.value
                  }
                });
                break;

              case V2AdvancedFilterComparatorType.WITHIN:
                // retrieve location lat & lng
                const geoLocation = _.get(appliedFilter.extraValues, 'location.geoLocation', null);
                const lat: number = geoLocation && (geoLocation.lat || geoLocation.lat === 0) ? parseFloat(geoLocation.lat) : null;
                const lng: number = geoLocation && (geoLocation.lng || geoLocation.lng === 0) ? parseFloat(geoLocation.lng) : null;
                if (
                  lat === null ||
                  lng === null
                ) {
                  break;
                }

                // construct near query
                const nearQuery = {
                  near: {
                    lat: lat,
                    lng: lng
                  }
                };

                // add max distance if provided
                const maxDistance: number = _.get(appliedFilter.extraValues, 'radius.value', null);
                if (maxDistance !== null) {
                  // convert miles to meters
                  (nearQuery as any).maxDistance = Math.round(maxDistance * 1609.34);
                }

                // add filter
                qb.filter.where({
                  [`${filterDefinition.field}.geoLocation`]: nearQuery
                });
                break;

              // V2AdvancedFilterComparatorType.CONTAINS
              default:
                // construct address search qb
                searchQb = AddressModel.buildSearchFilter(
                  appliedFilter.value,
                  filterDefinition.field,
                  (filterDefinition as IV2AdvancedFilterAddress).isArray
                );

                // add condition if we were able to create it
                if (searchQb) {
                  qb.merge(searchQb);
                }
            }

            // finished
            break;

          // filter by address phone number
          case V2AdvancedFilterType.ADDRESS_PHONE_NUMBER:
            // construct address phone number search qb
            searchQb = AddressModel.buildPhoneSearchFilter(
              appliedFilter.value,
              filterDefinition.field,
              (filterDefinition as IV2AdvancedFilterAddressPhoneNumber).isArray
            );

            // add condition if we were able to create it
            if (searchQb) {
              qb.merge(searchQb);
            }

            // finished
            break;

          // filter by phone number
          case V2AdvancedFilterType.PHONE_NUMBER:
            // construct phone number search qb
            qb.filter.byPhoneNumber(
              filterDefinition.field,
              appliedFilter.value,
              true,
              'regex'
            );

            // finished
            break;

          case V2AdvancedFilterType.RANGE_NUMBER:
            switch (appliedFilter.comparator.value) {
              case V2AdvancedFilterComparatorType.HAS_VALUE:
                // filter
                qb.filter.byHasValue(filterDefinition.field);

                // finished
                break;

              case V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE:
                // filter
                qb.filter.byNotHavingValue(
                  filterDefinition.field,
                  !!filterDefinition.havingNotHavingApplyMongo
                );

                // finished
                break;

              // others...
              default:
                // between / from / to
                qb.filter.byRange(
                  filterDefinition.field,
                  appliedFilter.value,
                  false
                );
            }

            // finished
            break;

          case V2AdvancedFilterType.RANGE_AGE:
            // between / from / to
            qb.filter.byAgeRange(
              filterDefinition.field,
              appliedFilter.value,
              false
            );

            // finished
            break;

          case V2AdvancedFilterType.RANGE_DATE:
            switch (appliedFilter.comparator.value) {
              case V2AdvancedFilterComparatorType.HAS_VALUE:
                // filter
                qb.filter.byHasValue(filterDefinition.field);

                // finished
                break;

              case V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE:
                // filter
                qb.filter.byNotHavingValue(
                  filterDefinition.field,
                  !!filterDefinition.havingNotHavingApplyMongo
                );

                // finished
                break;

              // others...
              default:
                // between / before / after
                qb.filter.byDateRange(
                  filterDefinition.field,
                  appliedFilter.value,
                  false
                );
            }

            // finished
            break;

          case V2AdvancedFilterType.DATE:
            // between
            const date = appliedFilter.value ?
              null :
              moment(appliedFilter.value);

            // filter
            qb.filter.byDateRange(
              filterDefinition.field,
              date && date.isValid() ?
                {
                  startDate: date.startOf('day'),
                  endDate: date.endOf('day')
                } :
                null,
              false
            );

            // finished
            break;

          case V2AdvancedFilterType.SELECT:
          case V2AdvancedFilterType.MULTISELECT:
            switch (appliedFilter.comparator.value) {
              case V2AdvancedFilterComparatorType.HAS_VALUE:
                // filter
                qb.filter.byHasValue(filterDefinition.field);

                // finished
                break;

              case V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE:
                // filter
                qb.filter.byNotHavingValue(
                  filterDefinition.field,
                  !!filterDefinition.havingNotHavingApplyMongo
                );

                // finished
                break;

              // FilterComparator.NONE
              default:
                qb.filter.bySelect(
                  filterDefinition.field,
                  appliedFilter.value,
                  false,
                  null
                );
            }

            // finished
            break;

          case V2AdvancedFilterType.SELECT_GROUPS:
            // filter
            // FilterComparator.NONE
            qb.filter.bySelect(
              filterDefinition.field,
              AppFormSelectGroupsV2Component.processValuesForFilter(
                appliedFilter.value,
                filterDefinition.defaultValues,
                filterDefinition.groupOptionValueKey
              ),
              false,
              null
            );

            // finished
            break;

          case V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS:
            // get data
            const question: QuestionModel = optionsAsLabelValueMap[appliedFilter.filterBy.value]?.data.templateOptionsMap[appliedFilter.value]?.data.question;
            const whichAnswer: V2AdvancedFilterQuestionWhichAnswer = appliedFilter.extraValues?.whichAnswer?.value;
            const extraComparator: V2AdvancedFilterComparatorType = appliedFilter.extraValues?.comparator?.value;
            const value: any = appliedFilter.extraValues?.filterValue?.value;
            const whichAnswerDate: IV2DateRange = appliedFilter.extraValues?.whichAnswerDate?.value;

            // we don't need to add filter if no filter value was provided
            if (
              question && (
                !_.isEmpty(value) ||
                _.isBoolean(value) ||
                !_.isEmpty(whichAnswerDate) ||
                extraComparator === V2AdvancedFilterComparatorType.HAS_VALUE ||
                extraComparator === V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE
              )
            ) {
              // construct answer date query
              let dateQuery;
              let valueQuery;
              if (!_.isEmpty(whichAnswerDate)) {
                dateQuery = RequestFilterGenerator.dateRangeCompare(whichAnswerDate);
              }

              // take action accordingly to question type
              if (
                !_.isEmpty(value) ||
                _.isBoolean(value) ||
                extraComparator === V2AdvancedFilterComparatorType.HAS_VALUE ||
                extraComparator === V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE
              ) {
                switch (question.answerType) {
                  // Text
                  case Constants.ANSWER_TYPES.FREE_TEXT.value:
                    switch (extraComparator) {
                      case V2AdvancedFilterComparatorType.IS:
                        valueQuery = RequestFilterGenerator.textIs(value);
                        break;
                      case V2AdvancedFilterComparatorType.CONTAINS_TEXT:
                        valueQuery = RequestFilterGenerator.textContains(
                          value,
                          filterDefinition.useLike
                        );
                        break;
                      case V2AdvancedFilterComparatorType.HAS_VALUE:
                        valueQuery = RequestFilterGenerator.hasValue();
                        break;
                      case V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE:
                        // doesn't have value if handled bellow
                        // NOTHING TO DO
                        break;

                      // V2AdvancedFilterComparatorType.TEXT_STARTS_WITH
                      default:
                        valueQuery = RequestFilterGenerator.textStartWith(
                          value,
                          filterDefinition.useLike
                        );
                    }

                    // finished
                    break;

                  // Date
                  case Constants.ANSWER_TYPES.DATE_TIME.value:
                    switch (extraComparator) {
                      case V2AdvancedFilterComparatorType.HAS_VALUE:
                        valueQuery = RequestFilterGenerator.hasValue();
                        break;
                      case V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE:
                        // doesn't have value if handled bellow
                        // NOTHING TO DO
                        break;

                      // V2AdvancedFilterComparatorType.TEXT_STARTS_WITH
                      default:
                        valueQuery = RequestFilterGenerator.dateRangeCompare(value);
                    }

                    // finished
                    break;

                  // Dropdown
                  case Constants.ANSWER_TYPES.SINGLE_SELECTION.value:
                  case Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value:
                    switch (extraComparator) {
                      case V2AdvancedFilterComparatorType.HAS_VALUE:
                        valueQuery = RequestFilterGenerator.hasValue();
                        break;
                      case V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE:
                        // doesn't have value if handled bellow
                        // NOTHING TO DO
                        break;

                      // V2AdvancedFilterComparatorType.TEXT_STARTS_WITH
                      default:
                        valueQuery = {
                          inq: value
                        };
                    }

                    // finished
                    break;

                  // Number
                  case Constants.ANSWER_TYPES.NUMERIC.value:
                    switch (extraComparator) {
                      case V2AdvancedFilterComparatorType.HAS_VALUE:
                        valueQuery = RequestFilterGenerator.hasValue();
                        break;
                      case V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE:
                        // doesn't have value if handled bellow
                        // NOTHING TO DO
                        break;

                      // V2AdvancedFilterComparatorType.TEXT_STARTS_WITH
                      default:
                        valueQuery = RequestFilterGenerator.rangeCompare(value);
                    }

                    // finished
                    break;

                  // File
                  case Constants.ANSWER_TYPES.FILE_UPLOAD.value:
                    // neq: null / $eq null doesn't work due to a mongodb bug ( the issue occurs when trying to filter an element from an array which is this case )
                    switch (extraComparator) {
                      case V2AdvancedFilterComparatorType.HAS_VALUE:
                        valueQuery = RequestFilterGenerator.hasValue();
                        break;
                      case V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE:
                        // doesn't have value if handled bellow
                        // NOTHING TO DO
                        break;
                    }

                    // finished
                    break;
                }
              }

              // search through all answers or just the last one ?
              const query: any = {};
              if (
                !whichAnswer ||
                whichAnswer === V2AdvancedFilterQuestionWhichAnswer.LAST_ANSWER
              ) {
                // do we need to attach a value condition as well ?
                if (valueQuery) {
                  query[`${filterDefinition.field}.${question.variable}.0.value`] = valueQuery;
                } else if (extraComparator === V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE) {
                  // handle no value case
                  const condition: any = RequestFilterGenerator.doesntHaveValue(`${filterDefinition.field}.${question.variable}.0.value`);
                  const key: string = Object.keys(condition)[0];
                  query[key] = condition[key];
                }

                // do we need to attach a date condition as well ?
                if (dateQuery) {
                  query[`${filterDefinition.field}.${question.variable}.0.date`] = dateQuery;
                }

                // register query
                qb.filter.where(query);
              } else {
                // do we need to attach a value condition as well ?
                if (valueQuery) {
                  query.value = valueQuery;
                } else if (extraComparator === V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE) {
                  // handle no value case
                  const condition: any = RequestFilterGenerator.doesntHaveValue(
                    'value',
                    true
                  );
                  const key: string = Object.keys(condition)[0];
                  query[key] = condition[key];
                }

                // do we need to attach a date condition as well ?
                if (dateQuery) {
                  query.date = dateQuery;
                }

                // add extra check if date not provided and we need to retrieve all records that don't have a value
                if (
                  !dateQuery &&
                  extraComparator === V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE
                ) {
                  qb.filter.where({
                    or: [
                      {
                        [`${filterDefinition.field}.${question.variable}`]: {
                          $elemMatch: query
                        }
                      }, {
                        [`${filterDefinition.field}.${question.variable}`]: {
                          exists: false
                        }
                      }, {
                        [`${filterDefinition.field}.${question.variable}`]: {
                          type: 'null'
                        }
                      }, {
                        [`${filterDefinition.field}.${question.variable}`]: {
                          size: 0
                        }
                      }
                    ]
                  });
                } else {
                  qb.filter.where({
                    [`${filterDefinition.field}.${question.variable}`]: {
                      $elemMatch: query
                    }
                  });
                }
              }
            }

            // finished
            break;
        }
      }
    });

    // set sorts
    const objectDetailsSort: {
      [property: string]: string[]
    } = {
      age: ['years', 'months']
    };
    appliedSorts.forEach((appliedSort) => {
      // retrieve field
      // retrieve filter definition
      const filterDefinition: V2AdvancedFilter = filterOptionsMap[appliedSort.sortBy.value];

      // no field - shouldn't encounter this case...
      if (!filterDefinition.field) {
        return;
      }

      // add to saved filters
      advancedFiltersApplied.appliedSort.push(new SavedFilterDataAppliedSort({
        sort: {
          uniqueKey: `${filterDefinition.field}${filterDefinition.label}`
        },
        direction: appliedSort.order.value
      }));

      // add sorting criteria
      const sortField: string = typeof filterDefinition.sortable === 'string' ?
        filterDefinition.sortable :
        filterDefinition.field;
      if (
        objectDetailsSort &&
        objectDetailsSort[appliedSort.sortBy.value]
      ) {
        objectDetailsSort[appliedSort.sortBy.value].forEach((childProperty) => {
          queryBuilder.sort.by(
            `${sortField}.${childProperty}`,
            appliedSort.order.value as RequestSortDirection
          );
        });
      } else {
        queryBuilder.sort.by(
          sortField,
          appliedSort.order.value as RequestSortDirection
        );
      }
    });

    // set filter query builder
    return {
      filtersApplied: advancedFiltersApplied,
      queryBuilder
    };
  }

  /**
   * Show advanced filters dialog
   */
  showAdvancedFiltersDialog(
    advancedFilterType: string,
    advancedFilters: V2AdvancedFilter[],
    advancedFiltersApplied: SavedFilterData,
    config?: {
      operatorHide?: boolean,
      disableAdd?: boolean,
      disableReset?: boolean,
      disableDelete?: boolean
    }
  ): Observable<IV2SideDialogAdvancedFiltersResponse | null> {
    return new Observable<IV2SideDialogAdvancedFiltersResponse | null>((observer) => {
      // display filters dialog
      this.showSideDialog({
        title: {
          get: () => 'LNG_SIDE_FILTERS_TITLE'
        },
        dontCloseOnBackdrop: true,
        hideInputFilter: true,
        width: DialogV2Service.STANDARD_ADVANCED_FILTER_DIALOG_WIDTH,
        inputs: [
          {
            type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
            placeholder: 'LNG_SIDE_FILTERS_LOAD_FILTER_LABEL',
            name: 'savedFilterList',
            value: undefined,
            options: [],
            clearable: true,
            change: (_data, handler, item: IV2SideDialogConfigInputSingleDropdown) => {
              // get data
              const savedData = item.options.find((option) => option.value === item.value)?.data as SavedFilterModel;
              if (savedData) {
                // load saved filters
                this.loadSavedFilters(
                  handler,
                  handler.data.map.filters as IV2SideDialogConfigInputFilterList,
                  savedData.filterData
                );
              }
            }
          }, {
            type: V2SideDialogConfigInputType.FILTER_LIST,
            name: 'filters',
            options: [],
            filters: [],
            sorts: [],
            operatorValue: RequestFilterOperator.AND,
            operatorHide: config?.operatorHide,
            disableAdd: config?.disableAdd,
            disableReset: config?.disableReset,
            disableDelete: config?.disableDelete
          }
        ],
        bottomButtons: [{
          type: IV2SideDialogConfigButtonType.OTHER,
          label: 'LNG_SIDE_FILTERS_APPLY_FILTERS_BUTTON',
          color: 'primary',
          key: 'apply',
          disabled: (_data, handler): boolean => {
            return !handler.form || handler.form.invalid;
          }
        }, {
          type: IV2SideDialogConfigButtonType.OTHER,
          label: 'LNG_SIDE_FILTERS_SAVE_FILTER_BUTTON',
          color: 'secondary',
          key: 'save',
          disabled: (_data, handler): boolean => {
            const input = handler.data.map.filters as IV2SideDialogConfigInputFilterList;
            return (input.filters.length < 1 && input.sorts.length < 1) || !handler.form || handler.form.invalid;
          }
        }, {
          type: IV2SideDialogConfigButtonType.CANCEL,
          label: 'LNG_COMMON_BUTTON_CANCEL',
          color: 'text'
        }],
        initialized: (handler) => {
          // display loading
          handler.loading.show();

          // construct query for saved filter
          const qb = new RequestQueryBuilder();

          // no need to retrieve all fields
          qb.fields(
            'id',
            'name',
            'readOnly',
            'filterData',
            'userId',
            'createdBy',
            'updatedAt'
          );

          // retrieve created user & modified user information
          qb.include('createdByUser', true);

          // retrieve items specific to our page
          qb.filter.where({
            filterKey: {
              eq: advancedFilterType
            }
          });

          // retrieve saved filters
          this.savedFiltersService
            .getSavedFiltersList(qb)
            .subscribe((savedFilters) => {
              // configure saved filters dropdown
              const savedFilterList = handler.data.map.savedFilterList as IV2SideDialogConfigInputSingleDropdown;

              // set saved filters options and other things
              savedFilterList.options = [];
              savedFilters.forEach((item) => {
                // option
                const option: ILabelValuePairModel = {
                  label: item.name,
                  value: item.id,
                  data: item
                };
                savedFilterList.options.push(option);

                // infos
                option.infos = [];

                // set info icons - readonly
                if (item.readOnly) {
                  option.infos.push({
                    label: this.translateService.instant(
                      'LNG_SIDE_FILTERS_LOAD_FILTER_READONLY_LABEL', {
                        name: item.createdByUser?.name ?
                          item.createdByUser?.name :
                          ''
                      }
                    ),
                    icon: 'edit_off'
                  });
                }

                // updated at
                if (item.updatedAt) {
                  option.infos.push({
                    label: this.translateService.instant(
                      'LNG_SIDE_FILTERS_LOAD_FILTER_UPDATED_AT_LABEL', {
                        datetime: moment(item.updatedAt).format(Constants.DEFAULT_DATE_TIME_DISPLAY_FORMAT)
                      }
                    ),
                    icon: 'history'
                  });
                }
              });

              // do we need to retrieve other data ?
              const filtersList = (handler.data.map.filters as IV2SideDialogConfigInputFilterList);
              filtersList.options = [];
              const dataToRetrieve: {
                filter: V2AdvancedFilter
              }[] = [];
              advancedFilters.forEach((advancedFilter) => {
                // do we need to map questionnaire template to select options ?
                if (advancedFilter.type === V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS) {
                  this.processTemplate(advancedFilter);
                }

                // do we need to load data ?
                if (!advancedFilter.optionsLoad) {
                  // put the exact one in the list
                  (handler.data.map.filters as IV2SideDialogConfigInputFilterList).options.push(advancedFilter);

                  // finished
                  return;
                }

                // add to list of data to retrieve
                dataToRetrieve.push({
                  filter: advancedFilter
                });
              });

              // retrieve data - synchronously
              const nextItem = () => {
                // finished ?
                if (dataToRetrieve.length < 1) {
                  // reload inputs data
                  handler.update.refresh();

                  // put back advanced filters
                  if (
                    advancedFiltersApplied && (
                      advancedFiltersApplied.appliedFilters.length > 0 ||
                      advancedFiltersApplied.appliedSort.length > 0
                    )
                  ) {
                    // load saved filters
                    this.loadSavedFilters(
                      handler,
                      filtersList,
                      advancedFiltersApplied
                    );
                  }

                  // hide loading
                  handler.loading.hide();

                  // finished
                  return;
                }

                // get data
                const itemToRetrieve = dataToRetrieve.splice(0, 1)[0];
                itemToRetrieve.filter.optionsLoad((data) => {
                  // clone item
                  const newFilter: V2AdvancedFilter = _.cloneDeep(itemToRetrieve.filter);
                  newFilter.options = data ?
                    data.options :
                    [];

                  // put the exact one in the list
                  (handler.data.map.filters as IV2SideDialogConfigInputFilterList).options.push(newFilter);

                  // next one
                  nextItem();
                });
              };

              // start
              nextItem();
            });
        }
      }).subscribe((response) => {
        // cancelled ?
        if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
          // send response
          observer.next(null);
          observer.complete();

          // finished
          return;
        }

        // reset ?
        if (response.button.key === 'reset') {
          observer.next({
            queryBuilder: undefined,
            filtersApplied: undefined
          });
          observer.complete();

          // hide dialog
          response.handler.hide();

          // finished
          return;
        }

        // generate query builder from advanced filters
        const input: IV2SideDialogConfigInputFilterList = response.data.map.filters as IV2SideDialogConfigInputFilterList;
        const processedAdvancedFilters = this.generateQueryBuilderFromAdvancedFilters(
          input.optionsAsLabelValue,
          input.filters,
          input.sorts,
          input.operatorValue,
          input.optionsAsLabelValueMap
        );

        // emit the Request Query Builder
        observer.next(processedAdvancedFilters);
        observer.complete();

        // finished
        response.handler.hide();

        // after apply - save ?
        if (response.button.key === 'save') {
          // create
          const createFilter = () => {
            this.showSideDialog({
              title: {
                get: () => 'LNG_DIALOG_SAVE_FILTERS_TITLE'
              },
              dontCloseOnBackdrop: true,
              hideInputFilter: true,
              width: DialogV2Service.STANDARD_ADVANCED_FILTER_DIALOG_WIDTH,
              inputs: [
                {
                  type: V2SideDialogConfigInputType.TEXT,
                  name: 'filterName',
                  placeholder: 'LNG_SAVED_FILTERS_FIELD_LABEL_NAME',
                  validators: {
                    required: () => true
                  },
                  value: ''
                }, {
                  type: V2SideDialogConfigInputType.CHECKBOX,
                  name: 'isPublic',
                  placeholder: 'LNG_SAVED_FILTERS_FIELD_LABEL_PUBLIC',
                  checked: false
                }
              ],
              bottomButtons: [
                {
                  type: IV2SideDialogConfigButtonType.OTHER,
                  label: 'LNG_SIDE_FILTERS_SAVE_FILTER_BUTTON',
                  color: 'primary',
                  key: 'save',
                  disabled: (_data, handler): boolean => {
                    return !handler.form || handler.form.invalid;
                  }
                }, {
                  type: IV2SideDialogConfigButtonType.CANCEL,
                  label: 'LNG_COMMON_BUTTON_CANCEL',
                  color: 'text'
                }
              ]
            }).subscribe((createResponse) => {
              // cancelled ?
              if (createResponse.button.type === IV2SideDialogConfigButtonType.CANCEL) {
                return;
              }

              // show loading
              createResponse.handler.loading.show();

              // save
              this.savedFiltersService
                .createFilter(
                  new SavedFilterModel({
                    name: (createResponse.data.map.filterName as IV2SideDialogConfigInputText).value,
                    isPublic: !!(createResponse.data.map.isPublic as IV2SideDialogConfigInputCheckbox).checked,
                    filterKey: advancedFilterType,
                    filterData: processedAdvancedFilters.filtersApplied
                  })
                )
                .pipe(
                  catchError((err) => {
                    this.toastV2Service.error(err);
                    return throwError(err);
                  })
                )
                .subscribe(() => {
                  // display message
                  this.toastV2Service.success('LNG_SIDE_FILTERS_SAVE_FILTER_SUCCESS_MESSAGE');

                  // finished
                  createResponse.handler.hide();
                });
            });
          };

          // update or create ?
          const savedFilterList: IV2SideDialogConfigInputSingleDropdown = response.data.map.savedFilterList as IV2SideDialogConfigInputSingleDropdown;
          const authUser: UserModel = this.authDataService.getAuthenticatedUser();
          if (
            savedFilterList.value &&
            SavedFilterModel.canModify(authUser)
          ) {
            // find option
            const loadedData: SavedFilterModel = savedFilterList.options.find((item) => item.value === savedFilterList.value)?.data;
            if (!loadedData.readOnly) {
              // ask if we should update existing or create a new one
              this.showBottomDialog({
                config: {
                  title: {
                    get: () => 'LNG_DIALOG_SAVE_FILTERS_UPDATE_OR_CREATE_DIALOG_TITLE'
                  },
                  message: {
                    get: () => 'LNG_DIALOG_SAVE_FILTERS_UPDATE_OR_CREATE_TITLE',
                    data: () => ({
                      filter: loadedData.name
                    })
                  }
                },
                dontCloseOnBackdrop: true,
                bottomButtons: [
                  {
                    type: IV2BottomDialogConfigButtonType.OTHER,
                    label: 'LNG_COMMON_BUTTON_UPDATE',
                    key: 'update',
                    color: 'primary'
                  }, {
                    type: IV2BottomDialogConfigButtonType.OTHER,
                    label: 'LNG_COMMON_BUTTON_CREATE',
                    key: 'create',
                    color: 'primary'
                  }, {
                    type: IV2BottomDialogConfigButtonType.CANCEL,
                    label: 'LNG_DIALOG_CONFIRM_BUTTON_CANCEL',
                    color: 'text'
                  }
                ]
              }).subscribe((bottomResponse) => {
                // cancel ?
                if (bottomResponse.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                  // finished
                  return;
                }

                // update / create
                if (bottomResponse.button.key === 'create') {
                  // create filter
                  createFilter();
                } else if (bottomResponse.button.key === 'update') {
                  // show loading
                  const loading = this.showLoadingDialog();

                  // update
                  this.savedFiltersService
                    .modifyFilter(
                      savedFilterList.value, {
                        filterData: processedAdvancedFilters.filtersApplied
                      }
                    )
                    .pipe(
                      catchError((err) => {
                        this.toastV2Service.error(err);
                        return throwError(err);
                      })
                    )
                    .subscribe(() => {
                      // display message
                      this.toastV2Service.success('LNG_SIDE_FILTERS_MODIFY_FILTER_SUCCESS_MESSAGE');

                      // finished
                      loading.close();
                    });
                }
              });
            } else {
              // create filter
              createFilter();
            }
          } else {
            // create filter
            createFilter();
          }
        }
      });
    });
  }

  /**
   * Show record details dialog
   */
  showRecordDetailsDialog(
    title: string,
    record: BaseModel,
    users: IResolverV2ResponseModel<UserModel>,
    suffixInputs?: V2SideDialogConfigInput[]
  ): void {
    // construct list of details
    const detailsInputs: V2SideDialogConfigInput[] = [];

    // created by
    let createdByName: string = '—';
    if (
      record.createdBy &&
      users.map[record.createdBy]
    ) {
      createdByName = users.map[record.createdBy].name;
    }
    detailsInputs.push({
      type: V2SideDialogConfigInputType.KEY_VALUE,
      name: 'createdBy',
      placeholder: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY',
      value: createdByName
    });

    // created at
    let createdAt: string = '—';
    if (record.createdAt) {
      createdAt = moment(record.createdAt).format(Constants.DEFAULT_DATE_TIME_DISPLAY_FORMAT);
    }
    detailsInputs.push({
      type: V2SideDialogConfigInputType.KEY_VALUE,
      name: 'createdAt',
      placeholder: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT',
      value: createdAt
    });

    // updated by
    let updatedByName: string = '—';
    if (
      record.updatedBy &&
      users.map[record.updatedBy]
    ) {
      updatedByName = users.map[record.updatedBy].name;
    }
    detailsInputs.push({
      type: V2SideDialogConfigInputType.KEY_VALUE,
      name: 'updatedBy',
      placeholder: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY',
      value: updatedByName
    });

    // updated at
    let updatedAt: string = '—';
    if (record.updatedAt) {
      updatedAt = moment(record.updatedAt).format(Constants.DEFAULT_DATE_TIME_DISPLAY_FORMAT);
    }
    detailsInputs.push({
      type: V2SideDialogConfigInputType.KEY_VALUE,
      name: 'updatedAt',
      placeholder: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT',
      value: updatedAt
    });

    // push extra suffix
    if (suffixInputs?.length > 0) {
      detailsInputs.push(...suffixInputs);
    }

    // display dialog
    this.showSideDialog({
      title: {
        get: () => title
      },
      width: '45rem',
      inputs: detailsInputs,
      bottomButtons: [{
        type: IV2SideDialogConfigButtonType.CANCEL,
        label: 'LNG_COMMON_BUTTON_CANCEL',
        color: 'text'
      }]
    }).subscribe();
  }
}
