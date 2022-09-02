import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { EventModel } from '../../../../core/models/event.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { EventDataService } from '../../../../core/services/data/event.data.service';
import { Observable, throwError } from 'rxjs';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import {
  CreateViewModifyV2ActionType,
  CreateViewModifyV2MenuType,
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab, ICreateViewModifyV2TabTable, ICreateViewModifyV2TabTableRecordsList
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { EntityType } from '../../../../core/models/entity-type';
import { catchError, takeUntil } from 'rxjs/operators';
import {
  CreateViewModifyV2ExpandColumnType
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { RequestFilterGenerator, RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { AddressModel, AddressType } from '../../../../core/models/address.model';
import { Constants } from '../../../../core/models/constants';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { ClusterModel } from '../../../../core/models/cluster.model';
import * as _ from 'lodash';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';

@Component({
  selector: 'app-events-create-view-modify',
  templateUrl: './events-create-view-modify.component.html'
})
export class EventsCreateViewModifyComponent extends CreateViewModifyComponent<EventModel> implements OnDestroy {
  /**
   * Constructor
   */
  constructor(
    protected router: Router,
    protected activatedRoute: ActivatedRoute,
    protected eventDataService: EventDataService,
    protected translateService: TranslateService,
    protected toastV2Service: ToastV2Service,
    protected dialogV2Service: DialogV2Service,
    protected entityHelperService: EntityHelperService,
    authDataService: AuthDataService,
    renderer2: Renderer2,
    redirectService: RedirectService
  ) {
    super(
      toastV2Service,
      renderer2,
      redirectService,
      activatedRoute,
      authDataService
    );
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();
  }

  /**
   * Refresh expand list
   */
  refreshExpandList(data): void {
    // append / remove search
    if (data.searchBy) {
      data.queryBuilder.filter.where({
        or: [
          {
            name: RequestFilterGenerator.textContains(
              data.searchBy
            )
          }, {
            description: RequestFilterGenerator.textContains(
              data.searchBy
            )
          }
        ]
      });
    }

    // retrieve data
    this.expandListRecords$ = this.eventDataService
      .getEventsList(
        this.selectedOutbreak.id,
        data.queryBuilder
      )
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Create new item model if needed
   */
  protected createNewItem(): EventModel {
    return new EventModel({
      address: new AddressModel({
        typeId: AddressType.CURRENT_ADDRESS
      })
    });
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: EventModel): Observable<EventModel> {
    return this.eventDataService
      .getEvent(
        this.selectedOutbreak.id,
        record ?
          record.id :
          this.activatedRoute.snapshot.params.eventId
      );
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {}

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // add info accordingly to page type
    if (this.isCreate) {
      this.pageTitle = 'LNG_PAGE_CREATE_EVENT_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_EVENT_TITLE';
      this.pageTitleData = {
        name: this.itemData.name
      };
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_EVENT_TITLE';
      this.pageTitleData = {
        name: this.itemData.name
      };
    }
  }

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs() {
    // reset breadcrumbs
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

    // event list page
    if (EventModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_EVENTS_TITLE',
        action: {
          link: ['/events']
        }
      });
    }

    // add info accordingly to page type
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_CREATE_EVENT_TITLE',
        action: null
      });
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_MODIFY_EVENT_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_VIEW_EVENT_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    }
  }

  /**
   * Initialize tabs
   */
  protected initializeTabs(): void {
    this.tabData = {
      // tabs
      tabs: [
        // Details
        this.initializeTabsDetails(),

        // Contacts, exposures ...
        this.initializeTabsContacts(),
        this.initializeTabsExposures()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.translateService.instant('LNG_PAGE_CREATE_EVENT_ACTION_CREATE_EVENT_BUTTON'),
          message: () => this.translateService.instant(
            'LNG_STEPPER_FINAL_STEP_TEXT_GENERAL',
            this.itemData
          )
        }
      },

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: (
        data: EventModel,
        extraQueryParams: Params
      ) => {
        // redirect to view
        this.router.navigate(
          [
            '/events',
            data.id,
            'view'
          ], {
            queryParams: extraQueryParams
          }
        );
      }
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {
    this.expandListColumnRenderer = {
      type: CreateViewModifyV2ExpandColumnType.TEXT,
      get: (item: EventModel) => item.name,
      link: (item: EventModel) => ['/events', item.id, 'view']
    };
  }

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {
    this.expandListQueryFields = [
      'id',
      'name'
    ];
  }

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {
    this.expandListAdvancedFilters = EventModel.generateAdvancedFilters({
      options: {
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
        eventCategory: (this.activatedRoute.snapshot.data.eventCategory as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
      }
    });
  }

  /**
   * Initialize tab details
   */
  private initializeTabsDetails(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      label: this.isCreate ?
        'LNG_PAGE_CREATE_EVENT_TAB_DETAILS_TITLE' :
        'LNG_PAGE_MODIFY_EVENT_TAB_DETAILS_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: this.isCreate ?
            'LNG_PAGE_CREATE_EVENT_TAB_DETAILS_TITLE' :
            'LNG_PAGE_MODIFY_EVENT_TAB_DETAILS_TITLE',
          inputs: [{
            type: CreateViewModifyV2TabInputType.TEXT,
            name: 'name',
            placeholder: () => 'LNG_EVENT_FIELD_LABEL_NAME',
            description: () => 'LNG_EVENT_FIELD_LABEL_NAME_DESCRIPTION',
            value: {
              get: () => this.itemData.name,
              set: (value) => {
                this.itemData.name = value;
              }
            },
            validators: {
              required: () => true
            }
          }, {
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'date',
            placeholder: () => 'LNG_EVENT_FIELD_LABEL_DATE',
            description: () => 'LNG_EVENT_FIELD_LABEL_DATE_DESCRIPTION',
            value: {
              get: () => this.itemData.date,
              set: (value) => {
                this.itemData.date = value;
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
              get: () => this.itemData.dateOfReporting,
              set: (value) => {
                this.itemData.dateOfReporting = value;
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
              get: () => this.itemData.isDateOfReportingApproximate,
              set: (value) => {
                this.itemData.isDateOfReportingApproximate = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'responsibleUserId',
            placeholder: () => 'LNG_EVENT_FIELD_LABEL_RESPONSIBLE_USER_ID',
            description: () => 'LNG_EVENT_FIELD_LABEL_RESPONSIBLE_USER_ID_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
            value: {
              get: () => this.itemData.responsibleUserId,
              set: (value) => {
                this.itemData.responsibleUserId = value;
              }
            },
            replace: {
              condition: () => !UserModel.canListForFilters(this.authUser),
              html: this.translateService.instant('LNG_PAGE_CREATE_EVENT_CANT_SET_RESPONSIBLE_ID_TITLE')
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'eventCategory',
            placeholder: () => 'LNG_EVENT_FIELD_LABEL_EVENT_CATEGORY',
            description: () => 'LNG_EVENT_FIELD_LABEL_EVENT_CATEGORY_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.eventCategory as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            value: {
              get: () => this.itemData.eventCategory,
              set: (value) => {
                this.itemData.eventCategory = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.DATE,
            name: 'endDate',
            placeholder: () => 'LNG_EVENT_FIELD_LABEL_END_DATE',
            description: () => 'LNG_EVENT_FIELD_LABEL_END_DATE_DESCRIPTION',
            value: {
              get: () => this.itemData.endDate,
              set: (value) => {
                this.itemData.endDate = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.TEXTAREA,
            name: 'description',
            placeholder: () => 'LNG_EVENT_FIELD_LABEL_DESCRIPTION',
            description: () => 'LNG_EVENT_FIELD_LABEL_DESCRIPTION_DESCRIPTION',
            value: {
              get: () => this.itemData.description,
              set: (value) => {
                this.itemData.description = value;
              }
            }
          }]
        },
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_EVENT_FIELD_LABEL_ADDRESS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.ADDRESS,
            typeOptions: (this.activatedRoute.snapshot.data.addressType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            name: 'address',
            value: {
              get: () => this.itemData.address
            }
          }]
        }
      ]
    };
  }

  /**
   * Initialize tabs - Contacts
   */
  private initializeTabsContacts(): ICreateViewModifyV2TabTable {
    // create tab
    const newTab: ICreateViewModifyV2TabTable = {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      label: 'LNG_COMMON_BUTTON_EXPOSURES_FROM',
      visible: () => this.isView &&
        EventModel.canListRelationshipContacts(this.authUser),
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST,
        pageSettingsKey: UserSettings.RELATIONSHIP_FIELDS,
        advancedFilterType: Constants.APP_PAGE.RELATIONSHIPS.value,
        tableColumns: this.entityHelperService
          .retrieveTableColumns({
            selectedOutbreakIsActive: () => this.selectedOutbreakIsActive,
            selectedOutbreak: () => this.selectedOutbreak,
            entity: this.itemData,
            relationshipType: RelationshipType.CONTACT,
            authUser: this.authUser,
            personType: this.activatedRoute.snapshot.data.personType,
            cluster: this.activatedRoute.snapshot.data.cluster,
            options: {
              certaintyLevel: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              exposureType: (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              exposureFrequency: (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              exposureDuration: (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              contextOfTransmission: (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
            },
            refreshList: () => {
              // reload data
              const localTab: ICreateViewModifyV2TabTableRecordsList = newTab.definition as ICreateViewModifyV2TabTableRecordsList;
              localTab.refresh(newTab);
            }
          }),
        advancedFilters: this.entityHelperService.generateAdvancedFilters({
          options: {
            certaintyLevel: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            exposureType: (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            exposureFrequency: (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            exposureDuration: (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            contextOfTransmission: (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            cluster: (this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ClusterModel>).options
          }
        }),
        queryBuilder: new RequestQueryBuilder(),
        pageIndex: 0,
        refresh: (tab) => {
          // refresh data
          const localTab: ICreateViewModifyV2TabTableRecordsList = tab.definition as ICreateViewModifyV2TabTableRecordsList;
          localTab.records$ = this.entityHelperService
            .retrieveRecords(
              RelationshipType.CONTACT,
              this.selectedOutbreak,
              this.itemData,
              localTab.queryBuilder
            )
            .pipe(
              // should be the last pipe
              takeUntil(this.destroyed$)
            );

          // count
          localTab.refreshCount(tab);

          // update ui
          localTab.updateUI();
        },
        refreshCount: (
          tab,
          applyHasMoreLimit?: boolean
        ) => {
          // reset
          const localTab: ICreateViewModifyV2TabTableRecordsList = tab.definition as ICreateViewModifyV2TabTableRecordsList;
          localTab.pageCount = undefined;

          // set apply value
          if (applyHasMoreLimit !== undefined) {
            localTab.applyHasMoreLimit = applyHasMoreLimit;
          }

          // remove paginator from query builder
          const countQueryBuilder = _.cloneDeep(localTab.queryBuilder);
          countQueryBuilder.paginator.clear();
          countQueryBuilder.sort.clear();

          // apply has more limit
          if (localTab.applyHasMoreLimit) {
            countQueryBuilder.flag(
              'applyHasMoreLimit',
              true
            );
          }

          // count
          this.entityHelperService
            .retrieveRecordsCount(
              RelationshipType.CONTACT,
              this.selectedOutbreak,
              this.itemData,
              countQueryBuilder
            )
            .pipe(
              // should be the last pipe
              takeUntil(this.destroyed$)
            ).subscribe((response) => {
              localTab.pageCount = response;
            });
        }
      }
    };

    // finished
    return newTab;
  }

  /**
   * Initialize tabs - Exposures
   */
  private initializeTabsExposures(): ICreateViewModifyV2TabTable {
    // create tab
    const newTab: ICreateViewModifyV2TabTable = {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      label: 'LNG_COMMON_BUTTON_EXPOSURES_TO',
      visible: () => this.isView &&
        EventModel.canListRelationshipExposures(this.authUser),
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_RECORDS_LIST,
        pageSettingsKey: UserSettings.RELATIONSHIP_FIELDS,
        advancedFilterType: Constants.APP_PAGE.RELATIONSHIPS.value,
        tableColumns: this.entityHelperService
          .retrieveTableColumns({
            selectedOutbreakIsActive: () => this.selectedOutbreakIsActive,
            selectedOutbreak: () => this.selectedOutbreak,
            entity: this.itemData,
            relationshipType: RelationshipType.EXPOSURE,
            authUser: this.authUser,
            personType: this.activatedRoute.snapshot.data.personType,
            cluster: this.activatedRoute.snapshot.data.cluster,
            options: {
              certaintyLevel: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              exposureType: (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              exposureFrequency: (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              exposureDuration: (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              contextOfTransmission: (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
            },
            refreshList: () => {
              // reload data
              const localTab: ICreateViewModifyV2TabTableRecordsList = newTab.definition as ICreateViewModifyV2TabTableRecordsList;
              localTab.refresh(newTab);
            }
          }),
        advancedFilters: this.entityHelperService.generateAdvancedFilters({
          options: {
            certaintyLevel: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            exposureType: (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            exposureFrequency: (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            exposureDuration: (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            contextOfTransmission: (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            cluster: (this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ClusterModel>).options
          }
        }),
        queryBuilder: new RequestQueryBuilder(),
        pageIndex: 0,
        refresh: (tab) => {
          // refresh data
          const localTab: ICreateViewModifyV2TabTableRecordsList = tab.definition as ICreateViewModifyV2TabTableRecordsList;
          localTab.records$ = this.entityHelperService
            .retrieveRecords(
              RelationshipType.EXPOSURE,
              this.selectedOutbreak,
              this.itemData,
              localTab.queryBuilder
            )
            .pipe(
              // should be the last pipe
              takeUntil(this.destroyed$)
            );

          // count
          localTab.refreshCount(tab);

          // update ui
          localTab.updateUI();
        },
        refreshCount: (
          tab,
          applyHasMoreLimit?: boolean
        ) => {
          // reset
          const localTab: ICreateViewModifyV2TabTableRecordsList = tab.definition as ICreateViewModifyV2TabTableRecordsList;
          localTab.pageCount = undefined;

          // set apply value
          if (applyHasMoreLimit !== undefined) {
            localTab.applyHasMoreLimit = applyHasMoreLimit;
          }

          // remove paginator from query builder
          const countQueryBuilder = _.cloneDeep(localTab.queryBuilder);
          countQueryBuilder.paginator.clear();
          countQueryBuilder.sort.clear();

          // apply has more limit
          if (localTab.applyHasMoreLimit) {
            countQueryBuilder.flag(
              'applyHasMoreLimit',
              true
            );
          }

          // count
          this.entityHelperService
            .retrieveRecordsCount(
              RelationshipType.EXPOSURE,
              this.selectedOutbreak,
              this.itemData,
              countQueryBuilder
            )
            .pipe(
              // should be the last pipe
              takeUntil(this.destroyed$)
            ).subscribe((response) => {
              localTab.pageCount = response;
            });
        }
      }
    };

    // finished
    return newTab;
  }

  /**
   * Initialize buttons
   */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: {
        link: {
          link: () => ['/events', this.itemData?.id, 'view']
        }
      },
      modify: {
        link: {
          link: () => ['/events', this.itemData?.id, 'modify']
        },
        visible: () => EventModel.canModify(this.authUser)
      },
      createCancel: {
        link: {
          link: () => ['/events']
        }
      },
      viewCancel: {
        link: {
          link: () => ['/events']
        }
      },
      modifyCancel: {
        link: {
          link: () => ['/events']
        }
      },
      quickActions: {
        options: [
          // Record details
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_EVENT_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
            action: {
              click: () => {
                // show record details dialog
                this.dialogV2Service.showRecordDetailsDialog(
                  'LNG_PAGE_MODIFY_EVENT_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
                  this.itemData,
                  this.activatedRoute.snapshot.data.user
                );
              }
            },
            visible: () => !this.isCreate
          },

          // Divider
          {
            type: CreateViewModifyV2MenuType.DIVIDER,
            visible: () => !this.isCreate
          },

          // Add contact
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_ACTION_ADD_CONTACT',
            action: {
              link: () => ['/contacts', 'create'],
              queryParams: () => {
                return {
                  entityType: EntityType.EVENT,
                  entityId: this.itemData?.id
                };
              }
            },
            visible: () => this.selectedOutbreakIsActive && EventModel.canCreateContact(this.authUser) && ContactModel.canCreate(this.authUser)
          },

          // Divider
          {
            type: CreateViewModifyV2MenuType.DIVIDER,
            visible: () => this.selectedOutbreakIsActive && EventModel.canCreateContact(this.authUser) && ContactModel.canCreate(this.authUser)
          },

          // contacts
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_COMMON_BUTTON_EXPOSURES_FROM',
            action: {
              link: () => ['/relationships', EntityType.EVENT, this.itemData.id, 'contacts']
            },
            visible: () => EventModel.canListRelationshipContacts(this.authUser)
          },

          // exposures
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_COMMON_BUTTON_EXPOSURES_TO',
            action: {
              link: () => ['/relationships', EntityType.EVENT, this.itemData.id, 'exposures']
            },
            visible: () => EventModel.canListRelationshipExposures(this.authUser)
          }
        ]
      }
    };
  }

  /**
   * Initialize process data
   */
  private initializeProcessData(): ICreateViewModifyV2CreateOrUpdate {
    return (
      type,
      data,
      finished
    ) => {
      // finished
      (type === CreateViewModifyV2ActionType.CREATE ?
        this.eventDataService.createEvent(
          this.selectedOutbreak.id,
          data
        ) :
        this.eventDataService.modifyEvent(
          this.selectedOutbreak.id,
          this.itemData.id,
          data
        )
      ).pipe(
        // handle error
        catchError((err) => {
          // show error
          finished(err, undefined);

          // finished
          return throwError(err);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      ).subscribe((item: EventModel) => {
        // success creating / updating event
        this.toastV2Service.success(
          type === CreateViewModifyV2ActionType.CREATE ?
            'LNG_PAGE_CREATE_EVENT_ACTION_CREATE_EVENT_SUCCESS_MESSAGE' :
            'LNG_PAGE_MODIFY_EVENT_ACTION_MODIFY_EVENT_SUCCESS_MESSAGE'
        );

        // finished with success
        finished(undefined, item);
      });
    };
  }
}
