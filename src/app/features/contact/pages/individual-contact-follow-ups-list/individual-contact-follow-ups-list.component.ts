import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable, of } from 'rxjs';
import { throwError } from 'rxjs/internal/observable/throwError';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { RequestQueryBuilder, RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { AddressModel } from '../../../../core/models/address.model';
import { CaseModel } from '../../../../core/models/case.model';
import { Constants } from '../../../../core/models/constants';
import { ContactModel } from '../../../../core/models/contact.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { EntityType } from '../../../../core/models/entity-type';
import { ExportFieldsGroupModelNameEnum } from '../../../../core/models/export-fields-group.model';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { LocationModel } from '../../../../core/models/location.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { TeamModel } from '../../../../core/models/team.model';
import { UserModel } from '../../../../core/models/user.model';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ExportDataMethod, IV2ExportDataConfigGroupsRequired } from '../../../../core/services/helper/models/dialog-v2.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { V2AdvancedFilterType } from '../../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputToggle, V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { FollowUpsListComponent } from '../../helper-classes/follow-ups-list-component';
import { FollowUpPage } from '../../typings/follow-up-page';

@Component({
  selector: 'app-individual-contact-follow-ups-list',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './individual-contact-follow-ups-list.component.html',
  styleUrls: ['./individual-contact-follow-ups-list.component.less']
})
export class IndividualContactFollowUpsListComponent extends FollowUpsListComponent implements OnDestroy {
  // follow ups list
  followUpsList$: Observable<FollowUpModel[]>;

  entityId: string;
  entityData: ContactModel | CaseModel;
  isContact: boolean = true;

  // which follow-ups list page are we visiting?
  rootPage: FollowUpPage = FollowUpPage.FOR_CONTACT;

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    protected dialogService: DialogService,
    protected followUpsDataService: FollowUpsDataService,
    protected router: Router,
    protected i18nService: I18nService,
    protected teamDataService: TeamDataService,
    protected outbreakDataService: OutbreakDataService,
    protected userDataService: UserDataService,
    private toastV2Service: ToastV2Service,
    private route: ActivatedRoute,
    private locationDataService: LocationDataService,
    private dialogV2Service: DialogV2Service
  ) {
    super(
      listHelperService, dialogService, followUpsDataService,
      router, i18nService, teamDataService, outbreakDataService, userDataService
    );

    this.entityData = this.route.snapshot.data.entityData;
    this.entityId = this.route.snapshot.data.entityData.id;

    // check model
    if (this.entityData.type === EntityType.CASE) {
      this.isContact = false;
      this.rootPage = undefined;
    }

    this.suffixLegends = [
      {
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT',
        value: this.entityData.dateOfLastContact ? moment(this.entityData.dateOfLastContact).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) : this.entityData.dateOfLastContact
      },
      {
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_END_OF_FOLLOWUP',
        value: this.entityData.followUp.endDate ? moment(this.entityData.followUp.endDate).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) : this.entityData.followUp.endDate
      }
    ];
  }

  /**
     * Component destroyed
     */
  ngOnDestroy() {
    // release parent resources
    super.ngOnDestroy();
  }

  /**
  * Selected outbreak was changed
  */
  selectedOutbreakChanged(): void {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);

    // initialize print and export
    this.initializeFollowUpsExport();
    this.initializeFollowUpsPrint();
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns(): void {
    // address model used to search by phone number, address line, postal code, city....
    const filterAddressModel: AddressModel = new AddressModel({
      geoLocationAccurate: ''
    });

    // default table columns
    this.tableColumns = [
      {
        field: 'date',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE',
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
            return item.teamId &&
              (this.route.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).map[item.teamId] ?
              (this.route.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).map[item.teamId].name :
              '';
          }
        },
        link: (item: FollowUpModel) => {
          return item.teamId &&
            TeamModel.canView(this.authUser) &&
            (this.route.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).map[item.teamId] ?
            `/teams/${ item.teamId }/view` :
            undefined;
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.route.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).options
        }
      },
      {
        field: 'statusId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.route.snapshot.data.dailyFollowUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'targeted',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED',
        sortable: true,
        format: {
          type: (item: FollowUpModel) => {
            return item &&
              item.id &&
              item.targeted ?
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
        sortable: true,
        format: {
          type: 'address.geoLocation.lat'
        }
      },
      {
        field: 'address.geoLocation.lng',
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LNG',
        notVisible: true,
        sortable: true,
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
          fieldIsArray: true
        }
      },
      {
        field: 'address.geoLocationAccurate',
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_GEO_LOCATION_ACCURATE',
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
          fieldIsArray: true,
          options: (this.route.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options,
          defaultValue: ''
        }
      },
      {
        field: 'responsibleUserId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_RESPONSIBLE_USER_ID',
        notVisible: true,
        format: {
          type: 'responsibleUser.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.route.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canList(this.authUser);
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
        field: 'createdBy',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_BY',
        notVisible: true,
        format: {
          type: 'createdByUser.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.route.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
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
          type: 'updatedByUser.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.route.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
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
      },

      // actions
      {
        field: 'actions',
        label: 'LNG_COMMON_LABEL_ACTIONS',
        pinned: IV2ColumnPinned.RIGHT,
        notResizable: true,
        cssCellClass: 'gd-cell-no-focus',
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
                return ['/contacts', item.personId, 'follow-ups', item.id, this.isContact ? 'view' : 'history'];
              },
              linkQueryParams: (): Params => {
                return {
                  rootPage: this.rootPage
                };
              }
            },
            visible: (item: FollowUpModel): boolean => {
              return !item.deleted &&
                FollowUpModel.canView(this.authUser);
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
              },
              linkQueryParams: (): Params => {
                return {
                  rootPage: this.rootPage
                };
              }
            },
            visible: (item: FollowUpModel): boolean => {
              return !item.deleted &&
                this.isContact &&
                this.selectedOutbreakIsActive &&
                FollowUpModel.canModify(this.authUser);
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
                            name: item.person.name
                          })
                        },
                        message: {
                          get: () => 'LNG_DIALOG_CONFIRM_DELETE_FOLLOW_UP',
                          data: () => ({
                            name: item.person.name
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
                        .deleteFollowUp(this.selectedOutbreak.id, item.personId, item.id)
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
                          this.needsRefreshList(true);
                        });
                    });
                  }
                },
                visible: (item: FollowUpModel): boolean => {
                  return !item.deleted &&
                    this.isContact &&
                    this.selectedOutbreakIsActive &&
                    FollowUpModel.canDelete(this.authUser);
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
                          data: () => item as any
                        },
                        message: {
                          get: () => 'LNG_DIALOG_CONFIRM_RESTORE_FOLLOW_UP',
                          data: () => item as any
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
                        .restoreFollowUp(this.selectedOutbreak.id, item.personId, item.id)
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
                          this.needsRefreshList(true);
                        });
                    });
                  }
                },
                visible: (item: FollowUpModel): boolean => {
                  return item.deleted &&
                    this.isContact &&
                    this.selectedOutbreakIsActive &&
                    FollowUpModel.canRestore(this.authUser);
                }
              },

              // Divider
              {
                visible: (item: FollowUpModel): boolean => {
                  // visible only if at least one of the previous...
                  return !item.deleted &&
                    this.isContact &&
                    this.selectedOutbreakIsActive &&
                    FollowUpModel.canModify(this.authUser) &&
                    !Constants.isDateInTheFuture(item.date);
                }
              },

              // Modify follow-up questionnaire
              {
                label: {
                  get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_MODIFY_QUESTIONNAIRE'
                },
                action: {
                  click: (item: FollowUpModel) => {
                    // TODO: Dialog needs questionnaire component
                    this.modifyQuestionnaire(item);
                  }
                },
                visible: (item: FollowUpModel): boolean => {
                  return !item.deleted &&
                    this.isContact &&
                    this.selectedOutbreakIsActive &&
                    FollowUpModel.canModify(this.authUser) &&
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
                      }).subscribe((response) => {
                        // cancelled ?
                        if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
                          return;
                        }

                        // change entity targeted
                        this.followUpsDataService
                          .modifyFollowUp(this.selectedOutbreak.id, item.personId, item.id, { targeted: (response.handler.data.map.targeted as IV2SideDialogConfigInputToggle).value })
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

                            // refresh list
                            this.needsRefreshList(true);
                          });
                      });
                  }
                },
                visible: (item: FollowUpModel): boolean => {
                  return !item.deleted &&
                    this.isContact &&
                    this.selectedOutbreakIsActive &&
                    FollowUpModel.canModify(this.authUser);
                }
              }
            ]
          }
        ]
      }
    ];
  }

  /**
   * Initialize table infos
   */
  protected initializeTableInfos(): void {}

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {
    this.advancedFilters = [
      {
        type: V2AdvancedFilterType.ADDRESS,
        field: 'address',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS',
        isArray: true
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
        options: (this.route.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).options
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'targeted',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED',
        options: (this.route.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'statusId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
        options: (this.route.snapshot.data.dailyFollowUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
      },
      // TODO: allowedComparators needs to be implemented
      // {
      //   type: V2AdvancedFilterType.NUMBER,
      //   field: 'weekNumber',
      //   label: 'LNG_FOLLOW_UP_FIELD_LABEL_WEEK_NUMBER',
      //   allowedComparators: [
      //     _.find(AppliedFilterModel.allowedComparators[FilterType.NUMBER], { value: FilterComparator.IS })
      //   ],
      //   flagIt: true
      // },
      // {
      //   type: V2AdvancedFilterType.DATE,
      //   field: 'timeLastSeen',
      //   label: 'LNG_FOLLOW_UP_FIELD_LABEL_TIME_FILTER',
      //   allowedComparators: [
      //     _.find(AppliedFilterModel.allowedComparators[FilterType.DATE], { value: FilterComparator.IS })
      //   ],
      //   extraConditions
      //   flagIt: true
      // },
      {
        type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
        field: 'questionnaireAnswers',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
        template: () => this.selectedOutbreak.contactFollowUpTemplate
      }
    ];


    // allowed to filter by responsible user ?
    if (UserModel.canList(this.authUser)) {
      this.advancedFilters.push(
        {
          type: V2AdvancedFilterType.MULTISELECT,
          field: 'responsibleUserId',
          label: 'LNG_FOLLOW_UP_FIELD_LABEL_RESPONSIBLE_USER_ID',
          options: (this.route.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
        }
      );
    }
  }

  /**
   * Initialize table quick actions
   */
  protected initializeQuickActions(): void {
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: (): boolean => {
        return FollowUpModel.canExportDailyForm(this.authUser) ||
          FollowUpModel.canExport(this.authUser);
      },
      menuOptions: [
        // print follow-ups daily form
        {
          label: {
            get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_PRINT_DAILY_FORM_BUTTON'
          },
          action: {
            click: () => {
              this.dialogV2Service
                .showExportData({
                  title: {
                    get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_PRINT_DAILY_FORM_TITLE'
                  },
                  export: {
                    url: this.printFollowUpsUrl,
                    async: false,
                    method: ExportDataMethod.GET,
                    fileName: this.printFollowUpsFileName,
                    queryBuilder: this.queryBuilder,
                    allow: {
                      types: [ExportDataExtension.PDF]
                    },
                    inputs: {
                      append: [
                        {
                          type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
                          name: 'contactId',
                          placeholder: this.isContact ?
                            'LNG_PAGE_LIST_FOLLOW_UPS_EXPORT_CONTACT_BUTTON' :
                            'LNG_PAGE_LIST_FOLLOW_UPS_EXPORT_CASE_BUTTON',
                          options: [({
                            label: this.entityData.name,
                            value: this.entityId
                          }) as any],
                          value: this.entityData.id,
                          validators: {
                            required: () => true
                          },
                          disabled: () => true
                        },
                        {
                          type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
                          name: 'groupBy',
                          placeholder: 'LNG_PAGE_LIST_FOLLOW_UPS_EXPORT_GROUP_BY_BUTTON',
                          options: [(Constants.RANGE_FOLLOW_UP_EXPORT_GROUP_BY.PLACE) as any],
                          value: Constants.RANGE_FOLLOW_UP_EXPORT_GROUP_BY.PLACE.value,
                          validators: {
                            required: () => true
                          },
                          disabled: () => true
                        }
                      ]
                    }
                  }
                });
            }
          },
          visible: (): boolean => {
            return FollowUpModel.canExport(this.authUser);
          }
        },

        // export follow-ups list
        {
          label: {
            get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_EXPORT_BUTTON'
          },
          action: {
            click: () => {
              this.dialogV2Service
                .showExportDataAfterLoadingData({
                  title: {
                    get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_EXPORT_TITLE'
                  },
                  load: (finished) => {
                    // retrieve the list of export fields groups for model
                    this.outbreakDataService
                      .getExportFieldsGroups(ExportFieldsGroupModelNameEnum.FOLLOWUP)
                      .pipe(
                        // handle errors
                        catchError((err) => {
                          // show error
                          this.toastV2Service.error(err);

                          // send error further
                          return throwError(err);
                        }),

                        // should be the last pipe
                        takeUntil(this.destroyed$)
                      )
                      .subscribe((fieldsGroupList) => {
                        // set groups
                        const followUpFieldGroups: ILabelValuePairModel[] = fieldsGroupList.options.map((item) => ({
                          label: item.name,
                          value: item.name
                        }));

                        // group restrictions
                        const followUpFieldGroupsRequires: IV2ExportDataConfigGroupsRequired = fieldsGroupList.toRequiredList();

                        // show export
                        finished({
                          title: {
                            get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_EXPORT_TITLE'
                          },
                          export: {
                            url: this.exportFollowUpsUrl,
                            async: true,
                            method: ExportDataMethod.POST,
                            fileName: this.followUpsDataExportFileName,
                            queryBuilder: this.queryBuilder,
                            allow: {
                              types: this.allowedExportTypes,
                              encrypt: true,
                              anonymize: {
                                fields: this.anonymizeFields
                              },
                              groups: {
                                fields: followUpFieldGroups,
                                required: followUpFieldGroupsRequires
                              },
                              dbColumns: true,
                              dbValues: true,
                              jsonReplaceUndefinedWithNull: true,
                              questionnaireVariables: true
                            }
                          }
                        });
                      });
                  }
                });
            }
          },
          visible: (): boolean => {
            return FollowUpModel.canExport(this.authUser);
          }
        }
      ]
    };
  }

  /**
   * Initialize table group actions
   */
  protected initializeGroupActions(): void {
    this.groupActions = [
      // bulk modify
      {
        label: {
          get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_GROUP_ACTION_MODIFY_SELECTED_FOLLOW_UPS'
        },
        action: {
          link: () => {
            return ['/contacts/follow-ups/modify-list'];
          },
          linkQueryParams: (selected: string[]): Params => {
            return {
              followUpsIds: JSON.stringify(selected)
            };
          }
        },
        visible: (): boolean => {
          return FollowUpModel.canBulkModify(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        }
      },

      // bulk export
      {
        label: {
          get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_GROUP_ACTION_EXPORT_SELECTED_FOLLOW_UPS'
        },
        action: {
          click: (selected: string[]) => {
            // construct query builder
            const qb = new RequestQueryBuilder();
            qb.filter.bySelect(
              'id',
              selected,
              true,
              null
            );

            // show export dialog
            this.dialogV2Service
              .showExportDataAfterLoadingData({
                title: {
                  get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_EXPORT_TITLE'
                },
                load: (finished) => {
                  // retrieve the list of export fields groups for model
                  this.outbreakDataService
                    .getExportFieldsGroups(ExportFieldsGroupModelNameEnum.FOLLOWUP)
                    .pipe(
                      // handle errors
                      catchError((err) => {
                        // show error
                        this.toastV2Service.error(err);

                        // send error further
                        return throwError(err);
                      }),

                      // should be the last pipe
                      takeUntil(this.destroyed$)
                    )
                    .subscribe((fieldsGroupList) => {
                      // set groups
                      const followUpFieldGroups: ILabelValuePairModel[] = fieldsGroupList.options.map((item) => ({
                        label: item.name,
                        value: item.name
                      }));

                      // group restrictions
                      const followUpFieldGroupsRequires: IV2ExportDataConfigGroupsRequired = fieldsGroupList.toRequiredList();

                      // show export
                      finished({
                        title: {
                          get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_EXPORT_TITLE'
                        },
                        export: {
                          url: this.exportFollowUpsUrl,
                          async: true,
                          method: ExportDataMethod.POST,
                          fileName: this.followUpsDataExportFileName,
                          queryBuilder: qb,
                          allow: {
                            types: this.allowedExportTypes,
                            encrypt: true,
                            anonymize: {
                              fields: this.anonymizeFields
                            },
                            groups: {
                              fields: followUpFieldGroups,
                              required: followUpFieldGroupsRequires
                            },
                            dbColumns: true,
                            dbValues: true,
                            jsonReplaceUndefinedWithNull: true,
                            questionnaireVariables: true
                          }
                        }
                      });
                    });
                }
              });
          }
        },
        visible: (): boolean => {
          return FollowUpModel.canExport(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        }
      },

      // bulk delete
      {
        label: {
          get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_GROUP_ACTION_DELETE_SELECTED_FOLLOW_UPS'
        },
        action: {
          click: (selected: string[]) => {
            // create query
            const qb = new RequestQueryBuilder();
            qb.filter.where({
              id: {
                inq: selected
              }
            });

            // ask for confirmation
            this.dialogV2Service
              .showConfirmDialog({
                config: {
                  title: {
                    get: () => 'LNG_PAGE_ACTION_DELETE'
                  },
                  message: {
                    get: () => 'LNG_DIALOG_CONFIRM_DELETE_MULTIPLE_FOLLOW_UPS'
                  }
                }
              })
              .subscribe((response) => {
                // canceled ?
                if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                  // finished
                  return;
                }

                // show loading
                const loading = this.dialogV2Service.showLoadingDialog();

                // delete follow-ups
                this.followUpsDataService
                  .deleteBulkFollowUps(this.selectedOutbreak.id, qb)
                  .pipe(
                    catchError((err) => {
                      this.toastV2Service.error(err);

                      // hide loading
                      loading.close();

                      return throwError(err);
                    })
                  )
                  .subscribe(() => {
                    this.toastV2Service.success('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_DELETE_SELECTED_FOLLOW_UPS_SUCCESS_MESSAGE');

                    // hide loading
                    loading.close();

                    this.needsRefreshList(true);
                  });
              });
          }
        },
        visible: (): boolean => {
          return FollowUpModel.canBulkDelete(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        }
      },

      // bulk restore
      {
        label: {
          get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_GROUP_ACTION_RESTORE_SELECTED_FOLLOW_UPS'
        },
        action: {
          click: (selected: string[]) => {
            // create query
            const qb = new RequestQueryBuilder();
            qb.filter.where({
              id: {
                inq: selected
              }
            });

            // ask for confirmation
            this.dialogV2Service
              .showConfirmDialog({
                config: {
                  title: {
                    get: () => 'LNG_PAGE_ACTION_RESTORE'
                  },
                  message: {
                    get: () => 'LNG_DIALOG_CONFIRM_RESTORE_MULTIPLE_FOLLOW_UPS'
                  }
                }
              })
              .subscribe((response) => {
                // canceled ?
                if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                  // finished
                  return;
                }

                // show loading
                const loading = this.dialogV2Service.showLoadingDialog();

                // restore follow-ups
                this.followUpsDataService
                  .restoreBulkFollowUps(this.selectedOutbreak.id, qb)
                  .pipe(
                    catchError((err) => {
                      this.toastV2Service.error(err);

                      // hide loading
                      loading.close();

                      return throwError(err);
                    })
                  )
                  .subscribe(() => {
                    this.toastV2Service.success('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_RESTORE_SELECTED_FOLLOW_UPS_SUCCESS_MESSAGE');

                    // hide loading
                    loading.close();

                    this.needsRefreshList(true);
                  });
              });
          }
        },
        visible: (): boolean => {
          return FollowUpModel.canBulkDelete(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        }
      }
    ];
  }

  /**
   * Initialize table add action
   */
  protected initializeAddAction(): void {
    this.addAction = {
      type: V2ActionType.ICON_LABEL,
      label: 'LNG_COMMON_BUTTON_ADD',
      icon: 'add_circle_outline',
      action: {
        link: (): string[] => ['/contacts', this.entityData?.id, 'follow-ups', 'create']
      },
      visible: (): boolean => {
        return FollowUpModel.canCreate(this.authUser);
      }
    };
  }

  /**
   * Initialize table grouped data
   */
  protected initializeGroupedData(): void {}

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs(): void {
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      }
    ];

    // add contact/case breadcrumbs
    if (this.isContact) {
      if (ContactModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
          action: {
            link: ['/contacts']
          }
        });
      }
    } else {
      if (CaseModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_CASES_TITLE',
          action: {
            link: ['/cases']
          }
        });
      }
    }

    // add record data ?
    if (this.isContact) {
      if (this.entityData &&
        CaseModel.canView(this.authUser)) {
        this.breadcrumbs.push({
          label: this.entityData.name,
          action: {
            link: [this.isContact ? `/contacts/${ this.entityData.id }/view` : `/cases/${ this.entityData.id }/view`]
          }
        });
      }
    }

    // add follow-ups breadcrumbs
    this.breadcrumbs.push({
      label: this.isContact ? 'LNG_PAGE_LIST_FOLLOW_UPS_TITLE' : 'LNG_PAGE_LIST_FOLLOW_UPS_REGISTERED_AS_CONTACT_TITLE',
      action: null
    });
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
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
      'createdBy',
      'createdByUser',
      'createdAt',
      'updatedBy',
      'updatedByUser',
      'updatedAt',
      'personId'
    ];
  }

  /**
   * Refresh list
   */
  refreshList() {
    if (
      this.selectedOutbreak &&
            this.entityId
    ) {
      // add contact id
      this.queryBuilder.filter.byEquality(
        'personId',
        this.entityId
      );

      // make sure we always sort by something
      // default by date asc
      if (this.queryBuilder.sort.isEmpty()) {
        this.queryBuilder.sort.by(
          'date',
          RequestSortDirection.ASC
        );
      }

      // retrieve created user & modified user information
      this.queryBuilder.include('createdByUser', true);
      this.queryBuilder.include('updatedByUser', true);

      // retrieve responsible user information
      this.queryBuilder.include('responsibleUser', true);

      // retrieve the list of Follow Ups
      this.followUpsList$ = this.followUpsDataService
        .getFollowUpsList(this.selectedOutbreak.id, this.queryBuilder)
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
              this.selectedOutbreak.contactFollowUpTemplate,
              followUps
            );
          }),

          // should be the last pipe
          takeUntil(this.destroyed$)
        );
    }
  }

  /**
     * Get total number of items, based on the applied filters
     */
  refreshListCount(applyHasMoreLimit?: boolean) {
    if (
      this.selectedOutbreak &&
            this.entityId
    ) {
      // set apply value
      if (applyHasMoreLimit !== undefined) {
        this.applyHasMoreLimit = applyHasMoreLimit;
      }

      // include related people in response
      const qb = new RequestQueryBuilder();
      qb.merge(this.queryBuilder);

      // add contact id
      qb.filter.byEquality(
        'personId',
        this.entityId
      );

      // remove paginator from query builder
      const countQueryBuilder = _.cloneDeep(qb);
      countQueryBuilder.paginator.clear();
      countQueryBuilder.sort.clear();

      // apply has more limit
      if (this.applyHasMoreLimit) {
        countQueryBuilder.flag(
          'applyHasMoreLimit',
          true
        );
      }

      // count
      this.followUpsDataService
        .getFollowUpsCount(this.selectedOutbreak.id, countQueryBuilder)
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            return throwError(err);
          }),

          // should be the last pipe
          takeUntil(this.destroyed$)
        )
        .subscribe((response) => {
          this.pageCount = response;
        });
    }
  }
}
