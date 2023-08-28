import { OutbreakModel } from '../../../models/outbreak.model';
import { PersonAndRelatedHelperService } from '../person-and-related-helper.service';
import { EventModel } from '../../../models/event.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { Observable } from 'rxjs';
import { TimerCache } from '../../../helperClasses/timer-cache';
import { EventDataService } from '../../data/event.data.service';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/xt-forms/validators/general-async-validator.directive';
import { UserModel } from '../../../models/user.model';
import { QuestionModel } from '../../../models/question.model';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { V2AdvancedFilterToVisibleMandatoryConf } from '../../../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';
import { IV2ColumnStatusFormType, V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { moment } from '../../../helperClasses/x-moment';

export class EventHelperModel {
  // data
  public readonly visibleMandatoryKey: string = 'events';

  /**
   * Constructor
   */
  constructor(
    private parent: PersonAndRelatedHelperService,
    public eventDataService: EventDataService
  ) {}

  /**
   * Generate tab - Details
   */
  generateTabsDetails(
    useToFilterOutbreak: OutbreakModel,
    data: {
      selectedOutbreak: OutbreakModel,
      isCreate: boolean,
      itemData: EventModel,
      eventVisualIDMask: {
        mask: string
      },
      options: {
        user: ILabelValuePairModel[],
        eventCategory: ILabelValuePairModel[],
        addressType: ILabelValuePairModel[]
      }
    }
  ): ICreateViewModifyV2Tab {
    // create tab
    const tab: ICreateViewModifyV2Tab = this.parent.createViewModify.tabFilter(
      {
        type: CreateViewModifyV2TabInputType.TAB,
        name: 'details',
        label: data.isCreate ?
          'LNG_PAGE_CREATE_EVENT_TAB_DETAILS_TITLE' :
          'LNG_PAGE_MODIFY_EVENT_TAB_DETAILS_TITLE',
        sections: [
          // Details
          {
            type: CreateViewModifyV2TabInputType.SECTION,
            label: data.isCreate ?
              'LNG_PAGE_CREATE_EVENT_TAB_DETAILS_TITLE' :
              'LNG_PAGE_MODIFY_EVENT_TAB_DETAILS_TITLE',
            inputs: [{
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'name',
              placeholder: () => 'LNG_EVENT_FIELD_LABEL_NAME',
              description: () => 'LNG_EVENT_FIELD_LABEL_NAME_DESCRIPTION',
              value: {
                get: () => data.itemData.name,
                set: (value) => {
                  data.itemData.name = value;
                }
              },
              validators: {
                required: () => true
              },
              visibleMandatoryConf: {
                visible: true,
                required: true
              }
            }, {
              type: CreateViewModifyV2TabInputType.DATE,
              name: 'date',
              placeholder: () => 'LNG_EVENT_FIELD_LABEL_DATE',
              description: () => 'LNG_EVENT_FIELD_LABEL_DATE_DESCRIPTION',
              value: {
                get: () => data.itemData.date,
                set: (value) => {
                  data.itemData.date = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.DATE,
              name: 'dateOfReporting',
              placeholder: () => 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING',
              description: () => 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING_DESCRIPTION',
              value: {
                get: () => data.itemData.dateOfReporting,
                set: (value) => {
                  data.itemData.dateOfReporting = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'isDateOfReportingApproximate',
              placeholder: () => 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
              description: () => 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE_DESCRIPTION',
              value: {
                get: () => data.itemData.isDateOfReportingApproximate,
                set: (value) => {
                  data.itemData.isDateOfReportingApproximate = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.ASYNC_VALIDATOR_TEXT,
              name: 'visualId',
              placeholder: () => 'LNG_EVENT_FIELD_LABEL_VISUAL_ID',
              description: () => this.parent.i18nService.instant(
                'LNG_EVENT_FIELD_LABEL_VISUAL_ID_DESCRIPTION',
                data.eventVisualIDMask
              ),
              value: {
                get: () => data.itemData.visualId,
                set: (value) => {
                  data.itemData.visualId = value;
                }
              },
              suffixIconButtons: [
                {
                  icon: 'refresh',
                  tooltip: 'LNG_PAGE_ACTION_REFRESH_VISUAL_ID_DESCRIPTION',
                  clickAction: (input) => {
                    // nothing to do ?
                    if (!data.eventVisualIDMask) {
                      return;
                    }

                    // generate
                    data.itemData.visualId = this.generateEventIDMask(data.selectedOutbreak.eventIdMask);

                    // mark as dirty
                    input.control?.markAsDirty();
                  }
                }
              ],
              validators: {
                async: new Observable((observer) => {
                  // construct cache key
                  const cacheKey: string = 'CEV_' + data.selectedOutbreak.id +
                    data.eventVisualIDMask.mask +
                    data.itemData.visualId +
                    (
                      data.isCreate ?
                        '' :
                        data.itemData.id
                    );

                  // get data from cache or execute validator
                  TimerCache.run(
                    cacheKey,
                    this.eventDataService.checkEventVisualIDValidity(
                      data.selectedOutbreak.id,
                      data.eventVisualIDMask.mask,
                      data.itemData.visualId,
                      data.isCreate ?
                        undefined :
                        data.itemData.id
                    )
                  ).subscribe((isValid: boolean | IGeneralAsyncValidatorResponse) => {
                    observer.next(isValid);
                    observer.complete();
                  });
                })
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'responsibleUserId',
              placeholder: () => 'LNG_EVENT_FIELD_LABEL_RESPONSIBLE_USER_ID',
              description: () => 'LNG_EVENT_FIELD_LABEL_RESPONSIBLE_USER_ID_DESCRIPTION',
              options: data.options.user,
              value: {
                get: () => data.itemData.responsibleUserId,
                set: (value) => {
                  data.itemData.responsibleUserId = value;
                }
              },
              replace: {
                condition: () => !UserModel.canListForFilters(this.parent.authUser),
                html: this.parent.i18nService.instant('LNG_PAGE_CREATE_EVENT_CANT_SET_RESPONSIBLE_ID_TITLE')
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'eventCategory',
              placeholder: () => 'LNG_EVENT_FIELD_LABEL_EVENT_CATEGORY',
              description: () => 'LNG_EVENT_FIELD_LABEL_EVENT_CATEGORY_DESCRIPTION',
              options: data.options.eventCategory,
              value: {
                get: () => data.itemData.eventCategory,
                set: (value) => {
                  data.itemData.eventCategory = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.DATE,
              name: 'endDate',
              placeholder: () => 'LNG_EVENT_FIELD_LABEL_END_DATE',
              description: () => 'LNG_EVENT_FIELD_LABEL_END_DATE_DESCRIPTION',
              value: {
                get: () => data.itemData.endDate,
                set: (value) => {
                  data.itemData.endDate = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXTAREA,
              name: 'description',
              placeholder: () => 'LNG_EVENT_FIELD_LABEL_DESCRIPTION',
              description: () => 'LNG_EVENT_FIELD_LABEL_DESCRIPTION_DESCRIPTION',
              value: {
                get: () => data.itemData.description,
                set: (value) => {
                  data.itemData.description = value;
                }
              }
            }]
          },
          {
            type: CreateViewModifyV2TabInputType.SECTION,
            label: 'LNG_EVENT_FIELD_LABEL_ADDRESS',
            inputs: [{
              type: CreateViewModifyV2TabInputType.ADDRESS,
              typeOptions: data.options.addressType,
              name: 'address',
              value: {
                get: () => data.itemData.address
              }
            }]
          }
        ]
      },
      this.visibleMandatoryKey,
      useToFilterOutbreak
    );

    // finished
    return tab;
  }

  /**
   * Advanced filters
   */
  generateAdvancedFilters(
    selectedOutbreak: OutbreakModel,
    data: {
      eventInvestigationTemplate: () => QuestionModel[],
      options: {
        user: ILabelValuePairModel[],
        eventCategory: ILabelValuePairModel[],
        addressType: ILabelValuePairModel[],
        yesNoAll: ILabelValuePairModel[],
        yesNo: ILabelValuePairModel[]
      }
    }
  ): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilterToVisibleMandatoryConf[] = [
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'name',
        label: 'LNG_EVENT_FIELD_LABEL_NAME',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'name'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'date',
        label: 'LNG_EVENT_FIELD_LABEL_DATE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'date'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'eventCategory',
        label: 'LNG_EVENT_FIELD_LABEL_EVENT_CATEGORY',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'eventCategory'
        ),
        options: data.options.eventCategory,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'description',
        label: 'LNG_EVENT_FIELD_LABEL_DESCRIPTION',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'description'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.ADDRESS,
        field: 'address',
        label: 'LNG_EVENT_FIELD_LABEL_ADDRESS',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address'
        ),
        isArray: false
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfReporting',
        label: 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'dateOfReporting'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'isDateOfReportingApproximate',
        label: 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'isDateOfReportingApproximate'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'endDate',
        label: 'LNG_EVENT_FIELD_LABEL_END_DATE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'endDate'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'visualId',
        label: 'LNG_EVENT_FIELD_LABEL_VISUAL_ID',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'visualId'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
        field: 'questionnaireAnswers',
        label: 'LNG_EVENT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
        visibleMandatoryIf: () => data.eventInvestigationTemplate && data.eventInvestigationTemplate()?.length > 0,
        template: data.eventInvestigationTemplate
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'numberOfContacts',
        label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_CONTACTS',
        visibleMandatoryIf: () => true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'numberOfExposures',
        label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
        visibleMandatoryIf: () => true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'address.typeId',
        label: 'LNG_EVENT_FIELD_LABEL_ADDRESS_TYPE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address'
        ),
        options: data.options.addressType,
        sortable: true,
        relationshipLabel: 'LNG_EVENT_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'address.date',
        label: 'LNG_EVENT_FIELD_LABEL_ADDRESS_DATE',
        relationshipLabel: 'LNG_EVENT_FIELD_LABEL_ADDRESS',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'address.emailAddress',
        label: 'LNG_EVENT_FIELD_LABEL_EMAIL',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.ADDRESS_PHONE_NUMBER,
        field: 'address',
        label: 'LNG_EVENT_FIELD_LABEL_PHONE_NUMBER',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address'
        ),
        isArray: false,
        sortable: 'address.phoneNumber'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'address.city',
        label: 'LNG_EVENT_FIELD_LABEL_ADDRESS_CITY',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address'
        ),
        sortable: true,
        useLike: true,
        relationshipLabel: 'LNG_EVENT_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'address.postalCode',
        label: 'LNG_EVENT_FIELD_LABEL_ADDRESS_POSTAL_CODE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address'
        ),
        sortable: true,
        useLike: true,
        relationshipLabel: 'LNG_EVENT_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'address.geoLocationAccurate',
        label: 'LNG_EVENT_FIELD_LABEL_ADDRESS_MANUAL_COORDINATES',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'address'
        ),
        options: data.options.yesNo,
        sortable: true,
        relationshipLabel: 'LNG_EVENT_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.DELETED,
        field: 'deleted',
        label: 'LNG_EVENT_FIELD_LABEL_DELETED',
        visibleMandatoryIf: () => true,
        yesNoAllOptions: data.options.yesNoAll,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'createdAt',
        label: 'LNG_EVENT_FIELD_LABEL_CREATED_AT',
        visibleMandatoryIf: () => true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'updatedAt',
        label: 'LNG_EVENT_FIELD_LABEL_UPDATED_AT',
        visibleMandatoryIf: () => true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.DELETED_AT,
        field: 'deletedAt',
        label: 'LNG_EVENT_FIELD_LABEL_DELETED_AT',
        visibleMandatoryIf: () => true,
        sortable: true
      }
    ];

    // allowed to filter by user ?
    if (UserModel.canListForFilters(this.parent.authUser)) {
      advancedFilters.push({
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'responsibleUserId',
        label: 'LNG_EVENT_FIELD_LABEL_RESPONSIBLE_USER_ID',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'responsibleUserId'
        ),
        options: data.options.user,
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'createdBy',
        label: 'LNG_EVENT_FIELD_LABEL_CREATED_BY',
        visibleMandatoryIf: () => true,
        options: data.options.user,
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'updatedBy',
        label: 'LNG_EVENT_FIELD_LABEL_UPDATED_BY',
        visibleMandatoryIf: () => true,
        options: data.options.user,
        sortable: true
      });
    }

    // finished
    return this.parent.list.filterVisibleMandatoryAdvancedFilters(advancedFilters);
  }

  /**
   * Retrieve statuses forms
   */
  getStatusForms(
    info: {
      // required
      item: EventModel
    }
  ): V2ColumnStatusForm[] {
    // construct list of forms that we need to display
    const forms: V2ColumnStatusForm[] = [];

    // alerted
    if (info.item.alerted) {
      forms.push({
        type: IV2ColumnStatusFormType.STAR,
        color: 'var(--gd-danger)',
        tooltip: this.parent.i18nService.instant('LNG_COMMON_LABEL_STATUSES_ALERTED')
      });
    } else {
      forms.push({
        type: IV2ColumnStatusFormType.EMPTY
      });
    }

    // finished
    return forms;
  }

  /**
   * Return event id mask with data replaced
   */
  generateEventIDMask(eventIdMask: string): string {
    // validate
    if (!eventIdMask) {
      return '';
    }

    // !!!!!!!!!!!!!!!
    // format ( IMPORTANT - NOT CASE INSENSITIVE => so yyyy won't be replaced with year, only YYYY )
    // !!!!!!!!!!!!!!!
    return eventIdMask
      .replace(/YYYY/g, moment().format('YYYY'))
      .replace(/\*/g, '');
  }
}
