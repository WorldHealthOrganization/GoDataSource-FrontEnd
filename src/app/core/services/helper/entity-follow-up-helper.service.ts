import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { IV2BottomDialogConfigButtonType } from '../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../shared/components-v2/app-list-table-v2/models/action.model';
import { V2AdvancedFilter, V2AdvancedFilterComparatorOptions, V2AdvancedFilterComparatorType, V2AdvancedFilterType } from '../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { IV2Column, IV2ColumnAction, IV2ColumnPinned, IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from '../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterType } from '../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { ILabelValuePairModel } from '../../../shared/forms-v2/core/label-value-pair.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { EntityType } from '../../models/entity-type';
import { QuestionModel } from '../../models/question.model';
import { UserModel } from '../../models/user.model';
import { DialogV2Service } from './dialog-v2.service';
import { ToastV2Service } from './toast-v2.service';
import { IBasicCount } from '../../models/basic-count.interface';
import { FollowUpsDataService } from '../data/follow-ups.data.service';
import { AddressModel } from '../../models/address.model';
import { FollowUpModel } from '../../models/follow-up.model';
import { IResolverV2ResponseModel } from '../resolvers/data/models/resolver-response.model';
import { TeamModel } from '../../models/team.model';
import { Constants } from '../../models/constants';
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputSingleDropdown, IV2SideDialogConfigInputToggle, V2SideDialogConfigInputType } from '../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { CaseModel } from '../../models/case.model';
import { ContactModel } from '../../models/contact.model';
import { OutbreakModel } from '../../models/outbreak.model';
import * as _ from 'lodash';
import { LocationModel } from '../../models/location.model';
import { LocationDataService } from '../data/location.data.service';
import * as moment from 'moment';
import { ReferenceDataEntryModel } from '../../models/reference-data.model';
import { I18nService } from './i18n.service';

@Injectable({
  providedIn: 'root'
})
export class EntityFollowUpHelperService {
  /**
   * Constructor
   */
  constructor(
    private dialogV2Service: DialogV2Service,
    private followUpsDataService: FollowUpsDataService,
    private toastV2Service: ToastV2Service,
    private i18nService: I18nService,
    private locationDataService: LocationDataService
  ) {}

  /**
   * Retrieve table columns
   */
  retrieveTableColumnActions(definitions: {
    authUser: UserModel,
    entityData: ContactModel | CaseModel,
    selectedOutbreak: () => OutbreakModel,
    selectedOutbreakIsActive: () => boolean,
    team: IResolverV2ResponseModel<TeamModel>,
    refreshList: () => void
  }): IV2ColumnAction {
    return {
      format: {
        type: V2ColumnFormat.ACTIONS
      },
      actions: [
        // View Follow-up
        {
          type: V2ActionType.ICON,
          icon: 'visibility',
          iconTooltip: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_VIEW_FOLLOW_UP',
          action: {
            link: (item: FollowUpModel): string[] => {
              return ['/contacts', item.personId, 'follow-ups', item.id, definitions.entityData.type === EntityType.CONTACT ? 'view' : 'history'];
            }
          },
          visible: (item: FollowUpModel): boolean => {
            return !item.deleted &&
              FollowUpModel.canView(definitions.authUser);
          }
        },

        // Modify Follow-up
        {
          type: V2ActionType.ICON,
          icon: 'edit',
          iconTooltip: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_MODIFY_FOLLOW_UP',
          action: {
            link: (item: FollowUpModel): string[] => {
              return ['/contacts', item.personId, 'follow-ups', item.id, 'modify'];
            }
          },
          visible: (item: FollowUpModel): boolean => {
            return !item.deleted &&
              definitions.entityData.type === EntityType.CONTACT &&
              definitions.selectedOutbreakIsActive() &&
              FollowUpModel.canModify(definitions.authUser);
          }
        },

        // Other actions
        {
          type: V2ActionType.MENU,
          icon: 'more_horiz',
          menuOptions: [
            // Delete Follow-up
            {
              label: {
                get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_DELETE_FOLLOW_UP'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: FollowUpModel): void => {
                  // determine what we need to delete
                  this.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_DELETE',
                        data: () => ({
                          name: item.date ?
                            moment(item.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                            ''
                        })
                      },
                      message: {
                        get: () => 'LNG_DIALOG_CONFIRM_DELETE_FOLLOW_UP',
                        data: () => ({
                          name: item.date ?
                            moment(item.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                            ''
                        })
                      }
                    }
                  }).subscribe((response) => {
                    // canceled ?
                    if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                      // finished
                      return;
                    }

                    // show loading
                    const loading = this.dialogV2Service.showLoadingDialog();

                    // delete follow up
                    this.followUpsDataService
                      .deleteFollowUp(
                        definitions.selectedOutbreak().id,
                        item.personId,
                        item.id
                      )
                      .pipe(
                        catchError((err) => {
                          // show error
                          this.toastV2Service.error(err);

                          // hide loading
                          loading.close();

                          // send error down the road
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // success
                        this.toastV2Service.success('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_DELETE_SUCCESS_MESSAGE');

                        // hide loading
                        loading.close();

                        // reload data
                        definitions.refreshList();
                      });
                  });
                }
              },
              visible: (item: FollowUpModel): boolean => {
                return !item.deleted &&
                  definitions.entityData.type === EntityType.CONTACT &&
                  definitions.selectedOutbreakIsActive() &&
                  FollowUpModel.canDelete(definitions.authUser);
              }
            },

            // Restore a deleted Follow-up
            {
              label: {
                get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_RESTORE_FOLLOW_UP'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: FollowUpModel) => {
                  // show confirm dialog to confirm the action
                  this.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_RESTORE',
                        data: () => ({
                          name: item.date ?
                            moment(item.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                            ''
                        })
                      },
                      message: {
                        get: () => 'LNG_DIALOG_CONFIRM_RESTORE_FOLLOW_UP',
                        data: () => ({
                          name: item.date ?
                            moment(item.date).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                            ''
                        })
                      }
                    }
                  }).subscribe((response) => {
                    // canceled ?
                    if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                      // finished
                      return;
                    }

                    // show loading
                    const loading = this.dialogV2Service.showLoadingDialog();

                    // delete follow up
                    this.followUpsDataService
                      .restoreFollowUp(
                        definitions.selectedOutbreak().id,
                        item.personId,
                        item.id
                      )
                      .pipe(
                        catchError((err) => {
                          // show error
                          this.toastV2Service.error(err);

                          // hide loading
                          loading.close();

                          // send error down the road
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // success
                        this.toastV2Service.success('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_RESTORE_SUCCESS_MESSAGE');

                        // hide loading
                        loading.close();

                        // reload data
                        definitions.refreshList();
                      });
                  });
                }
              },
              visible: (item: FollowUpModel): boolean => {
                return item.deleted &&
                  definitions.entityData.type === EntityType.CONTACT &&
                  definitions.selectedOutbreakIsActive() &&
                  FollowUpModel.canRestore(definitions.authUser);
              }
            },

            // Divider
            {
              visible: (item: FollowUpModel): boolean => {
                // visible only if at least one of the previous...
                return !item.deleted &&
                  definitions.entityData.type === EntityType.CONTACT &&
                  definitions.selectedOutbreakIsActive() &&
                  FollowUpModel.canModify(definitions.authUser) &&
                  !Constants.isDateInTheFuture(item.date);
              }
            },

            // Change targeted
            {
              label: {
                get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_CHANGE_TARGETED_FORM_BUTTON'
              },
              action: {
                click: (item: FollowUpModel) => {
                  this.dialogV2Service
                    .showSideDialog({
                      // title
                      title: {
                        get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_CHANGE_TARGETED_DIALOG_TITLE'
                      },

                      // hide search bar
                      hideInputFilter: true,

                      // inputs
                      inputs: [
                        {
                          type: V2SideDialogConfigInputType.TOGGLE,
                          value: item.targeted ?
                            Constants.FILTER_YES_NO_OPTIONS.YES.value :
                            Constants.FILTER_YES_NO_OPTIONS.NO.value,
                          name: 'targeted',
                          options: [
                            {
                              label: Constants.FILTER_YES_NO_OPTIONS.YES.label,
                              value: Constants.FILTER_YES_NO_OPTIONS.YES.value
                            },
                            {
                              label: Constants.FILTER_YES_NO_OPTIONS.NO.label,
                              value: Constants.FILTER_YES_NO_OPTIONS.NO.value
                            }
                          ]
                        }
                      ],

                      // buttons
                      bottomButtons: [
                        {
                          label: 'LNG_COMMON_BUTTON_UPDATE',
                          type: IV2SideDialogConfigButtonType.OTHER,
                          color: 'primary',
                          key: 'save',
                          disabled: (_data, handler): boolean => {
                            return !handler.form ||
                              handler.form.invalid ||
                              item.targeted === ((handler.data.map.targeted as IV2SideDialogConfigInputToggle).value) as boolean;
                          }
                        }, {
                          type: IV2SideDialogConfigButtonType.CANCEL,
                          label: 'LNG_COMMON_BUTTON_CANCEL',
                          color: 'text'
                        }
                      ]
                    })
                    .subscribe((response) => {
                      // cancelled ?
                      if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
                        return;
                      }

                      // change entity targeted
                      this.followUpsDataService
                        .modifyFollowUp(
                          definitions.selectedOutbreak().id,
                          item.personId,
                          item.id,
                          {
                            targeted: (response.handler.data.map.targeted as IV2SideDialogConfigInputToggle).value
                          }
                        )
                        .pipe(
                          catchError((err) => {
                            this.toastV2Service.error(err);
                            return throwError(err);
                          })
                        )
                        .subscribe(() => {
                          // update our record too
                          item.targeted = ((response.handler.data.map.targeted as IV2SideDialogConfigInputToggle).value) as boolean;

                          // success message
                          this.toastV2Service.success('LNG_PAGE_LIST_FOLLOW_UPS_CHANGE_TARGETED_SUCCESS_MESSAGE');

                          // close popup
                          response.handler.hide();

                          // reload data
                          definitions.refreshList();
                        });
                    });
                }
              },
              visible: (item: FollowUpModel): boolean => {
                return !item.deleted &&
                  definitions.entityData.type === EntityType.CONTACT &&
                  definitions.selectedOutbreakIsActive() &&
                  FollowUpModel.canModify(definitions.authUser);
              }
            },

            // Change team
            {
              label: {
                get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_CHANGE_TEAM_FORM_BUTTON'
              },
              action: {
                click: (item: FollowUpModel) => {
                  this.dialogV2Service
                    .showSideDialog({
                      // title
                      title: {
                        get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_CHANGE_TEAM_DIALOG_TITLE'
                      },

                      // hide search bar
                      hideInputFilter: true,

                      // inputs
                      inputs: [
                        {
                          type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
                          name: 'teamId',
                          placeholder: 'LNG_FOLLOW_UP_FIELD_LABEL_TEAM',
                          options: definitions.team.options,
                          value: item.teamId
                        }
                      ],

                      // buttons
                      bottomButtons: [
                        {
                          label: 'LNG_COMMON_BUTTON_UPDATE',
                          type: IV2SideDialogConfigButtonType.OTHER,
                          color: 'primary',
                          key: 'save',
                          disabled: (_data, handler): boolean => {
                            return !handler.form ||
                              handler.form.invalid ||
                              item.teamId === (handler.data.map.teamId as IV2SideDialogConfigInputSingleDropdown).value;
                          }
                        }, {
                          type: IV2SideDialogConfigButtonType.CANCEL,
                          label: 'LNG_COMMON_BUTTON_CANCEL',
                          color: 'text'
                        }
                      ]
                    })
                    .subscribe((response) => {
                      // cancelled ?
                      if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
                        return;
                      }

                      // change entity targeted
                      this.followUpsDataService
                        .modifyFollowUp(
                          definitions.selectedOutbreak().id,
                          item.personId,
                          item.id,
                          {
                            teamId: (response.handler.data.map.teamId as IV2SideDialogConfigInputSingleDropdown).value
                          }
                        )
                        .pipe(
                          catchError((err) => {
                            this.toastV2Service.error(err);
                            return throwError(err);
                          })
                        )
                        .subscribe(() => {
                          // success message
                          this.toastV2Service.success('LNG_PAGE_LIST_FOLLOW_UPS_CHANGE_TEAM_SUCCESS_MESSAGE');

                          // close popup
                          response.handler.hide();

                          // reload data
                          definitions.refreshList();
                        });
                    });
                }
              },
              visible: (item: FollowUpModel): boolean => {
                return !item.deleted &&
                  definitions.entityData.type === EntityType.CONTACT &&
                  definitions.selectedOutbreakIsActive() &&
                  FollowUpModel.canModify(definitions.authUser);
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * Retrieve table columns
   */
  retrieveTableColumns(definitions: {
    authUser: UserModel,
    team: IResolverV2ResponseModel<TeamModel>,
    user: IResolverV2ResponseModel<UserModel>,
    dailyFollowUpStatus: IResolverV2ResponseModel<ReferenceDataEntryModel>,
    options: {
      yesNoAll: ILabelValuePairModel[]
    }
  }): IV2Column[] {
    // address model used to search by phone number, address line, postal code, city....
    const filterAddressModel: AddressModel = new AddressModel({
      geoLocationAccurate: ''
    });

    // default table columns
    const tableColumns: IV2Column[] = [
      {
        field: 'date',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        format: {
          type: V2ColumnFormat.DATE
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'teamId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_TEAM',
        notVisible: true,
        format: {
          type: (item: FollowUpModel) => {
            return item.teamId && definitions.team.map[item.teamId] ?
              definitions.team.map[item.teamId].name :
              '';
          }
        },
        link: (item: FollowUpModel) => {
          return item.teamId &&
            TeamModel.canView(definitions.authUser) &&
            definitions.team.map[item.teamId] ?
            `/teams/${ item.teamId }/view` :
            undefined;
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.team.options
        }
      },
      {
        field: 'statusId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.dailyFollowUpStatus.options
        }
      },
      {
        field: 'statuses',
        label: 'LNG_COMMON_LABEL_STATUSES',
        format: {
          type: V2ColumnFormat.STATUS
        },
        notResizable: true,
        pinned: true,
        legends: [
          // status
          {
            title: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
            items: definitions.dailyFollowUpStatus.list.map((item) => {
              return {
                form: {
                  type: IV2ColumnStatusFormType.CIRCLE,
                  color: item.getColorCode()
                },
                label: item.id,
                order: item.order
              };
            })
          },

          // alerted
          {
            title: 'LNG_COMMON_LABEL_STATUSES_ALERTED',
            items: [{
              form: {
                type: IV2ColumnStatusFormType.STAR,
                color: 'var(--gd-danger)'
              },
              label: ' ',
              order: undefined
            }]
          }
        ],
        forms: (_column, data: FollowUpModel): V2ColumnStatusForm[] => FollowUpModel.getStatusForms({
          item: data,
          i18nService: this.i18nService,
          dailyFollowUpStatus: definitions.dailyFollowUpStatus
        })
      },
      {
        field: 'targeted',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED',
        sortable: true,
        format: {
          type: (item: FollowUpModel) => {
            return item && item.id && item.targeted ?
              this.i18nService.instant('LNG_COMMON_LABEL_YES') :
              this.i18nService.instant('LNG_COMMON_LABEL_NO');
          }
        },
        filter: {
          type: V2FilterType.BOOLEAN,
          value: '',
          defaultValue: ''
        }
      },
      {
        field: 'index',
        label: 'LNG_CONTACT_FIELD_LABEL_DAY_OF_FOLLOWUP',
        sortable: true,
        filter: {
          type: V2FilterType.NUMBER_RANGE,
          min: 0
        }
      },
      {
        field: 'location',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_AREA',
        format: {
          type: 'address.location.name'
        },
        filter: {
          type: V2FilterType.ADDRESS_MULTIPLE_LOCATION,
          address: filterAddressModel,
          field: 'address',
          fieldIsArray: false
        },
        link: (data) => {
          return data.address?.location?.name ?
            `/locations/${ data.address.location.id }/view` :
            undefined;
        }
      },
      {
        field: 'phoneNumber',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_PHONE_NUMBER',
        sortable: true,
        format: {
          type: 'address.phoneNumber'
        },
        filter: {
          type: V2FilterType.ADDRESS_PHONE_NUMBER,
          address: filterAddressModel,
          field: 'address',
          fieldIsArray: false
        }
      },
      {
        field: 'address.emailAddress',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_EMAIL',
        notVisible: true,
        sortable: true,
        format: {
          type: 'address.emailAddress'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'emailAddress',
          field: 'address',
          fieldIsArray: false
        }
      },
      {
        field: 'address.addressLine1',
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1',
        notVisible: true,
        format: {
          type: 'address.addressLine1'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'addressLine1',
          field: 'address',
          fieldIsArray: false
        }
      },
      {
        field: 'address.city',
        label: 'LNG_ADDRESS_FIELD_LABEL_CITY',
        notVisible: true,
        sortable: true,
        format: {
          type: 'address.city'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'city',
          field: 'address',
          fieldIsArray: false
        }
      },
      {
        field: 'address.geoLocation.lat',
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LAT',
        notVisible: true,
        format: {
          type: 'address.geoLocation.lat'
        }
      },
      {
        field: 'address.geoLocation.lng',
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LNG',
        notVisible: true,
        format: {
          type: 'address.geoLocation.lng'
        }
      },
      {
        field: 'address.postalCode',
        label: 'LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE',
        notVisible: true,
        sortable: true,
        format: {
          type: 'address.postalCode'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'postalCode',
          field: 'address',
          fieldIsArray: false
        }
      },
      {
        field: 'address.geoLocationAccurate',
        label: 'LNG_ADDRESS_FIELD_LABEL_MANUAL_COORDINATES',
        notVisible: true,
        sortable: true,
        format: {
          type: V2ColumnFormat.BOOLEAN,
          field: 'address.geoLocationAccurate'
        },
        filter: {
          type: V2FilterType.ADDRESS_ACCURATE_GEO_LOCATION,
          address: filterAddressModel,
          field: 'address',
          fieldIsArray: false,
          options: definitions.options.yesNoAll,
          defaultValue: ''
        }
      },
      {
        field: 'responsibleUserId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_RESPONSIBLE_USER_ID',
        notVisible: true,
        format: {
          type: (item) => item.responsibleUserId && definitions.user.map[item.responsibleUserId] ?
            definitions.user.map[item.responsibleUserId].name :
            ''
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.user.options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canListForFilters(definitions.authUser);
        },
        link: (data) => {
          return data.responsibleUserId ?
            `/users/${ data.responsibleUserId }/view` :
            undefined;
        }
      },
      {
        field: 'deleted',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_DELETED',
        notVisible: true,
        sortable: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.DELETED,
          value: false,
          defaultValue: false
        }
      },
      {
        field: 'deletedAt',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_DELETED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
      },
      {
        field: 'createdBy',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_BY',
        notVisible: true,
        format: {
          type: (item) => item.createdBy && definitions.user.map[item.createdBy] ?
            definitions.user.map[item.createdBy].name :
            ''
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.user.options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canView(definitions.authUser);
        },
        link: (data) => {
          return data.createdBy ?
            `/users/${ data.createdBy }/view` :
            undefined;
        }
      },
      {
        field: 'createdAt',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_AT',
        notVisible: true,
        sortable: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'updatedBy',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_UPDATED_BY',
        notVisible: true,
        format: {
          type: (item) => item.updatedBy && definitions.user.map[item.updatedBy] ?
            definitions.user.map[item.updatedBy].name :
            ''
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.user.options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canView(definitions.authUser);
        },
        link: (data) => {
          return data.updatedBy ?
            `/users/${ data.updatedBy }/view` :
            undefined;
        }
      },
      {
        field: 'updatedAt',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_UPDATED_AT',
        notVisible: true,
        sortable: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      }
    ];

    // finished
    return tableColumns;
  }

  /**
   * Advanced filters
   */
  generateAdvancedFilters(data: {
    authUser: UserModel,
    contactFollowUpTemplate: () => QuestionModel[],
    options: {
      team: ILabelValuePairModel[],
      yesNoAll: ILabelValuePairModel[],
      yesNo: ILabelValuePairModel[],
      dailyFollowUpStatus: ILabelValuePairModel[],
      user: ILabelValuePairModel[],
      addressType: ILabelValuePairModel[]
    }
  }): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilter[] = [
      {
        type: V2AdvancedFilterType.ADDRESS,
        field: 'address',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS',
        isArray: false
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'address.emailAddress',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_EMAIL',
        sortable: true,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'address.geoLocationAccurate',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_MANUAL_COORDINATES',
        options: data.options.yesNo,
        sortable: true,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'address.typeId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_TYPE',
        options: data.options.addressType,
        sortable: true,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'address.date',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_DATE',
        sortable: true,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'address.city',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_CITY',
        sortable: true,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'address.postalCode',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_POSTAL_CODE',
        sortable: true,
        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS'
      },
      {
        type: V2AdvancedFilterType.ADDRESS_PHONE_NUMBER,
        field: 'address',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_PHONE_NUMBER',
        isArray: false,
        sortable: 'address.phoneNumber'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'date',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'teamId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_TEAM',
        options: data.options.team
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'targeted',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED',
        options: data.options.yesNoAll
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'statusId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
        options: data.options.dailyFollowUpStatus
      },
      {
        type: V2AdvancedFilterType.NUMBER,
        field: 'weekNumber',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_WEEK_NUMBER',
        allowedComparators: [
          _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.NUMBER], { value: V2AdvancedFilterComparatorType.IS })
        ],
        flagIt: true
      },
      {
        type: V2AdvancedFilterType.DATE,
        field: 'timeLastSeen',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_TIME_FILTER',
        allowedComparators: [
          _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.DATE], { value: V2AdvancedFilterComparatorType.DATE })
        ],
        flagIt: true
      },
      {
        type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
        field: 'questionnaireAnswers',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
        template: data.contactFollowUpTemplate
      },
      {
        type: V2AdvancedFilterType.DELETED,
        field: 'deleted',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_DELETED',
        yesNoAllOptions: data.options.yesNoAll,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'createdAt',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_AT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'updatedAt',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_UPDATED_AT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.DELETED_AT,
        field: 'deletedAt',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_DELETED_AT',
        sortable: true
      }
    ];

    // allowed to filter by user ?
    if (UserModel.canListForFilters(data.authUser)) {
      advancedFilters.push(
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'responsibleUserId',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_RESPONSIBLE_USER_ID',
          options: data.options.user,
          sortable: true
        }, {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'createdBy',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_BY',
          options: data.options.user,
          sortable: true
        }, {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'updatedBy',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_UPDATED_BY',
          options: data.options.user,
          sortable: true
        }
      );
    }

    // finished
    return advancedFilters;
  }

  /**
   * Retrieve data
   */
  retrieveRecords(
    outbreak: OutbreakModel,
    queryBuilder: RequestQueryBuilder
  ): Observable<FollowUpModel[]> {
    return this.followUpsDataService
      .getFollowUpsList(
        outbreak.id,
        queryBuilder
      )
      .pipe(
        switchMap((data) => {
          // determine locations that we need to retrieve
          const locationsIdsMap: {
            [locationId: string]: true
          } = {};
          data.forEach((item) => {
            // nothing to add ?
            if (!item.address?.locationId) {
              return;
            }

            // add location to list
            locationsIdsMap[item.address.locationId] = true;
          });

          // determine ids
          const locationIds: string[] = Object.keys(locationsIdsMap);

          // nothing to retrieve ?
          if (locationIds.length < 1) {
            return of(data);
          }

          // construct location query builder
          const qb = new RequestQueryBuilder();
          qb.filter.bySelect(
            'id',
            locationIds,
            false,
            null
          );

          // retrieve locations
          return this.locationDataService
            .getLocationsList(qb)
            .pipe(
              map((locations) => {
                // map locations
                const locationsMap: {
                  [locationId: string]: LocationModel
                } = {};
                locations.forEach((location) => {
                  locationsMap[location.id] = location;
                });

                // set locations
                data.forEach((item) => {
                  item.address.location = item.address.locationId && locationsMap[item.address.locationId] ?
                    locationsMap[item.address.locationId] :
                    item.address.location;
                });

                // finished
                return data;
              })
            );
        })
      )
      .pipe(
        map((followUps: FollowUpModel[]) => {
          return FollowUpModel.determineAlertness(
            outbreak.contactFollowUpTemplate,
            followUps
          );
        })
      );
  }

  /**
   * Retrieve data count
   */
  retrieveRecordsCount(
    outbreakId: string,
    queryBuilder: RequestQueryBuilder
  ): Observable<IBasicCount> {
    return this.followUpsDataService
      .getFollowUpsCount(
        outbreakId,
        queryBuilder
      )
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        })
      );
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  refreshListFields(): string[] {
    return [
      'id',
      'date',
      'teamId',
      'statusId',
      'targeted',
      'index',
      'address',
      'responsibleUser',
      'responsibleUserId',
      'deleted',
      'deletedAt',
      'createdBy',
      'createdByUser',
      'createdAt',
      'updatedBy',
      'updatedByUser',
      'updatedAt',
      'personId',
      'questionnaireAnswers'
    ];
  }
}
