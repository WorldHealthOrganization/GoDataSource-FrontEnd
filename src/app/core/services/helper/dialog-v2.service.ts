import { Injectable } from '@angular/core';
import { Observable, Subject, Subscriber, throwError } from 'rxjs';
import {
  IV2SideDialog,
  IV2SideDialogConfig,
  IV2SideDialogConfigButtonType,
  IV2SideDialogConfigInputCheckbox,
  IV2SideDialogConfigInputMultiDropdown,
  IV2SideDialogConfigInputSingleDropdown,
  IV2SideDialogResponse,
  V2SideDialogConfigAction,
  V2SideDialogConfigInput,
  V2SideDialogConfigInputType
} from '../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { ExportDataExtension, ExportDataMethod, IV2ExportDataConfig, IV2ExportDataConfigProgressAnswer } from './models/dialog-v2.model';
import { IV2LoadingDialogHandler } from '../../../shared/components-v2/app-loading-dialog-v2/models/loading-dialog-v2.model';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AppLoadingDialogV2Component } from '../../../shared/components-v2/app-loading-dialog-v2/app-loading-dialog-v2.component';
import { ImportExportDataService } from '../data/import-export.data.service';
import { FormHelperService } from './form-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import * as _ from 'lodash';
import { catchError } from 'rxjs/operators';
import * as FileSaver from 'file-saver';
import * as moment from 'moment';
import { Moment } from 'moment';
import { Constants, ExportStatusStep } from '../../models/constants';
import { ExportLogDataService } from '../data/export-log.data.service';

@Injectable()
export class DialogV2Service {
  // used to show and update side dialog
  private _sideDialogSubject$: Subject<IV2SideDialog> = new Subject<IV2SideDialog>();

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
    private exportLogDataService: ExportLogDataService
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
        autoFocus: false,
        closeOnNavigation: false,
        disableClose: true,
        hasBackdrop: true,
        panelClass: 'gd-app-loading-dialog-panel',
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
   * Show side dialog
   */
  showSideDialog(config: IV2SideDialogConfig): Observable<IV2SideDialogResponse> {
    return new Observable<IV2SideDialogResponse>((observer) => {
      this._sideDialogSubject$.next({
        action: V2SideDialogConfigAction.OPEN,
        config,
        responseSubscriber: observer
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
      value: undefined,
      validators: {
        required: () => true
      },
      options: config.export.allow.types.map((type) => ({
        label: type,
        value: type
      })),
      change: (data): void => {
        // not JSON ?
        if ((data.map.fileType as IV2SideDialogConfigInputSingleDropdown).value !== ExportDataExtension.JSON) {
          (data.map.jsonReplaceUndefinedWithNull as IV2SideDialogConfigInputCheckbox).checked = false;
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
        name: 'anonymizeFields',
        values: [],
        options: config.export.allow.anonymize.fields
      });
    }

    // groups
    if (config.export.allow.groups) {
      // all
      inputs.push(
        {
          type: V2SideDialogConfigInputType.DIVIDER
        }, {
          type: V2SideDialogConfigInputType.CHECKBOX,
          placeholder: 'LNG_COMMON_LABEL_EXPORT_FIELDS_GROUPS_ALL',
          name: 'fieldsGroupAll',
          checked: true,
          change: (data): void => {
            // not JSON ?
            if ((data.map.fieldsGroupAll as IV2SideDialogConfigInputCheckbox).checked) {
              (data.map.fieldsGroupList as IV2SideDialogConfigInputMultiDropdown).values = [];
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
        }, {
          type: V2SideDialogConfigInputType.DIVIDER
        }
      );
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
            (data.map.useQuestionVariable as IV2SideDialogConfigInputCheckbox).checked = false;
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
          width: '50rem',
          inputs: inputs,
          bottomButtons: [{
            type: IV2SideDialogConfigButtonType.OTHER,
            label: 'LNG_COMMON_LABEL_EXPORT',
            color: 'primary',
            key: 'export',
            disabled: (_data, handler): boolean => {
              return handler.form.invalid;
            }
          }, {
            type: IV2SideDialogConfigButtonType.CANCEL,
            label: 'LNG_COMMON_BUTTON_CANCEL',
            color: 'text'
          }]
        },
        responseSubscriber: new Subscriber<IV2SideDialogResponse>((response) => {
          // cancelled ?
          if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
            // finished
            return;
          }

          // show loading dialog
          const loading = this.showLoadingDialog();

          // format data that is sent to export
          const formData = this.formHelperService.getFields(response.handler.form);
          const extension: string = (response.data.map.fileType as IV2SideDialogConfigInputSingleDropdown).value;

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
                // this.snackbarService.showError('LNG_COMMON_LABEL_EXPORT_ERROR');

                // close dialog
                loading.close();

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
                loading.close();

                // finished
                return;
              }

              // handle progress
              const progress = (data: IV2ExportDataConfigProgressAnswer) => {
                // display progress accordingly to status steps
                switch (data.step) {
                  case ExportStatusStep.LNG_STATUS_STEP_RETRIEVING_LANGUAGE_TOKENS:
                    // change message
                    loading.message({
                      message: 'LNG_PAGE_EXPORT_DATA_EXPORT_RETRIEVING_LANGUAGE_TOKENS'
                    });

                    // finished
                    break;

                  case ExportStatusStep.LNG_STATUS_STEP_PREPARING_PREFILTERS:
                    // change message
                    loading.message({
                      message: 'LNG_PAGE_EXPORT_DATA_EXPORT_PREPARING_PREFILTERS'
                    });

                    // finished
                    break;

                  case ExportStatusStep.LNG_STATUS_STEP_PREPARING_RECORDS:
                    // change message
                    loading.message({
                      message: 'LNG_PAGE_EXPORT_DATA_EXPORT_PREPARING'
                    });

                    // finished
                    break;

                  case ExportStatusStep.LNG_STATUS_STEP_PREPARING_LOCATIONS:
                    // change message
                    loading.message({
                      message: 'LNG_PAGE_EXPORT_DATA_EXPORT_PREPARING_LOCATIONS'
                    });

                    // finished
                    break;

                  case ExportStatusStep.LNG_STATUS_STEP_CONFIGURE_HEADERS:
                    // change message
                    loading.message({
                      message: 'LNG_PAGE_EXPORT_DATA_EXPORT_CONFIGURE_HEADERS'
                    });

                    // finished
                    break;

                  case ExportStatusStep.LNG_STATUS_STEP_EXPORTING_RECORDS:
                    // change message
                    loading.message({
                      message: 'LNG_PAGE_EXPORT_DATA_EXPORT_PROCESSED',
                      messageData: {
                        processed: data.processed.toLocaleString('en'),
                        total: data.total.toLocaleString('en'),
                        estimatedEnd: data.estimatedEndDate ?
                          data.estimatedEndDate.format(Constants.DEFAULT_DATE_TIME_DISPLAY_FORMAT) :
                          '-'
                      }
                    });

                    // finished
                    break;

                  case ExportStatusStep.LNG_STATUS_STEP_ENCRYPT:
                    // change message
                    loading.message({
                      message: 'LNG_PAGE_EXPORT_DATA_EXPORT_ENCRYPTING'
                    });

                    // finished
                    break;

                  case ExportStatusStep.LNG_STATUS_STEP_ARCHIVE:
                    // change message
                    loading.message({
                      message: 'LNG_PAGE_EXPORT_DATA_EXPORT_ARCHIVING'
                    });

                    // finished
                    break;

                  case ExportStatusStep.LNG_STATUS_STEP_EXPORT_FINISHED:
                    if (
                      data.downloadedBytes === undefined ||
                      data.totalBytes === undefined
                    ) {
                      // change message
                      loading.message({
                        message: 'LNG_PAGE_EXPORT_DATA_EXPORT_FINISHING'
                      });
                    } else {
                      // change message
                      loading.message({
                        message: 'LNG_PAGE_EXPORT_DATA_EXPORT_DOWNLOADING',
                        messageData: {
                          downloaded: data.downloadedBytes ?
                            data.downloadedBytes :
                            '',
                          total: data.totalBytes ?
                            data.totalBytes :
                            ''
                        }
                      });
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
                      // this.snackbarService.showError('LNG_COMMON_LABEL_EXPORT_ERROR');

                      // close dialog
                      loading.close();

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
                            // this.snackbarService.showError('LNG_COMMON_LABEL_EXPORT_ERROR');

                            // close dialog
                            loading.close();

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
                          loading.close();
                        });
                    }

                    // process errors
                    if (exportLogModel.status === Constants.SYSTEM_SYNC_LOG_STATUS.FAILED.value) {
                      // show error
                      // this.snackbarService.showError('LNG_COMMON_LABEL_EXPORT_ERROR');

                      // close dialog
                      loading.close();
                    }
                  });
              };

              // update status periodically
              checkStatusPeriodically();
            });
        })
      });
  }
}
