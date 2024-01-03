import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import * as _ from 'lodash';
import { throwError } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { AddressModel } from '../../../../core/models/address.model';
import { CaseModel } from '../../../../core/models/case.model';
import { Constants } from '../../../../core/models/constants';
import { ContactModel } from '../../../../core/models/contact.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { ExportFieldsGroupModelNameEnum } from '../../../../core/models/export-fields-group.model';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { TeamModel } from '../../../../core/models/team.model';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ExportDataExtension, ExportDataMethod, IV2ExportDataConfigGroupsRequired } from '../../../../core/services/helper/models/dialog-v2.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2ColumnPinned, IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { IV2FilterDate, V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { IV2GroupedData } from '../../../../shared/components-v2/app-list-table-v2/models/grouped-data.model';
import {
  IV2SideDialogConfigButtonType,
  IV2SideDialogConfigInputCheckbox,
  IV2SideDialogConfigInputDate,
  IV2SideDialogConfigInputDateRange,
  IV2SideDialogConfigInputMultiDropdown,
  IV2SideDialogConfigInputNumber,
  IV2SideDialogConfigInputSingleDropdown,
  IV2SideDialogConfigInputText,
  IV2SideDialogConfigInputToggle,
  IV2SideDialogConfigInputToggleCheckbox,
  IV2SideDialogData,
  IV2SideDialogHandler,
  V2SideDialogConfigInputType
} from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { TopnavComponent } from '../../../../core/components/topnav/topnav.component';
import { IV2DateRange } from '../../../../shared/forms-v2/components/app-form-date-range-v2/models/date.model';
import { EntityType } from '../../../../core/models/entity-type';
import { AppFormSelectMultipleV2Component } from '../../../../shared/forms-v2/components/app-form-select-multiple-v2/app-form-select-multiple-v2.component';
import { LocationModel } from '../../../../core/models/location.model';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { IV2ColumnToVisibleMandatoryConf } from '../../../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';
import { PersonAndRelatedHelperService } from '../../../../core/services/helper/person-and-related-helper.service';
import { LocalizationHelper, Moment } from '../../../../core/helperClasses/localization-helper';

@Component({
  selector: 'app-daily-follow-ups-list',
  templateUrl: './contact-daily-follow-ups-list.component.html'
})
export class ContactDailyFollowUpsListComponent extends ListComponent<FollowUpModel, IV2ColumnToVisibleMandatoryConf> implements OnDestroy {
  // constants
  private static readonly CREATED_BY_USER: string = 'createdByUser';
  private static readonly UPDATED_BY_USER: string = 'updatedByUser';

  // case/contact of contact
  entityData: CaseModel | ContactOfContactModel;

  pageSettingsKey: UserSettings = UserSettings.CONTACT_DAILY_FOLLOW_UP_FIELDS;

  // follow-up fields
  private followUpFields: ILabelValuePairModel[] = [
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_ID', value: 'id' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT', value: 'contact' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE', value: 'date' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS', value: 'address' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_FILL_LOCATION', value: 'fillLocation' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_INDEX', value: 'index' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_TEAM', value: 'teamId' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUSID', value: 'statusId' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED', value: 'targeted' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_COMMENT', value: 'comment' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_AS', value: 'createdAs' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT_RISK_LEVEL', value: 'contact.riskLevel' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT_GENDER', value: 'contact.gender' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT_OCCUPATION', value: 'contact.occupation' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT_AGE_YEARS', value: 'contact.age.years' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT_AGE_MONTHS', value: 'contact.age.months' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT_DOB', value: 'contact.dob' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_RESPONSIBLE_USER_ID', value: 'responsibleUser' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_QUESTIONNAIRE_ANSWERS', value: 'questionnaireAnswers' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_BY_USER', value: ContactDailyFollowUpsListComponent.CREATED_BY_USER },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_UPDATED_BY_USER', value: ContactDailyFollowUpsListComponent.UPDATED_BY_USER },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_AT', value: 'createdAt' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_BY', value: 'createdBy' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_UPDATED_AT', value: 'updatedAt' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_UPDATED_BY', value: 'updatedBy' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_DELETED', value: 'deleted' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_DELETED_AT', value: 'deletedAt' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_ON', value: 'createdOn' }
  ];

  // print follow-up
  printFollowUpsDialogExtraAPIData = {
    startDate: LocalizationHelper.today(),
    endDate: LocalizationHelper.now().endOf('day')
  };

  // redirect from team workload ?
  private _workloadData: {
    date: Moment,
    team: string,
    user: string,
    status: string[]
  };

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    protected outbreakDataService: OutbreakDataService,
    protected activatedRoute: ActivatedRoute,
    protected referenceDataHelperService: ReferenceDataHelperService,
    private personAndRelatedHelperService: PersonAndRelatedHelperService
  ) {
    super(
      listHelperService, {
        disableFilterCaching: true,
        initializeTableColumnsAfterSelectedOutbreakChanged: true,
        initializeTableAdvancedFiltersAfterSelectedOutbreakChanged: true
      }
    );

    // from team/user workload ?
    if (this.activatedRoute.snapshot.queryParams.fromWorkload) {
      this._workloadData = {
        date: LocalizationHelper.toMoment(this.activatedRoute.snapshot.queryParams.date),
        team: this.activatedRoute.snapshot.queryParams.team,
        user: this.activatedRoute.snapshot.queryParams.user,
        status: this.activatedRoute.snapshot.queryParams.status ?
          (
            typeof this.activatedRoute.snapshot.queryParams.status === 'string' ?
              JSON.parse(this.activatedRoute.snapshot.queryParams.status) :
              this.activatedRoute.snapshot.queryParams.status
          ) :
          null
      };
    }

    // get data
    this.entityData = this.activatedRoute.snapshot.data.entityData;

    // disable outbreak change ?
    if (this.entityData) {
      TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = true;

      // determine page settings key
      this.pageSettingsKey = this.entityData.type === EntityType.CASE ?
        UserSettings.CASE_RELATED_DAILY_FOLLOW_UP_FIELDS :
        UserSettings.CONTACT_OF_CONTACT_RELATED_DAILY_FOLLOW_UP_FIELDS;
    }

    // update breadcrumbs
    this.initializeBreadcrumbs();
  }

  /**
   * Component destroyed
   */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();

    // enable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = false;
  }

  /**
  * Selected outbreak was changed
  */
  selectedOutbreakChanged(): void {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
   * Table column - actions
   */
  protected initializeTableColumnActions(): void {
    this.tableColumnActions = {
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
              return ['/contacts', item.personId, 'follow-ups', item.id, 'view'];
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
            }
          },
          visible: (item: FollowUpModel): boolean => {
            return !item.deleted &&
              !item.person?.deleted &&
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
                  this.personAndRelatedHelperService.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_DELETE',
                        data: () => ({
                          name: item.date ?
                            LocalizationHelper.displayDate(item.date) :
                            ''
                        })
                      },
                      message: {
                        get: () => 'LNG_DIALOG_CONFIRM_DELETE_FOLLOW_UP',
                        data: () => ({
                          name: item.date ?
                            LocalizationHelper.displayDate(item.date) :
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
                    const loading = this.personAndRelatedHelperService.dialogV2Service.showLoadingDialog();

                    // delete follow up
                    this.personAndRelatedHelperService.followUp.followUpsDataService
                      .deleteFollowUp(this.selectedOutbreak.id, item.personId, item.id)
                      .pipe(
                        catchError((err) => {
                          // show error
                          this.personAndRelatedHelperService.toastV2Service.error(err);

                          // hide loading
                          loading.close();

                          // send error down the road
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // success
                        this.personAndRelatedHelperService.toastV2Service.success('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_DELETE_SUCCESS_MESSAGE');

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
                  this.personAndRelatedHelperService.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_RESTORE',
                        data: () => ({
                          name: item.date ?
                            LocalizationHelper.displayDate(item.date) :
                            ''
                        })
                      },
                      message: {
                        get: () => 'LNG_DIALOG_CONFIRM_RESTORE_FOLLOW_UP',
                        data: () => ({
                          name: item.date ?
                            LocalizationHelper.displayDate(item.date) :
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
                    const loading = this.personAndRelatedHelperService.dialogV2Service.showLoadingDialog();

                    // delete follow up
                    this.personAndRelatedHelperService.followUp.followUpsDataService
                      .restoreFollowUp(
                        this.selectedOutbreak.id,
                        item.personId,
                        item.id
                      )
                      .pipe(
                        catchError((err) => {
                          // show error
                          this.personAndRelatedHelperService.toastV2Service.error(err);

                          // hide loading
                          loading.close();

                          // send error down the road
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // success
                        this.personAndRelatedHelperService.toastV2Service.success('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_RESTORE_SUCCESS_MESSAGE');

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
                  this.selectedOutbreakIsActive &&
                  FollowUpModel.canRestore(this.authUser);
              }
            },

            // Divider
            {
              visible: (item: FollowUpModel): boolean => {
                // visible only if at least one of the previous...
                return !item.deleted &&
                  item.person?.type !== EntityType.CASE &&
                  item.person?.type !== EntityType.CONTACT_OF_CONTACT &&
                  this.selectedOutbreakIsActive &&
                  FollowUpModel.canModify(this.authUser) &&
                  (
                    !item.date ||
                    LocalizationHelper.toMoment(item.date).isSameOrBefore(LocalizationHelper.today())
                  );
              }
            },

            // Change targeted
            {
              label: {
                get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_CHANGE_TARGETED_FORM_BUTTON'
              },
              action: {
                click: (item: FollowUpModel) => {
                  this.personAndRelatedHelperService.dialogV2Service
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
                      this.personAndRelatedHelperService.followUp.followUpsDataService
                        .modifyFollowUp(
                          this.selectedOutbreak.id,
                          item.person,
                          item.id,
                          {
                            targeted: (response.handler.data.map.targeted as IV2SideDialogConfigInputToggle).value
                          }
                        )
                        .pipe(
                          catchError((err) => {
                            this.personAndRelatedHelperService.toastV2Service.error(err);
                            return throwError(err);
                          })
                        )
                        .subscribe(() => {
                          // update our record too
                          item.targeted = ((response.handler.data.map.targeted as IV2SideDialogConfigInputToggle).value) as boolean;

                          // success message
                          this.personAndRelatedHelperService.toastV2Service.success('LNG_PAGE_LIST_FOLLOW_UPS_CHANGE_TARGETED_SUCCESS_MESSAGE');

                          // close popup
                          response.handler.hide();

                          // reload data
                          this.needsRefreshList(true);
                        });
                    });
                }
              },
              visible: (item: FollowUpModel): boolean => {
                return !item.deleted &&
                  item.person?.type !== EntityType.CASE &&
                  item.person?.type !== EntityType.CONTACT_OF_CONTACT &&
                  this.selectedOutbreakIsActive &&
                  FollowUpModel.canModify(this.authUser);
              }
            },

            // Change team
            {
              label: {
                get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_CHANGE_TEAM_FORM_BUTTON'
              },
              action: {
                click: (item: FollowUpModel) => {
                  this.personAndRelatedHelperService.dialogV2Service
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
                          options: this.activatedRoute.snapshot.data.team.options,
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
                      this.personAndRelatedHelperService.followUp.followUpsDataService
                        .modifyFollowUp(
                          this.selectedOutbreak.id,
                          item.person,
                          item.id,
                          {
                            teamId: (response.handler.data.map.teamId as IV2SideDialogConfigInputSingleDropdown).value
                          }
                        )
                        .pipe(
                          catchError((err) => {
                            this.personAndRelatedHelperService.toastV2Service.error(err);
                            return throwError(err);
                          })
                        )
                        .subscribe(() => {
                          // success message
                          this.personAndRelatedHelperService.toastV2Service.success('LNG_PAGE_LIST_FOLLOW_UPS_CHANGE_TEAM_SUCCESS_MESSAGE');

                          // close popup
                          response.handler.hide();

                          // reload data
                          this.needsRefreshList(true);
                        });
                    });
                }
              },
              visible: (item: FollowUpModel): boolean => {
                return !item.deleted &&
                  item.person?.type !== EntityType.CASE &&
                  item.person?.type !== EntityType.CONTACT_OF_CONTACT &&
                  this.selectedOutbreakIsActive &&
                  FollowUpModel.canModify(this.authUser);
              }
            },

            // Divider
            {
              visible: (item: FollowUpModel) => {
                return !item.deleted &&
                  this.selectedOutbreakIsActive &&
                  FollowUpModel.canModify(this.authUser) &&
                  FollowUpModel.canList(this.authUser);
              }
            },

            // View follow-ups
            {
              label: {
                get: (item: FollowUpModel) => this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_LIST_FOLLOW_UPS_VIEW_PERSON_FOLLOW_UPS_FORM_BUTTON', { name: item.person.name })
              },
              action: {
                link: (item: FollowUpModel): string[] => {
                  return ['/contacts', 'contact-related-follow-ups', item.personId];
                }
              },
              visible: (item: FollowUpModel): boolean => {
                return !item.deleted &&
                  FollowUpModel.canList(this.authUser);
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * Initialize side table columns
   */
  protected initializeTableColumns(): void {
    // address model used to search by phone number, address line, postal code, city....
    const filterAddressModel: AddressModel = new AddressModel({
      geoLocationAccurate: ''
    });

    // default table columns
    this.tableColumns = [
      {
        field: 'contact.lastName',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT_LAST_NAME',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.case.visibleMandatoryKey,
          'lastName'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          'lastName'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contactOfContact.visibleMandatoryKey,
          'lastName'
        ),
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        format: {
          type: 'person.lastName'
        },
        filter: {
          // NO relationshipKey because we want to filter using the aggregate function that has all person types (cases, contacts and contacts of contacts), if we use relationshipKey it will filter only for contacts..cases and contacts of contacts will be ignored
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        },
        link: (item: FollowUpModel) => {
          return item.person && (
            (
              item.person.type === EntityType.CASE &&
              CaseModel.canView(this.authUser)
            ) || (
              item.person.type === EntityType.CONTACT &&
              ContactModel.canView(this.authUser)
            ) || (
              item.person.type === EntityType.CONTACT_OF_CONTACT &&
              ContactOfContactModel.canView(this.authUser)
            )
          ) && !item.person.deleted ?
            EntityModel.getPersonLink(item.person) :
            undefined;
        }
      },
      {
        field: 'contact.firstName',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT_FIRST_NAME',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.case.visibleMandatoryKey,
          'firstName'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          'firstName'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contactOfContact.visibleMandatoryKey,
          'firstName'
        ),
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        format: {
          type: 'person.firstName'
        },
        filter: {
          // NO relationshipKey because we want to filter using the aggregate function that has all person types (cases, contacts and contacts of contacts), if we use relationshipKey it will filter only for contacts..cases and contacts of contacts will be ignored
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        },
        link: (item: FollowUpModel) => {
          return item.person && (
            (
              item.person.type === EntityType.CASE &&
              CaseModel.canView(this.authUser)
            ) || (
              item.person.type === EntityType.CONTACT &&
              ContactModel.canView(this.authUser)
            ) || (
              item.person.type === EntityType.CONTACT_OF_CONTACT &&
              ContactOfContactModel.canView(this.authUser)
            )
          ) && !item.person.deleted ?
            EntityModel.getPersonLink(item.person) :
            undefined;
        }
      },
      {
        field: 'contact.visualId',
        label: 'LNG_CONTACT_FIELD_LABEL_VISUAL_ID',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.case.visibleMandatoryKey,
          'visualId'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          'visualId'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contactOfContact.visibleMandatoryKey,
          'visualId'
        ),
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        format: {
          type: 'person.visualId'
        },
        filter: {
          // NO relationshipKey because we want to filter using the aggregate function that has all person types (cases, contacts and contacts of contacts), if we use relationshipKey it will filter only for contacts..cases and contacts of contacts will be ignored
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'contact.gender',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT_GENDER',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.case.visibleMandatoryKey,
          'gender'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          'gender'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contactOfContact.visibleMandatoryKey,
          'gender'
        ),
        sortable: true,
        format: {
          type: (item) => item.person?.gender && (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[item.person.gender] ?
            this.personAndRelatedHelperService.i18nService.instant((this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[item.person.gender].value) :
            '—'
        },
        filter: {
          // NO relationshipKey because we want to filter using the aggregate function that has all person types (cases, contacts and contacts of contacts), if we use relationshipKey it will filter only for contacts..cases and contacts of contacts will be ignored
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          includeNoValue: true
        }
      },
      {
        field: 'contact.occupation',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT_OCCUPATION',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.case.visibleMandatoryKey,
          'occupation'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          'occupation'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contactOfContact.visibleMandatoryKey,
          'occupation'
        ),
        sortable: true,
        format: {
          type: (item) => item.person?.occupation && (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[item.person.occupation] ?
            this.personAndRelatedHelperService.i18nService.instant((this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[item.person.occupation].value) :
            '—'
        },
        filter: {
          // NO relationshipKey because we want to filter using the aggregate function that has all person types (cases, contacts and contacts of contacts), if we use relationshipKey it will filter only for contacts..cases and contacts of contacts will be ignored
          type: V2FilterType.MULTIPLE_SELECT,
          options: this.referenceDataHelperService.filterPerOutbreakOptions(
            this.selectedOutbreak,
            (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            undefined
          ),
          includeNoValue: true
        }
      },
      {
        field: 'date',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.followUp.visibleMandatoryKey,
          'date'
        ),
        sortable: true,
        format: {
          type: V2ColumnFormat.DATE
        },
        filter: {
          type: V2FilterType.DATE_RANGE,
          value: this._workloadData?.date ?
            {
              startDate: LocalizationHelper.toMoment(this._workloadData.date).startOf('day'),
              endDate: LocalizationHelper.toMoment(this._workloadData.date).endOf('day')
            } : {
              startDate: LocalizationHelper.today(),
              endDate: LocalizationHelper.now().endOf('day')
            },
          defaultValue: this._workloadData?.date ?
            {
              startDate: LocalizationHelper.toMoment(this._workloadData.date).startOf('day'),
              endDate: LocalizationHelper.toMoment(this._workloadData.date).endOf('day')
            } : {
              startDate: LocalizationHelper.today(),
              endDate: LocalizationHelper.now().endOf('day')
            },
          search: (column) => {
            const startDate = (column.filter as IV2FilterDate).value.startDate;
            const endDate = (column.filter as IV2FilterDate).value.endDate;

            if (startDate) {
              this.printFollowUpsDialogExtraAPIData = {
                startDate: LocalizationHelper.toMoment((column.filter as IV2FilterDate).value.startDate).startOf('day'),
                endDate: LocalizationHelper.toMoment((column.filter as IV2FilterDate).value.startDate).endOf('day')
              };
            }

            // cleanup
            this.queryBuilder.filter.removePathCondition('or.date');

            // generate query
            let operator: string;
            let valueToCompare: any;
            if (startDate && endDate) {
              operator = 'between';
              valueToCompare = [
                LocalizationHelper.toMoment(startDate).startOf('day'),
                LocalizationHelper.toMoment(endDate).endOf('day')
              ];
            } else if (startDate && endDate === null) {
              operator = 'gte';
              valueToCompare = LocalizationHelper.toMoment(startDate).startOf('day');
            } else if (startDate === null && endDate) {
              operator = 'lte';
              valueToCompare = LocalizationHelper.toMoment(endDate).endOf('day');
            }

            // filter
            if (startDate || endDate) {
              this.queryBuilder.filter.where({
                or: [
                  {
                    date: {
                      [operator]: valueToCompare
                    }
                  }]
              });
            }

            // refresh
            this.needsRefreshList();
          }
        }
      },
      {
        field: 'statuses',
        label: 'LNG_COMMON_LABEL_STATUSES',
        visibleMandatoryIf: () => true,
        format: {
          type: V2ColumnFormat.STATUS
        },
        notResizable: true,
        pinned: true,
        legends: [
          // status
          {
            title: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
            items: (this.activatedRoute.snapshot.data.dailyFollowUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).list.map((item) => {
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
        forms: (_column, data: FollowUpModel): V2ColumnStatusForm[] => this.personAndRelatedHelperService.followUp.getStatusForms({
          item: data,
          dailyFollowUpStatus: this.activatedRoute.snapshot.data.dailyFollowUpStatus
        })
      },
      {
        field: 'teamId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_TEAM',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.followUp.visibleMandatoryKey,
          'teamId'
        ),
        format: {
          type: (item: FollowUpModel) => {
            return item.teamId && this.activatedRoute.snapshot.data.team.map[item.teamId] ?
              this.activatedRoute.snapshot.data.team.map[item.teamId].name :
              '';
          }
        },
        link: (item: FollowUpModel) => {
          return item.teamId &&
            TeamModel.canView(this.activatedRoute.snapshot.data.authUser) &&
            this.activatedRoute.snapshot.data.team.map[item.teamId] ?
            `/teams/${ item.teamId }/view` :
            undefined;
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: this.activatedRoute.snapshot.data.team.options,
          includeNoValue: true,
          value: this._workloadData?.team ?
            [this._workloadData.team] :
            (
              this._workloadData?.team !== undefined ?
                [AppFormSelectMultipleV2Component.HAS_NO_VALUE] :
                undefined
            ),
          defaultValue: this._workloadData?.team ?
            [this._workloadData.team] :
            (
              this._workloadData?.team !== undefined ?
                [AppFormSelectMultipleV2Component.HAS_NO_VALUE] :
                undefined
            )
        }
      },
      {
        field: 'statusId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.followUp.visibleMandatoryKey,
          'statusId'
        ),
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.dailyFollowUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          value: this._workloadData?.status?.length > 0 ?
            this._workloadData.status :
            undefined,
          defaultValue: this._workloadData?.status?.length > 0 ?
            this._workloadData.status :
            undefined
        }
      },
      {
        field: 'targeted',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_TARGETED',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.followUp.visibleMandatoryKey,
          'targeted'
        ),
        sortable: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.BOOLEAN,
          value: '',
          defaultValue: ''
        }
      },
      {
        field: 'area',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_AREA',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.followUp.visibleMandatoryKey,
          'address.locationId'
        ),
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
          return data.address?.location?.name && LocationModel.canView(this.authUser) ?
            `/locations/${ data.address.location.id }/view` :
            undefined;
        }
      },
      {
        field: 'phoneNumber',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_PHONE_NUMBER',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.followUp.visibleMandatoryKey,
          'address.phoneNumber'
        ),
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
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.followUp.visibleMandatoryKey,
          'address.emailAddress'
        ),
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
        field: 'contact.dateOfLastContact',
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT',
        visibleMandatoryIf: () => true,
        sortable: true,
        format: {
          type: (item) => item.person?.dateOfLastContact ?
            LocalizationHelper.displayDate(item.person.dateOfLastContact) :
            '—'
        },
        filter: {
          // NO relationshipKey because we want to filter using the aggregate function that has all person types (cases, contacts and contacts of contacts), if we use relationshipKey it will filter only for contacts..cases and contacts of contacts will be ignored
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'contact.followUp.endDate',
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_END_OF_FOLLOWUP',
        visibleMandatoryIf: () => true,
        sortable: true,
        format: {
          type: (item) => item.person?.followUp?.endDate ?
            LocalizationHelper.displayDate(item.person.followUp.endDate) :
            '—'
        },
        filter: {
          // NO relationshipKey because we want to filter using the aggregate function that has all person types (cases, contacts and contacts of contacts), if we use relationshipKey it will filter only for contacts..cases and contacts of contacts will be ignored
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'contact.age',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          'ageDob'
        ),
        format: {
          type: V2ColumnFormat.AGE,
          value: (item) => item.person?.age
        },
        filter: {
          type: V2FilterType.AGE_RANGE,
          min: 0,
          max: Constants.DEFAULT_AGE_MAX_YEARS
        }
      },
      {
        field: 'contact.dob',
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_BIRTH',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.case.visibleMandatoryKey,
          'ageDob'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          'ageDob'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contactOfContact.visibleMandatoryKey,
          'ageDob'
        ),
        sortable: true,
        format: {
          type: V2ColumnFormat.DATE,
          value: (item) => item.person?.dob
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'contact.riskLevel',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT_RISK_LEVEL',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.case.visibleMandatoryKey,
          'riskLevel'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          'riskLevel'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contactOfContact.visibleMandatoryKey,
          'riskLevel'
        ),
        sortable: true,
        notVisible: true,
        format: {
          type: (item) => item.person?.riskLevel && (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[item.person.riskLevel] ?
            this.personAndRelatedHelperService.i18nService.instant((this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[item.person.riskLevel].value) :
            '—'
        },
        filter: {
          // NO relationshipKey because we want to filter using the aggregate function that has all person types (cases, contacts and contacts of contacts), if we use relationshipKey it will filter only for contacts..cases and contacts of contacts will be ignored
          type: V2FilterType.MULTIPLE_SELECT,
          options: this.referenceDataHelperService.filterPerOutbreakOptions(
            this.selectedOutbreak,
            (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            undefined
          ),
          includeNoValue: true
        }
      },
      {
        field: 'index',
        label: 'LNG_CONTACT_FIELD_LABEL_DAY_OF_FOLLOWUP',
        visibleMandatoryIf: () => true,
        sortable: true,
        filter: {
          type: V2FilterType.NUMBER_RANGE,
          min: 0
        }
      },
      {
        field: 'address.addressLine1',
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.followUp.visibleMandatoryKey,
          'address.addressLine1'
        ),
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
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.followUp.visibleMandatoryKey,
          'address.city'
        ),
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
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.followUp.visibleMandatoryKey,
          'address.geoLocation'
        ),
        notVisible: true,
        format: {
          type: 'address.geoLocation.lat'
        }
      },
      {
        field: 'address.geoLocation.lng',
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LNG',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.followUp.visibleMandatoryKey,
          'address.geoLocation'
        ),
        notVisible: true,
        format: {
          type: 'address.geoLocation.lng'
        }
      },
      {
        field: 'address.postalCode',
        label: 'LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.followUp.visibleMandatoryKey,
          'address.postalCode'
        ),
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
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS_MANUAL_COORDINATES',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.followUp.visibleMandatoryKey,
          'address.geoLocationAccurate'
        ),
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
          options: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options,
          defaultValue: ''
        }
      },
      {
        field: 'responsibleUserId',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_RESPONSIBLE_USER_ID',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.followUp.visibleMandatoryKey,
          'responsibleUserId'
        ),
        notVisible: true,
        format: {
          type: 'responsibleUser.nameAndEmail'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true,
          value: this._workloadData?.user ?
            [this._workloadData.user] :
            (
              this._workloadData?.user !== undefined ?
                [AppFormSelectMultipleV2Component.HAS_NO_VALUE] :
                undefined
            ),
          defaultValue: this._workloadData?.user ?
            [this._workloadData.user] :
            (
              this._workloadData?.user !== undefined ?
                [AppFormSelectMultipleV2Component.HAS_NO_VALUE] :
                undefined
            )
        },
        link: (data) => {
          return data.responsibleUserId && UserModel.canView(this.authUser) && !data.responsibleUser?.deleted ?
            `/users/${ data.responsibleUserId }/view` :
            undefined;
        },
        exclude: (): boolean => {
          return !UserModel.canListForFilters(this.authUser);
        }
      },
      {
        field: 'createdAs',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_AS',
        visibleMandatoryIf: () => true,
        notVisible: true,
        format: {
          type: (data) => data.createdAs ?
            this.personAndRelatedHelperService.i18nService.instant(data.createdAs) :
            ''
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.followUpCreatedAs as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'deleted',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_DELETED',
        visibleMandatoryIf: () => true,
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
        visibleMandatoryIf: () => true,
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
        visibleMandatoryIf: () => true,
        notVisible: true,
        format: {
          type: 'createdByUser.nameAndEmail'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.createdBy && UserModel.canView(this.authUser) && !data.createdByUser?.deleted ?
            `/users/${ data.createdBy }/view` :
            undefined;
        }
      },
      {
        field: 'createdOn',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_ON',
        visibleMandatoryIf: () => true,
        notVisible: true,
        format: {
          type: (item) => item.createdOn ?
            this.personAndRelatedHelperService.i18nService.instant(`LNG_PLATFORM_LABEL_${item.createdOn}`) :
            item.createdOn
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.createdOn as IResolverV2ResponseModel<ILabelValuePairModel>).options,
          includeNoValue: true
        },
        sortable: true
      },
      {
        field: 'createdAt',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_CREATED_AT',
        visibleMandatoryIf: () => true,
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
        visibleMandatoryIf: () => true,
        notVisible: true,
        format: {
          type: 'updatedByUser.nameAndEmail'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.updatedBy && UserModel.canView(this.authUser) && !data.updatedByUser?.deleted ?
            `/users/${ data.updatedBy }/view` :
            undefined;
        }
      },
      {
        field: 'updatedAt',
        label: 'LNG_FOLLOW_UP_FIELD_LABEL_UPDATED_AT',
        visibleMandatoryIf: () => true,
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
  }

  /**
   * Initialize process data
   */
  protected initializeProcessSelectedData(): void {
    this.processSelectedData = [
      // all selected records were not deleted ?
      {
        key: 'allNotDeleted',
        shouldProcess: () => FollowUpModel.canBulkDelete(this.authUser) &&
          this.selectedOutbreakIsActive,
        process: (
          dataMap: {
            [id: string]: FollowUpModel
          },
          selected
        ) => {
          // determine if at least one record isn't deleted
          let allNotDeleted: boolean = selected.length > 0;
          for (let index = 0; index < selected.length; index++) {
            // found not deleted ?
            if (dataMap[selected[index]]?.deleted) {
              // at least one not deleted
              allNotDeleted = false;

              // stop
              break;
            }
          }

          // finished
          return allNotDeleted;
        }
      },

      // all selected records were deleted ?
      {
        key: 'allDeleted',
        shouldProcess: () => FollowUpModel.canBulkRestore(this.authUser) &&
          this.selectedOutbreakIsActive,
        process: (
          dataMap: {
            [id: string]: FollowUpModel
          },
          selected
        ) => {
          // determine if at least one record isn't deleted
          let allDeleted: boolean = selected.length > 0;
          for (let index = 0; index < selected.length; index++) {
            // found not deleted ?
            if (!dataMap[selected[index]]?.deleted) {
              // at least one not deleted
              allDeleted = false;

              // stop
              break;
            }
          }

          // finished
          return allDeleted;
        }
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
    this.advancedFilters = this.personAndRelatedHelperService.followUp.generateAdvancedFiltersAggregate(this.selectedOutbreak, {
      options: {
        createdOn: (this.activatedRoute.snapshot.data.createdOn as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        team: this.activatedRoute.snapshot.data.team.options,
        yesNoAll: this.activatedRoute.snapshot.data.yesNoAll.options,
        yesNo: this.activatedRoute.snapshot.data.yesNo.options,
        dailyFollowUpStatus: this.activatedRoute.snapshot.data.dailyFollowUpStatus.options,
        user: this.activatedRoute.snapshot.data.user.options,
        addressType: this.activatedRoute.snapshot.data.addressType.options,
        gender: this.activatedRoute.snapshot.data.gender.options,
        risk: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          this.activatedRoute.snapshot.data.risk.options,
          undefined
        ),
        occupation: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          this.activatedRoute.snapshot.data.occupation.options,
          undefined
        ),
        classification: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          this.activatedRoute.snapshot.data.classification.options,
          undefined
        ),
        outcome: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          this.activatedRoute.snapshot.data.outcome.options,
          undefined
        ),
        followUpCreatedAs: this.activatedRoute.snapshot.data.followUpCreatedAs.options
      }
    });
  }

  /**
   * Initialize table quick actions
   */
  protected initializeQuickActions(): void {
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: (): boolean => {
        return (
          this.selectedOutbreakIsActive && FollowUpModel.canGenerate(this.authUser) &&
          this.selectedOutbreakIsActive
        ) ||
          (!this.appliedListFilter && FollowUpModel.canExportDailyForm(this.authUser)) ||
          (!this.appliedListFilter && FollowUpModel.canExport(this.authUser));
      },
      menuOptions: [
        // generate follow-ups for contacts
        {
          label: {
            get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_GENERATE_FOR_CONTACTS_BUTTON'
          },
          action: {
            click: () => {
              this.generateFollowUps(EntityType.CONTACT);
            }
          },
          visible: () => FollowUpModel.canGenerate(this.authUser) &&
            this.selectedOutbreakIsActive
        },

        // generate follow-ups for cases
        {
          label: {
            get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_GENERATE_FOR_CASES_BUTTON'
          },
          action: {
            click: () => {
              this.generateFollowUps(EntityType.CASE);
            }
          },
          visible: () => FollowUpModel.canGenerate(this.authUser)  &&
            this.selectedOutbreak.allowCasesFollowUp &&
            this.selectedOutbreakIsActive
        },

        // Divider
        {
          visible: () => FollowUpModel.canGenerate(this.authUser) && (
            !this.appliedListFilter && (
              FollowUpModel.canExportDailyForm(this.authUser) ||
              FollowUpModel.canExport(this.authUser)
            )
          )
        },

        // print follow-ups daily form
        {
          label: {
            get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_PRINT_DAILY_FORM_BUTTON'
          },
          action: {
            click: () => {
              // remove date filter since that is applied separately
              const qb: RequestQueryBuilder = new RequestQueryBuilder();
              qb.merge(this.queryBuilder);
              qb.filter.removeDeep('date');

              // print daily follow-up form
              this.personAndRelatedHelperService.dialogV2Service
                .showExportData({
                  title: {
                    get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_PRINT_DAILY_FORM_TITLE'
                  },
                  export: {
                    url: `outbreaks/${ this.selectedOutbreak.id }/contacts/daily-followup-form/export`,
                    async: false,
                    method: ExportDataMethod.GET,
                    fileName: this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_LIST_FOLLOW_UPS_PRINT_DAILY_FORM_FILE_NAME'),
                    queryBuilder: qb,
                    allow: {
                      types: [ExportDataExtension.PDF]
                    },
                    inputs: {
                      append: [
                        {
                          type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
                          name: 'groupBy',
                          placeholder: 'LNG_PAGE_LIST_FOLLOW_UPS_EXPORT_GROUP_BY_BUTTON',
                          options: [
                            (Constants.RANGE_FOLLOW_UP_EXPORT_GROUP_BY.PLACE) as any,
                            (Constants.RANGE_FOLLOW_UP_EXPORT_GROUP_BY.CASE) as any
                          ],
                          value: Constants.RANGE_FOLLOW_UP_EXPORT_GROUP_BY.PLACE.value,
                          validators: {
                            required: () => true
                          }
                        },
                        {
                          type: V2SideDialogConfigInputType.DATE,
                          name: 'date',
                          placeholder: 'LNG_PAGE_LIST_FOLLOW_UPS_PRINT_DATE',
                          value: this.printFollowUpsDialogExtraAPIData.startDate,
                          change: (data: IV2SideDialogData) => {
                            this.printFollowUpsDialogExtraAPIData.startDate = LocalizationHelper.toMoment((data.map.date as IV2SideDialogConfigInputDate).value).startOf('day');
                            this.printFollowUpsDialogExtraAPIData.endDate = LocalizationHelper.toMoment((data.map.date as IV2SideDialogConfigInputDate).value).endOf('day');
                          },
                          validators: {
                            required: () => true
                          }
                        }
                      ]
                    },
                    extraFormData: {
                      append: {
                        date: this.printFollowUpsDialogExtraAPIData
                      }
                    }
                  }
                });
            }
          },
          visible: (): boolean => {
            return !this.appliedListFilter && FollowUpModel.canExportDailyForm(this.authUser);
          }
        },

        // export follow-ups list
        {
          label: {
            get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_EXPORT_BUTTON'
          },
          action: {
            click: () => {
              this.exportFollowUps(this.queryBuilder);
            }
          },
          visible: (): boolean => {
            return !this.appliedListFilter && FollowUpModel.canExport(this.authUser);
          }
        },

        // Divider
        {
          visible: () => FollowUpModel.canGenerate(this.authUser) || (
            !this.appliedListFilter && (
              FollowUpModel.canExportDailyForm(this.authUser) ||
              FollowUpModel.canExport(this.authUser)
            )
          )
        },

        // Display missed follow-ups
        {
          label: {
            get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_SHOW_MISSED_FOLLOW_UPS'
          },
          action: {
            click: () => {
              this.personAndRelatedHelperService.dialogV2Service
                .showSideDialog({
                  // title
                  title: {
                    get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_SHOW_MISSED_FOLLOW_UPS'
                  },

                  // inputs
                  inputs: [
                    {
                      type: V2SideDialogConfigInputType.DATE,
                      name: 'date',
                      placeholder: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE',
                      value: undefined,
                      validators: {
                        required: () => true
                      }
                    }, {
                      type: V2SideDialogConfigInputType.NUMBER,
                      name: 'displayMissedFollowUpsNoDays',
                      placeholder: 'LNG_PAGE_LIST_FOLLOW_UPS_LABEL_SHOW_MISSED_FOLLOW_UPS_NO_DAYS',
                      value: undefined,
                      validators: {
                        required: () => true
                      }
                    }
                  ],

                  // buttons
                  bottomButtons: [
                    // yes button
                    {
                      label: 'LNG_COMMON_BUTTON_APPLY',
                      type: IV2SideDialogConfigButtonType.OTHER,
                      color: 'primary',
                      disabled: (_data, handler): boolean => {
                        return !handler.form || handler.form.invalid;
                      }
                    },

                    // cancel button
                    {
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

                  // cleanup
                  this.queryBuilder.filter.removeDeep('date');
                  this.queryBuilder.filter.removeDeep('statusId');

                  // get data
                  const date = (response.data.map.date as IV2SideDialogConfigInputDate).value;
                  const dateColumn = this.tableColumns.find((column) => column.field === 'date');

                  // set date column filter
                  (dateColumn.filter.value as IV2DateRange) = {
                    startDate: undefined,
                    endDate: undefined
                  };

                  // filter
                  this.queryBuilder.filter.where({
                    or: [{
                      date: {
                        between: [
                          LocalizationHelper.toMoment(date).startOf('day'),
                          LocalizationHelper.toMoment(date).endOf('day')
                        ]
                      }
                    }, {
                      statusId: {
                        inq: [
                          'LNG_REFERENCE_DATA_CONTACT_DAILY_FOLLOW_UP_STATUS_TYPE_NOT_PERFORMED',
                          'LNG_REFERENCE_DATA_CONTACT_DAILY_FOLLOW_UP_STATUS_TYPE_MISSED',
                          'LNG_REFERENCE_DATA_CONTACT_DAILY_FOLLOW_UP_STATUS_TYPE_NOT_ATTEMPTED'
                        ]
                      },
                      date: {
                        between: [
                          LocalizationHelper.toMoment(date).add(-(response.data.map.displayMissedFollowUpsNoDays as IV2SideDialogConfigInputNumber).value, 'days').startOf('day'),
                          LocalizationHelper.toMoment(date).endOf('day')
                        ]
                      }
                    }]
                  });

                  // refresh
                  this.needsRefreshList(true);

                  // force table refresh columns
                  this.tableV2Component.updateColumnDefinitions();

                  // close dialog
                  response.handler.hide();
                });
            }
          }
        }
      ]
    };
  }

  /**
   * Initialize table group actions
   */
  protected initializeGroupActions(): void {
    this.groupActions = {
      type: V2ActionType.GROUP_ACTIONS,
      visible: () =>
        (
          FollowUpModel.canBulkModify(this.authUser) &&
          this.selectedOutbreakIsActive
        ) ||
        FollowUpModel.canExport(this.authUser) ||
        (
          (
            FollowUpModel.canBulkDelete(this.authUser) ||
            FollowUpModel.canBulkRestore(this.authUser)
          ) &&
          this.selectedOutbreakIsActive
        ),
      actions: [
        // bulk modify
        {
          label: {
            get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_GROUP_ACTION_MODIFY_SELECTED_FOLLOW_UPS'
          },
          tooltip: (selected: string[]) => selected.length > 0 && !this.tableV2Component.processedSelectedResults.allNotDeleted ?
            this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_LIST_FOLLOW_UPS_GROUP_ACTION_DELETE_SELECTED_FOLLOW_UPS_DESCRIPTION') :
            undefined,
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
            return FollowUpModel.canBulkModify(this.authUser) &&
              this.selectedOutbreakIsActive;
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1 ||
              !this.tableV2Component.processedSelectedResults.allNotDeleted;
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

              // allow deleted records
              qb.includeDeleted();

              // keep sort order
              if (!this.queryBuilder.sort.isEmpty()) {
                qb.sort.criterias = {
                  ...this.queryBuilder.sort.criterias
                };
              }

              // export
              this.exportFollowUps(qb);
            }
          },
          visible: (): boolean => {
            return FollowUpModel.canExport(this.authUser);
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
          }
        },

        // Divider
        {
          visible: () => (
            (
              FollowUpModel.canBulkModify(this.authUser) &&
              this.selectedOutbreakIsActive
            ) ||
            FollowUpModel.canExport(this.authUser)
          ) && (
            (
              FollowUpModel.canBulkDelete(this.authUser) ||
              FollowUpModel.canBulkRestore(this.authUser)
            ) &&
            this.selectedOutbreakIsActive
          )
        },

        // bulk delete
        {
          label: {
            get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_GROUP_ACTION_DELETE_SELECTED_FOLLOW_UPS'
          },
          cssClasses: () => 'gd-list-table-selection-header-button-warning',
          tooltip: (selected: string[]) => selected.length > 0 && !this.tableV2Component.processedSelectedResults.allNotDeleted ?
            this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_LIST_FOLLOW_UPS_GROUP_ACTION_DELETE_SELECTED_FOLLOW_UPS_DESCRIPTION') :
            undefined,
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
              this.personAndRelatedHelperService.dialogV2Service
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
                  const loading = this.personAndRelatedHelperService.dialogV2Service.showLoadingDialog();

                  // delete follow-ups
                  this.personAndRelatedHelperService.followUp.followUpsDataService
                    .deleteBulkFollowUps(this.selectedOutbreak.id, qb)
                    .pipe(
                      catchError((err) => {
                        this.personAndRelatedHelperService.toastV2Service.error(err);

                        // hide loading
                        loading.close();

                        return throwError(err);
                      })
                    )
                    .subscribe(() => {
                      this.personAndRelatedHelperService.toastV2Service.success('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_DELETE_SELECTED_FOLLOW_UPS_SUCCESS_MESSAGE');

                      // hide loading
                      loading.close();

                      this.needsRefreshList(true);
                    });
                });
            }
          },
          visible: (): boolean => {
            return FollowUpModel.canBulkDelete(this.authUser) &&
              this.selectedOutbreakIsActive;
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1 ||
              !this.tableV2Component.processedSelectedResults.allNotDeleted;
          }
        },

        // bulk restore
        {
          label: {
            get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_GROUP_ACTION_RESTORE_SELECTED_FOLLOW_UPS'
          },
          cssClasses: () => 'gd-list-table-selection-header-button-warning',
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
              this.personAndRelatedHelperService.dialogV2Service
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
                  const loading = this.personAndRelatedHelperService.dialogV2Service.showLoadingDialog();

                  // restore follow-ups
                  this.personAndRelatedHelperService.followUp.followUpsDataService
                    .restoreBulkFollowUps(this.selectedOutbreak.id, qb)
                    .pipe(
                      catchError((err) => {
                        this.personAndRelatedHelperService.toastV2Service.error(err);

                        // hide loading
                        loading.close();

                        return throwError(err);
                      })
                    )
                    .subscribe(() => {
                      this.personAndRelatedHelperService.toastV2Service.success('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_RESTORE_SELECTED_FOLLOW_UPS_SUCCESS_MESSAGE');

                      // hide loading
                      loading.close();

                      this.needsRefreshList(true);
                    });
                });
            }
          },
          visible: (): boolean => {
            return FollowUpModel.canBulkRestore(this.authUser) &&
              this.selectedOutbreakIsActive;
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1 ||
              !this.tableV2Component.processedSelectedResults.allDeleted;
          }
        }
      ]
    };
  }

  /**
   * Initialize table add action
   */
  protected initializeAddAction(): void {}

  /**
   * Initialize table grouped data
   */
  protected initializeGroupedData(): void {
    this.groupedData = {
      label: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_SHOW_GROUP_BY_TEAM_PILLS',
      click: (
        item,
        group
      ) => {
        // no need to refresh group
        group.data.blockNextGet = true;

        // remove previous conditions
        this.queryBuilder.filter.removePathCondition('teamId');
        this.queryBuilder.filter.removePathCondition('or.teamId');

        // filter by group data
        if (!item) {
          this.queryBuilder.filter.byEquality(
            'teamId',
            null
          );
        } else if (item.label === 'LNG_PAGE_LIST_FOLLOW_UPS_NO_TEAM_LABEL') {
          // clear
          this.queryBuilder.filter.byNotHavingValue(
            'teamId',
            true
          );
        } else {
          // search
          this.queryBuilder.filter.byEquality(
            'teamId',
            item.data
          );
        }

        // refresh
        this.needsRefreshList();
      },
      data: {
        loading: false,
        values: [],
        get: (
          gData: IV2GroupedData,
          refreshUI: () => void
        ) => {
          // loading data
          gData.data.loading = true;

          // clone queryBuilder to clear it
          const clonedQueryBuilder = _.cloneDeep(this.queryBuilder);
          clonedQueryBuilder.paginator.clear();
          clonedQueryBuilder.sort.clear();
          clonedQueryBuilder.clearFields();

          // remove any classification filters so we see all options
          clonedQueryBuilder.filter.remove('teamId');
          clonedQueryBuilder.filter.removePathCondition('or.teamId');

          // load data
          return this.personAndRelatedHelperService.followUp.followUpsDataService
            .getCountedFollowUpsGroupedByTeams(
              this.selectedOutbreak.id,
              clonedQueryBuilder
            )
            .pipe(
              // should be the last pipe
              takeUntil(this.destroyed$)
            )
            .subscribe((countResponse) => {
              // group data
              const values: {
                label: string,
                value: number,
                data: any
              }[] = [];
              Object.keys(countResponse.team || {}).forEach((teamId) => {
                let teamLabel;
                if ((this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).map[teamId]) {
                  teamLabel = (this.activatedRoute.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).map[teamId].name;
                } else if (teamId === '') {
                  teamLabel = 'LNG_PAGE_LIST_FOLLOW_UPS_NO_TEAM_LABEL';
                } else {
                  teamLabel = '—';
                }

                // add to teams
                values.push({
                  label: teamLabel,
                  value: countResponse.team[teamId].count,
                  data: teamId
                });
              });


              // set data
              gData.data.values = values.map((item) => {
                return {
                  label: item.label,
                  bgColor: Constants.DEFAULT_BACKGROUND_COLOR_NODES_CHAINS,
                  textColor: Constants.DEFAULT_COLOR_CHAINS,
                  value: item.value.toLocaleString('en'),
                  data: item.data
                };
              });

              // finished loading data
              gData.data.loading = false;

              // refresh ui
              refreshUI();
            });
        }
      }
    };
  }

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs(): void {
    // set breadcrumbs
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

    // add case / contact breadcrumbs
    if (!this.entityData) {
      // add team/user workload page if necessary
      if (this._workloadData) {
        if (
          this._workloadData.user !== undefined &&
          UserModel.canListWorkload(this.authUser)
        ) {
          // add user workload page
          this.breadcrumbs.push({
            label: 'LNG_PAGE_USERS_WORKLOAD_TITLE',
            action: {
              link: ['/users/workload']
            }
          });
        } else if (TeamModel.canListWorkload(this.authUser)) {
          // add team workload page
          this.breadcrumbs.push({
            label: 'LNG_PAGE_TEAMS_WORKLOAD_TITLE',
            action: {
              link: ['/teams/workload']
            }
          });
        }
      }

      // list contacts
      if (ContactModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
          action: {
            link: ['/contacts']
          }
        });
      }

      // current page
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_FOLLOW_UPS_TITLE',
        action: null
      });
    } else if (this.entityData.type === EntityType.CONTACT_OF_CONTACT) {
      // contacts of contacts list
      if (ContactOfContactModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
          action: {
            link: ['/contacts-of-contacts']
          }
        });
      }

      // contact of contact view
      if (ContactOfContactModel.canView(this.authUser)) {
        this.breadcrumbs.push({
          label: this.entityData.name,
          action: {
            link: [`/contacts-of-contacts/${this.entityData.id}/view`]
          }
        });
      }

      // current page
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_FOLLOW_UPS_FOR_RELATED_CONTACTS_TITLE',
        action: null
      });
    } else if (this.entityData.type === EntityType.CASE) {
      // cases list
      if (CaseModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_CASES_TITLE',
          action: {
            link: ['/cases']
          }
        });
      }

      // case view
      if (CaseModel.canView(this.authUser)) {
        this.breadcrumbs.push({
          label: this.entityData.name,
          action: {
            link: [`/cases/${this.entityData.id}/view`]
          }
        });
      }

      // current page
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_FOLLOW_UPS_FOR_RELATED_CONTACTS_TITLE',
        action: null
      });
    }
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
   * Refresh list
   */
  refreshList(triggeredByPageChange: boolean) {
    // add case/contact of contact id
    if (this.entityData?.id) {
      this.queryBuilder
        .addChildQueryBuilder(
          this.entityData.type === EntityType.CASE ?
            'case' :
            'contactOfContact'
        ).filter.byEquality('id', this.entityData.id);
    }

    // refresh badges list with applied filter
    if (!triggeredByPageChange) {
      this.initializeGroupedData();
    }

    // retrieve created user & modified user information
    this.queryBuilder.include('createdByUser', true);
    this.queryBuilder.include('updatedByUser', true);

    // retrieve responsible user information
    this.queryBuilder.include('responsibleUser', true);

    // retrieve the list of Follow Ups
    this.records$ = this.personAndRelatedHelperService.followUp.followUpsDataService
      .getFollowUpsList(this.selectedOutbreak.id, this.queryBuilder)
      .pipe(
        map((followUps: FollowUpModel[]) => {
          return this.personAndRelatedHelperService.followUp.determineAlertness(
            this.selectedOutbreak.contactFollowUpTemplate,
            followUps
          );
        })
      );
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(applyHasMoreLimit?: boolean) {
    // reset
    this.pageCount = undefined;

    // set apply value
    if (applyHasMoreLimit !== undefined) {
      this.applyHasMoreLimit = applyHasMoreLimit;
    }

    // include related people in response
    const qb = new RequestQueryBuilder();
    qb.merge(this.queryBuilder);

    // add case/contact of contact id
    if (this.entityData?.id) {
      qb.addChildQueryBuilder(
        this.entityData.type === EntityType.CASE ?
          'case' :
          'contactOfContact'
      ).filter.byEquality('id', this.entityData.id);
    }

    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(qb);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();
    countQueryBuilder.clearFields();

    // apply has more limit
    if (this.applyHasMoreLimit) {
      countQueryBuilder.flag(
        'applyHasMoreLimit',
        true
      );
    }

    // count
    this.personAndRelatedHelperService.followUp.followUpsDataService
      .getFollowUpsCount(this.selectedOutbreak.id, countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.personAndRelatedHelperService.toastV2Service.error(err);
          return throwError(err);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      )
      .subscribe((response) => {
        this.pageCount = response;
      });
  }

  /**
   * Generate Follow Ups for contacts/cases
   */
  generateFollowUps(personType: EntityType.CASE | EntityType.CONTACT) {
    // default followUpDate
    // - use "today" if contact tracing should start with the date of the last contact
    // - otherwise, use "tomorrow"
    const followUpDate: Moment = this.selectedOutbreak.generateFollowUpsDateOfLastContact ?
      LocalizationHelper.today() :
      LocalizationHelper.today().add(1, 'days');
    this.personAndRelatedHelperService.dialogV2Service.showSideDialog({
      // title
      title: {
        get: () => personType === EntityType.CASE ?
          'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_FOR_CASES_DIALOG_TITLE' :
          'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_FOR_CONTACTS_DIALOG_TITLE'
      },

      // inputs
      inputs: [
        {
          type: V2SideDialogConfigInputType.DATE_RANGE,
          name: 'dates',
          value: {
            startDate: followUpDate.startOf('day').format(),
            endDate: followUpDate.endOf('day').format()
          },
          validators: {
            required: () => true
          }
        },
        {
          type: V2SideDialogConfigInputType.TOGGLE_CHECKBOX,
          placeholder: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_DIALOG_TARGETED_LABEL',
          name: 'targeted',
          value: true
        },
        {
          type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
          placeholder: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_DIALOG_OVERWRITE_EXISTING_LABEL',
          name: 'overwriteExistingFollowUps',
          tooltip: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_DIALOG_OVERWRITE_EXISTING_LABEL_DESCRIPTION',
          options: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
          clearable: false,
          value: (
            personType === EntityType.CASE ?
              this.selectedOutbreak.generateFollowUpsOverwriteExistingCases :
              this.selectedOutbreak.generateFollowUpsOverwriteExisting
          ) as unknown as string,
          validators: {
            required: () => true
          }
        },
        {
          type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
          placeholder: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_DIALOG_KEEP_TEAM_ASSIGNMENT_LABEL',
          name: 'keepTeamAssignment',
          tooltip: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_DIALOG_KEEP_TEAM_ASSIGNMENT_LABEL_DESCRIPTION',
          options: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
          clearable: false,
          value: (
            personType === EntityType.CASE ?
              this.selectedOutbreak.generateFollowUpsKeepTeamAssignmentCases :
              this.selectedOutbreak.generateFollowUpsKeepTeamAssignment
          ) as unknown as string,
          validators: {
            required: () => true
          },
          visible: (dialogFieldsValues: any): boolean => {
            return !dialogFieldsValues.overwriteExistingFollowUps;
          },
          disabled: (data) => {
            return !!(data.map.overwriteExistingFollowUps as IV2SideDialogConfigInputSingleDropdown).value;
          }
        },
        {
          type: V2SideDialogConfigInputType.TEXT,
          name: 'intervalOfFollowUp',
          placeholder: 'LNG_OUTBREAK_FIELD_LABEL_INTERVAL_OF_FOLLOW_UPS',
          tooltip: 'LNG_OUTBREAK_FIELD_LABEL_INTERVAL_OF_FOLLOW_UPS_DESCRIPTION',
          value: personType === EntityType.CASE ?
            this.selectedOutbreak.intervalOfFollowUpCases :
            this.selectedOutbreak.intervalOfFollowUp,
          validators: {
            regex: () => ({
              expression: '^\\s*([1-9][0-9]*)(\\s*,\\s*([1-9][0-9]*))*$'
            })
          }
        }
      ],

      // buttons
      bottomButtons: [
        // yes button
        {
          label: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_DIALOG_YES_BUTTON',
          type: IV2SideDialogConfigButtonType.OTHER,
          color: 'primary',
          key: 'save',
          disabled: (_data, handler): boolean => {
            return !handler.form || handler.form.invalid;
          }
        },
        // cancel button
        {
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

      // close popup
      response.handler.loading.show();

      // generate follow-ups
      this.personAndRelatedHelperService.followUp.followUpsDataService
        .generateFollowUps(
          this.selectedOutbreak.id,
          {
            personType: personType,
            startDate: (response.data.map.dates as IV2SideDialogConfigInputDateRange).value?.startDate,
            endDate: (response.data.map.dates as IV2SideDialogConfigInputDateRange).value?.endDate,
            targeted: (response.data.map.targeted as IV2SideDialogConfigInputToggleCheckbox).value as unknown as boolean,
            overwriteExistingFollowUps: (response.data.map.overwriteExistingFollowUps as IV2SideDialogConfigInputSingleDropdown).value as unknown as boolean,
            keepTeamAssignment: (response.data.map.keepTeamAssignment as IV2SideDialogConfigInputSingleDropdown).value as unknown as boolean,
            intervalOfFollowUp: (response.data.map.intervalOfFollowUp as IV2SideDialogConfigInputText).value
          }
        )
        .pipe(
          catchError((err) => {
            this.personAndRelatedHelperService.toastV2Service.error(err);
            return throwError(err);
          })
        )
        .subscribe(() => {
          // success message
          this.personAndRelatedHelperService.toastV2Service.success('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_SUCCESS_MESSAGE');

          // close popup
          response.handler.hide();

          // refresh list
          this.needsRefreshList(true);
        });
    });
  }

  /**
  * Export follow-ups
  */
  private exportFollowUps(qb: RequestQueryBuilder) {
    this.personAndRelatedHelperService.dialogV2Service
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
                this.personAndRelatedHelperService.toastV2Service.error(err);

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
                  url: `outbreaks/${ this.selectedOutbreak.id }/follow-ups/export`,
                  async: true,
                  method: ExportDataMethod.POST,
                  fileName: `${ this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_LIST_FOLLOW_UPS_TITLE') } - ${ LocalizationHelper.displayDate(LocalizationHelper.now()) }`,
                  queryBuilder: qb,
                  allow: {
                    types: [
                      ExportDataExtension.CSV,
                      ExportDataExtension.XLS,
                      ExportDataExtension.XLSX,
                      ExportDataExtension.JSON,
                      ExportDataExtension.ODS,
                      ExportDataExtension.PDF
                    ],
                    encrypt: true,
                    anonymize: {
                      fields: this.followUpFields
                    },
                    groups: {
                      fields: followUpFieldGroups,
                      required: followUpFieldGroupsRequires,
                      change: (data, handler) => {
                        // do we need to de-select include created and updated by user data ?
                        const includeCreatedByUserDataCheckbox: IV2SideDialogConfigInputCheckbox = data.map.includeCreatedByUser as IV2SideDialogConfigInputCheckbox;
                        const includeUpdatedByUserDataCheckbox: IV2SideDialogConfigInputCheckbox = data.map.includeUpdatedByUser as IV2SideDialogConfigInputCheckbox;
                        const allGroups: boolean = (data.map.fieldsGroupAll as IV2SideDialogConfigInputCheckbox)?.checked;
                        const fieldsGroupListDropdown: IV2SideDialogConfigInputMultiDropdown = data.map.fieldsGroupList as IV2SideDialogConfigInputMultiDropdown;
                        if (!allGroups) {
                          // determine if it should detect the changes
                          let detectChanges = false;

                          // check created by user
                          if (
                            includeCreatedByUserDataCheckbox?.checked &&
                            (
                              !fieldsGroupListDropdown.values?.length ||
                              fieldsGroupListDropdown.values.indexOf(Constants.EXPORT_GROUP.RELATIONSHIPS_DATA) < 0
                            )
                          ) {
                            // de-select include created by data
                            includeCreatedByUserDataCheckbox.checked = false;
                            detectChanges = true;
                          }

                          // check updated by user
                          if (
                            includeUpdatedByUserDataCheckbox?.checked &&
                            (
                              !fieldsGroupListDropdown.values?.length ||
                              fieldsGroupListDropdown.values.indexOf(Constants.EXPORT_GROUP.RELATIONSHIPS_DATA) < 0
                            )
                          ) {
                            // de-select include updated by data
                            includeUpdatedByUserDataCheckbox.checked = false;
                            detectChanges = true;
                          }

                          // detect changes ?
                          if (detectChanges) {
                            handler.detectChanges();
                          }
                        }
                      }
                    },
                    fields: {
                      options: this.followUpFields,
                      change: (data, handler) => {
                        // do we need to de-select include created and updated by user data ?
                        const includeCreatedByUserDataCheckbox: IV2SideDialogConfigInputCheckbox = data.map.includeCreatedByUser as IV2SideDialogConfigInputCheckbox;
                        const includeUpdatedByUserDataCheckbox: IV2SideDialogConfigInputCheckbox = data.map.includeUpdatedByUser as IV2SideDialogConfigInputCheckbox;
                        const allFields: boolean = (data.map.fieldsAll as IV2SideDialogConfigInputCheckbox)?.checked;
                        const fieldsListDropdown: IV2SideDialogConfigInputMultiDropdown = data.map.fieldsList as IV2SideDialogConfigInputMultiDropdown;
                        if (!allFields) {
                          // determine if it should detect the changes
                          let detectChanges = false;

                          // check created by user
                          if (
                            includeCreatedByUserDataCheckbox?.checked
                            && (
                              !fieldsListDropdown.values?.length ||
                              fieldsListDropdown.values.indexOf(ContactDailyFollowUpsListComponent.CREATED_BY_USER) < 0
                            )
                          ) {
                            // de-select include updated by data
                            includeCreatedByUserDataCheckbox.checked = false;
                            detectChanges = true;
                          }

                          // check updated by user
                          if (
                            includeUpdatedByUserDataCheckbox?.checked
                            && (
                              !fieldsListDropdown.values?.length ||
                              fieldsListDropdown.values.indexOf(ContactDailyFollowUpsListComponent.UPDATED_BY_USER) < 0
                            )
                          ) {
                            // de-select include updated by data
                            includeUpdatedByUserDataCheckbox.checked = false;
                            detectChanges = true;
                          }

                          // detect changes ?
                          if (detectChanges) {
                            handler.detectChanges();
                          }
                        }
                      }
                    },
                    dbColumns: true,
                    dbValues: true,
                    jsonReplaceUndefinedWithNull: true,
                    questionnaireVariables: true
                  },
                  inputs: {
                    append: [
                      {
                        type: V2SideDialogConfigInputType.CHECKBOX,
                        placeholder: 'LNG_COMMON_LABEL_EXPORT_INCLUDE_CREATED_BY_USER',
                        tooltip: 'LNG_COMMON_LABEL_EXPORT_INCLUDE_CREATED_BY_USER_DESCRIPTION',
                        name: 'includeCreatedByUser',
                        checked: false,
                        change: (data, handler) => {
                          this.checkUserDataChanged(data, handler);
                        }
                      }, {
                        type: V2SideDialogConfigInputType.CHECKBOX,
                        placeholder: 'LNG_COMMON_LABEL_EXPORT_INCLUDE_UPDATED_BY_USER',
                        tooltip: 'LNG_COMMON_LABEL_EXPORT_INCLUDE_UPDATED_BY_USER_DESCRIPTION',
                        name: 'includeUpdatedByUser',
                        checked: false,
                        change: (data, handler) => {
                          this.checkUserDataChanged(data, handler);
                        }
                      }, {
                        type: V2SideDialogConfigInputType.CHECKBOX,
                        placeholder: 'LNG_COMMON_LABEL_EXPORT_INCLUDE_ALERTED',
                        tooltip: 'LNG_COMMON_LABEL_EXPORT_INCLUDE_ALERTED_DESCRIPTION',
                        name: 'includeAlerted',
                        checked: false
                      }
                    ]
                  }
                }
              });
            });
        }
      });
  }

  /**
   * Checks if related "created/updated by user" group/fields options should be checked
   */
  private checkUserDataChanged(data: IV2SideDialogData, handler: IV2SideDialogHandler): void {
    // return if no param provided
    if (
      !data ||
      !handler
    ) {
      return;
    }

    // check if we need to make adjustments
    const includeCreatedByUserData: boolean = (data.map.includeCreatedByUser as IV2SideDialogConfigInputCheckbox)?.checked;
    const includeUpdatedByUserData: boolean = (data.map.includeUpdatedByUser as IV2SideDialogConfigInputCheckbox)?.checked;
    if (
      includeCreatedByUserData ||
      includeUpdatedByUserData
    ) {
      // check groups & fields
      const allGroups: boolean = (data.map.fieldsGroupAll as IV2SideDialogConfigInputCheckbox)?.checked;
      const allFields: boolean = (data.map.fieldsAll as IV2SideDialogConfigInputCheckbox)?.checked;
      if (!allGroups) {
        // do we need to select record creation and update data ?
        const fieldsGroupListDropdown: IV2SideDialogConfigInputMultiDropdown = data.map.fieldsGroupList as IV2SideDialogConfigInputMultiDropdown;
        if (fieldsGroupListDropdown) {
          // initialize if necessary
          fieldsGroupListDropdown.values = fieldsGroupListDropdown.values || [];

          // select relationship data since this is necessary
          if (fieldsGroupListDropdown.values.indexOf(Constants.EXPORT_GROUP.RECORD_CREATION_AND_UPDATE_DATA) < 0) {
            // select relationship data
            fieldsGroupListDropdown.values.push(Constants.EXPORT_GROUP.RECORD_CREATION_AND_UPDATE_DATA);
            fieldsGroupListDropdown.values = [...fieldsGroupListDropdown.values];
            handler.detectChanges();
          }
        }
      } else if (!allFields) {
        // do we need to select relationship data ?
        const fieldsListDropdown: IV2SideDialogConfigInputMultiDropdown = data.map.fieldsList as IV2SideDialogConfigInputMultiDropdown;
        if (fieldsListDropdown) {
          // determine if it should detect the changes
          let detectChanges = false;

          // initialize if necessary
          fieldsListDropdown.values = fieldsListDropdown.values || [];

          // select created by user data since this is necessary
          if (
            includeCreatedByUserData &&
            fieldsListDropdown.values.indexOf(ContactDailyFollowUpsListComponent.CREATED_BY_USER) < 0
          ) {
            // select relationship data
            fieldsListDropdown.values.push(ContactDailyFollowUpsListComponent.CREATED_BY_USER);
            fieldsListDropdown.values = [...fieldsListDropdown.values];
            detectChanges = true;
          }

          // select updated by user data since this is necessary
          if (
            includeUpdatedByUserData &&
            fieldsListDropdown.values.indexOf(ContactDailyFollowUpsListComponent.UPDATED_BY_USER) < 0
          ) {
            // select relationship data
            fieldsListDropdown.values.push(ContactDailyFollowUpsListComponent.UPDATED_BY_USER);
            fieldsListDropdown.values = [...fieldsListDropdown.values];
            detectChanges = true;
          }

          // detect changes?
          if (detectChanges) {
            handler.detectChanges();
          }
        }
      }
    }
  }
}
