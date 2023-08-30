import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import * as _ from 'lodash';
import * as moment from 'moment';
import { throwError } from 'rxjs/internal/observable/throwError';
import { catchError, takeUntil } from 'rxjs/operators';
import { RequestQueryBuilder, RequestSortDirection } from '../../../../core/helperClasses/request-query-builder';
import { CaseModel } from '../../../../core/models/case.model';
import { Constants } from '../../../../core/models/constants';
import { ContactModel } from '../../../../core/models/contact.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { EntityType } from '../../../../core/models/entity-type';
import { ExportFieldsGroupModelNameEnum } from '../../../../core/models/export-fields-group.model';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { TeamModel } from '../../../../core/models/team.model';
import { UserModel } from '../../../../core/models/user.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ExportDataExtension, ExportDataMethod, IV2ExportDataConfigGroupsRequired } from '../../../../core/services/helper/models/dialog-v2.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { TopnavComponent } from '../../../../core/components/topnav/topnav.component';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { PersonAndRelatedHelperService } from '../../../../core/services/helper/person-and-related-helper.service';
import { IV2ColumnToVisibleMandatoryConf } from '../../../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';

@Component({
  selector: 'app-individual-contact-follow-ups-list',
  templateUrl: './individual-contact-follow-ups-list.component.html'
})
export class IndividualContactFollowUpsListComponent extends ListComponent<FollowUpModel, IV2ColumnToVisibleMandatoryConf> implements OnDestroy {
  // data
  entityData: ContactOfContactModel | ContactModel | CaseModel;

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
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_RESPONSIBLE_USER_ID', value: 'responsibleUser' },
    { label: 'LNG_FOLLOW_UP_FIELD_LABEL_QUESTIONNAIRE_ANSWERS', value: 'questionnaireAnswers' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', value: 'createdAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', value: 'createdBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', value: 'updatedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', value: 'updatedBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED', value: 'deleted' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', value: 'deletedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', value: 'createdOn' }
  ];

  // constants
  EntityType = EntityType;

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    protected outbreakDataService: OutbreakDataService,
    private route: ActivatedRoute,
    private personAndRelatedHelperService: PersonAndRelatedHelperService
  ) {
    // parent
    super(
      listHelperService, {
        disableFilterCaching: true
      }
    );

    // disable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = true;

    // data
    this.entityData = this.route.snapshot.data.entityData;

    // additional information
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
    this.tableColumnActions = this.personAndRelatedHelperService.followUp.retrieveTableColumnActions({
      entityData: this.entityData,
      selectedOutbreak: () => this.selectedOutbreak,
      selectedOutbreakIsActive: () => this.selectedOutbreakIsActive,
      team: this.route.snapshot.data.team,
      refreshList: () => {
        // reload data
        this.needsRefreshList(true);
      }
    });
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns(): void {
    console.log(1, this.selectedOutbreak);
    this.tableColumns = this.personAndRelatedHelperService.followUp.retrieveTableColumns(this.selectedOutbreak, {
      team: this.route.snapshot.data.team,
      user: this.route.snapshot.data.user,
      dailyFollowUpStatus: this.route.snapshot.data.dailyFollowUpStatus,
      options: {
        yesNoAll: (this.route.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options
      }
    });
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
    console.log(2, this.selectedOutbreak);
    this.advancedFilters = this.personAndRelatedHelperService.followUp.generateAdvancedFiltersPerson(this.selectedOutbreak, {
      contactFollowUpTemplate: () => this.selectedOutbreak.contactFollowUpTemplate,
      options: {
        team: (this.route.snapshot.data.team as IResolverV2ResponseModel<TeamModel>).options,
        yesNoAll: (this.route.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        yesNo: (this.route.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        dailyFollowUpStatus: (this.route.snapshot.data.dailyFollowUpStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        user: (this.route.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
        addressType: (this.route.snapshot.data.addressType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
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
              this.personAndRelatedHelperService.dialogV2Service
                .showExportData({
                  title: {
                    get: () => 'LNG_PAGE_LIST_FOLLOW_UPS_PRINT_DAILY_FORM_TITLE'
                  },
                  export: {
                    url: `outbreaks/${this.selectedOutbreak.id}/contacts/daily-followup-form/export`,
                    async: false,
                    method: ExportDataMethod.GET,
                    fileName: this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_LIST_FOLLOW_UPS_PRINT_DAILY_FORM_FILE_NAME'),
                    queryBuilder: this.queryBuilder,
                    allow: {
                      types: [ExportDataExtension.PDF]
                    },
                    inputs: {
                      append: [
                        {
                          type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
                          name: 'contactId',
                          placeholder: this.entityData.type === EntityType.CONTACT_OF_CONTACT ?
                            'LNG_PAGE_LIST_FOLLOW_UPS_EXPORT_CONTACT_OF_CONTACT_BUTTON' :
                            this.entityData.type === EntityType.CONTACT ?
                              'LNG_PAGE_LIST_FOLLOW_UPS_EXPORT_CONTACT_BUTTON' :
                              'LNG_PAGE_LIST_FOLLOW_UPS_EXPORT_CASE_BUTTON',
                          options: [({
                            label: this.entityData.name,
                            value: this.entityData.id
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
              this.exportFollowUps(this.queryBuilder);
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
          action: {
            link: () => {
              return ['/contacts/follow-ups/modify-list'];
            },
            linkQueryParams: (selected: string[]): Params => {
              return {
                followUpsIds: JSON.stringify(selected),
                entityId: this.entityData.id
              };
            }
          },
          visible: (): boolean => {
            return FollowUpModel.canBulkModify(this.authUser) &&
              this.selectedOutbreakIsActive;
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

        // divider
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
  protected initializeAddAction(): void {
    this.addAction = {
      type: V2ActionType.ICON_LABEL,
      label: 'LNG_COMMON_BUTTON_ADD',
      icon: 'add_circle_outline',
      action: {
        link: (): string[] => ['/contacts', this.entityData.id, 'follow-ups', 'create']
      },
      visible: (): boolean => {
        return this.entityData.type === EntityType.CONTACT &&
          FollowUpModel.canCreate(this.authUser) &&
          this.selectedOutbreakIsActive;
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

    // add contact of contact/contact/case breadcrumbs
    if (
      this.entityData.type === EntityType.CONTACT_OF_CONTACT &&
      ContactOfContactModel.canList(this.authUser)
    ) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
        action: {
          link: ['/contacts-of-contacts']
        }
      });
    } else if (
      this.entityData.type === EntityType.CONTACT &&
      ContactModel.canList(this.authUser)
    ) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
        action: {
          link: ['/contacts']
        }
      });
    } else if (
      this.entityData.type === EntityType.CASE &&
      CaseModel.canList(this.authUser)
    ) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CASES_TITLE',
        action: {
          link: ['/cases']
        }
      });
    }

    // add record data ?
    if (
      this.entityData && (
        (
          this.entityData.type === EntityType.CONTACT_OF_CONTACT &&
          ContactOfContactModel.canView(this.authUser)
        ) || (
          this.entityData.type === EntityType.CONTACT &&
          ContactModel.canView(this.authUser)
        ) || (
          this.entityData.type === EntityType.CASE &&
          CaseModel.canView(this.authUser)
        )
      )
    ) {
      this.breadcrumbs.push({
        label: this.entityData.name,
        action: {
          link: [EntityModel.getPersonLink(this.entityData)]
        }
      });
    }

    // add follow-ups breadcrumbs
    this.breadcrumbs.push({
      label: this.entityData.type === EntityType.CONTACT ? 'LNG_PAGE_LIST_FOLLOW_UPS_TITLE' : 'LNG_PAGE_LIST_FOLLOW_UPS_REGISTERED_AS_CONTACT_TITLE',
      action: null
    });
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return this.personAndRelatedHelperService.followUp.refreshListFields();
  }

  /**
   * Refresh list
   */
  refreshList() {
    // add contact id
    this.queryBuilder.filter.byEquality(
      'personId',
      this.entityData.id
    );

    // make sure we always sort by something
    // default by date asc
    if (this.queryBuilder.sort.isEmpty()) {
      this.queryBuilder.sort.by(
        'date',
        RequestSortDirection.ASC
      );
    }

    // retrieve the list of Follow Ups
    this.records$ = this.personAndRelatedHelperService.followUp
      .retrieveRecords(
        this.selectedOutbreak,
        this.queryBuilder
      )
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(applyHasMoreLimit?: boolean) {
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
      this.entityData.id
    );

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
    this.personAndRelatedHelperService.followUp
      .retrieveRecordsCount(
        this.selectedOutbreak.id,
        countQueryBuilder
      )
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      )
      .subscribe((response) => {
        this.pageCount = response;
      });
  }

  /**
   * Export follow-ups
   */
  private exportFollowUps(qb: RequestQueryBuilder): void {
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
                  url: `outbreaks/${this.selectedOutbreak.id}/follow-ups/export`,
                  async: true,
                  method: ExportDataMethod.POST,
                  fileName: `${this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_LIST_FOLLOW_UPS_TITLE')} - ${moment().format(Constants.DEFAULT_DATE_DISPLAY_FORMAT)}`,
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
                      required: followUpFieldGroupsRequires
                    },
                    fields: {
                      options: this.followUpFields
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
}
