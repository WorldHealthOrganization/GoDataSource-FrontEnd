import { Injectable } from '@angular/core';
import { Observable, Subscriber, throwError } from 'rxjs';
import { ReferenceDataDataService } from '../data/reference-data.data.service';
import { DialogV2Service } from './dialog-v2.service';
import {
  IV2SideDialogConfigButtonType,
  IV2SideDialogConfigInputText,
  V2SideDialogConfigInputType
} from '../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { FormHelperService } from './form-helper.service';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ToastV2Service } from './toast-v2.service';
import {
  ReferenceDataCategoryModel,
  ReferenceDataEntryModel
} from '../../models/reference-data.model';
import { ILabelValuePairModel } from '../../../shared/forms-v2/core/label-value-pair.model';
import { I18nService } from './i18n.service';
import {
  ITreeEditorDataCategory
} from '../../../shared/forms-v2/components/app-form-tree-editor-v2/models/tree-editor.model';
import { OutbreakModel } from '../../models/outbreak.model';
import { OutbreakTemplateModel } from '../../models/outbreak-template.model';
import { IGeneralAsyncValidatorResponse } from '../../../shared/forms-v2/validators/general-async-validator.directive';

@Injectable()
export class ReferenceDataHelperService {
  /**
   * Constructor
   */
  constructor(
    private referenceDataDataService: ReferenceDataDataService,
    private dialogV2Service: DialogV2Service,
    private formHelperService: FormHelperService,
    private toastV2Service: ToastV2Service,
    private i18nService: I18nService
  ) {}

  /**
   * Convert reference data categories to tree categories
   */
  convertRefCategoriesToTreeCategories(categories: ReferenceDataCategoryModel[]): ITreeEditorDataCategory[] {
    return categories.map((item) => {
      return {
        id: item.id,
        label: item.name,
        children: item.entries.map((entry) => {
          return {
            id: entry.id,
            label: entry.value,
            order: entry.order,
            disabled: !entry.active,
            colorCode: entry.colorCode,
            isSystemWide: !!entry.isSystemWide,
            iconUrl: entry.iconUrl
          };
        })
      };
    });
  }

  /**
   * Entity dialog
   */
  showNewItemDialog(
    options: {
      icon: ILabelValuePairModel[]
    },
    category: {
      id: string,
      label: string
    },
    finish: (
      item: ReferenceDataEntryModel,
      addAnother: boolean
    ) => void
  ): void  {
    // check code uniqueness
    let code: string;
    const codeObserver = new Observable((subscriber: Subscriber<boolean | IGeneralAsyncValidatorResponse>) => {
      // is there any point to validate ?
      if (!code) {
        subscriber.next(true);
        subscriber.complete();
        return;
      }

      // validate
      this.referenceDataDataService
        .checkCodeUniqueness(code)
        .subscribe((isValid: boolean | IGeneralAsyncValidatorResponse) => {
          subscriber.next(isValid);
          subscriber.complete();
        });
    });

    // show dialog
    this.dialogV2Service
      .showSideDialog({
        title: {
          get: () => 'LNG_REFERENCE_DATA_CATEGORY_LABEL_ADD_NEW_ITEM_UNDER',
          data: () => ({
            category: this.i18nService.instant(category.label)
          })
        },
        hideInputFilter: true,
        dontCloseOnBackdrop: true,
        width: '60rem',
        inputs: [{
          type: V2SideDialogConfigInputType.TEXT,
          name: 'value',
          placeholder: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_VALUE',
          tooltip: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_VALUE_DESCRIPTION',
          validators: {
            required: () => true
          },
          value: ''
        }, {
          type: V2SideDialogConfigInputType.TEXT,
          name: 'code',
          placeholder: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_CODE',
          tooltip: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_CODE_DESCRIPTION',
          value: undefined,
          validators: {
            async: (data) => {
              code = (data.map.code as IV2SideDialogConfigInputText).value;
              return codeObserver;
            }
          }
        }, {
          type: V2SideDialogConfigInputType.TOGGLE_CHECKBOX,
          name: 'active',
          placeholder: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ACTIVE',
          tooltip: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ACTIVE_DESCRIPTION',
          value: true
        }, {
          type: V2SideDialogConfigInputType.NUMBER,
          name: 'order',
          placeholder: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ORDER',
          tooltip: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ORDER_DESCRIPTION',
          value: undefined
        }, {
          type: V2SideDialogConfigInputType.COLOR,
          name: 'colorCode',
          placeholder: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_COLOR',
          tooltip: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_COLOR_DESCRIPTION',
          value: undefined
        }, {
          type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
          name: 'iconId',
          placeholder: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ICON',
          tooltip: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ICON_DESCRIPTION',
          options: options.icon,
          value: undefined
        }, {
          type: V2SideDialogConfigInputType.TOGGLE_CHECKBOX,
          name: 'isSystemWide',
          placeholder: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_IS_SYSTEM_WIDE',
          tooltip: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_IS_SYSTEM_WIDE_DESCRIPTION',
          value: false
        }, {
          type: V2SideDialogConfigInputType.TEXTAREA,
          name: 'description',
          placeholder: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_DESCRIPTION',
          value: undefined
        }],
        bottomButtons: [{
          type: IV2SideDialogConfigButtonType.OTHER,
          label: 'LNG_COMMON_BUTTON_ADD',
          color: 'primary',
          key: 'add',
          disabled: (_data, handler): boolean => {
            return !handler.form || handler.form.invalid || handler.form.pending;
          }
        }, {
          type: IV2SideDialogConfigButtonType.OTHER,
          label: 'LNG_COMMON_BUTTON_ADD_ANOTHER',
          color: 'primary',
          key: 'add-another',
          disabled: (_data, handler): boolean => {
            return !handler.form || handler.form.invalid || handler.form.pending;
          }
        }, {
          type: IV2SideDialogConfigButtonType.CANCEL,
          label: 'LNG_COMMON_BUTTON_CANCEL',
          color: 'text'
        }]
      })
      .subscribe((response) => {
        // cancelled ?
        if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
          // finished
          return;
        }

        // get form data
        const formData = this.formHelperService.getFields(response.handler.form);

        // show loading
        response.handler.loading.show();

        // set category ID for the new entry
        formData.categoryId = category.id;

        // create record
        this.referenceDataDataService
          .createEntry(formData)
          .pipe(
            switchMap((item) => {
              // re-load language tokens
              return this.i18nService.loadUserLanguage()
                .pipe(
                  catchError((err) => {
                    // hide
                    response.handler.hide();

                    // err
                    finish(
                      null,
                      false
                    );

                    // finished
                    return throwError(err);
                  }),
                  map(() => item)
                );
            }),

            // handle error
            catchError((err) => {
              // show error
              this.toastV2Service.error(err);

              // hide
              response.handler.hide();

              // err
              finish(
                null,
                false
              );

              // finished
              return throwError(err);
            })
          )
          .subscribe((item) => {
            // success
            this.toastV2Service.success('LNG_PAGE_CREATE_REFERENCE_DATA_ENTRY_ACTION_CREATE_ENTRY_SUCCESS_MESSAGE');

            // hide
            response.handler.hide();

            // finish
            finish(
              item,
              response.button.key === 'add-another'
            );
          });
      });
  }

  /**
   * Filter reference data based on outbreak configurations
   */
  filterPerOutbreak(
    outbreak: OutbreakModel,
    items: ReferenceDataEntryModel[]
  ): ReferenceDataEntryModel[] {
    return items.filter((item) =>
      item.isSystemWide ||
      !outbreak?.allowedRefDataItems ||
      !outbreak.allowedRefDataItems[item.categoryId] ||
      Object.keys(outbreak.allowedRefDataItems[item.categoryId]).length < 1 ||
      outbreak.allowedRefDataItems[item.categoryId][item.id]
    );
  }

  /**
   * Filter reference data options based on outbreak configurations
   */
  filterPerOutbreakOptions(
    outbreak: OutbreakModel | OutbreakTemplateModel,
    options: ILabelValuePairModel[],
    selectedValue: string | string[] | undefined
  ): ILabelValuePairModel[] {
    // if array we need to map it
    const selectedValueMap: {
      [id: string]: true
    } = {};
    if (selectedValue) {
      if (Array.isArray(selectedValue)) {
        selectedValue.forEach((id) => {
          // not used
          if (
            !id ||
            typeof id !== 'string'
          ) {
            return;
          }

          // map
          selectedValueMap[id] = true;
        });
      } else {
        selectedValueMap[selectedValue] = true;
      }
    }

    // filter
    const filteredOptions: ILabelValuePairModel[] = [];
    options.forEach((item) => {
      // determine if allowed
      const isAllowed: boolean = item.data.isSystemWide ||
        !outbreak?.allowedRefDataItems ||
        !outbreak.allowedRefDataItems[item.data.categoryId] ||
        Object.keys(outbreak.allowedRefDataItems[item.data.categoryId]).length < 1 ||
        outbreak.allowedRefDataItems[item.data.categoryId][item.value];

      // allowed ?
      if (isAllowed) {
        // add it
        filteredOptions.push(item);

        // finished
        return;
      }

      // not allowed ?
      if (!selectedValueMap[item.value]) {
        return;
      }

      // disable those that aren't associated with outbreak, but they are allowed
      const lvShallowClone: ILabelValuePairModel = {
        ...item,
        disabled: true
      };
      filteredOptions.push(lvShallowClone);
    });

    // finished
    return filteredOptions;
  }
}
