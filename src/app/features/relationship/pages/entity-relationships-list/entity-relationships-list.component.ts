import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { TopnavComponent } from '../../../../core/components/topnav/topnav.component';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import * as _ from 'lodash';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { catchError, takeUntil, tap } from 'rxjs/operators';
import { throwError } from 'rxjs/internal/observable/throwError';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ClusterModel } from '../../../../core/models/cluster.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { UserModel } from '../../../../core/models/user.model';
import { RelationshipPersonModel } from '../../../../core/models/relationship-person.model';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';

@Component({
  selector: 'app-entity-relationships-list',
  templateUrl: './entity-relationships-list.component.html'
})
export class EntityRelationshipsListComponent extends ListComponent<EntityModel> implements OnDestroy {
  // list of relationships
  private _relationshipsListRecordsMap: {
    [idRelationship: string]: EntityModel
  } = {};

  // route
  relationshipType: RelationshipType;

  // entity
  private _entity: CaseModel | ContactModel | EventModel;

  // constants
  RelationshipType = RelationshipType;

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    protected activatedRoute: ActivatedRoute,
    protected relationshipDataService: RelationshipDataService,
    protected toastV2Service: ToastV2Service,
    protected router: Router,
    protected dialogV2Service: DialogV2Service,
    protected entityHelperService: EntityHelperService,
    protected referenceDataHelperService: ReferenceDataHelperService
  ) {
    // parent
    super(
      listHelperService, {
        disableFilterCaching: true,
        initializeTableColumnsAfterSelectedOutbreakChanged: true,
        initializeTableAdvancedFiltersAfterSelectedOutbreakChanged: true
      }
    );

    // disable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = true;

    // retrieve data from snapshot
    this.relationshipType = this.activatedRoute.snapshot.data.relationshipType;
    this._entity = this.activatedRoute.snapshot.data.entity;
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
    this.tableColumnActions = this.entityHelperService.retrieveTableColumnActions({
      selectedOutbreakIsActive: () => this.selectedOutbreakIsActive,
      selectedOutbreak: () => this.selectedOutbreak,
      entity: this._entity,
      relationshipType: this.relationshipType,
      authUser: this.authUser,
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
    this.tableColumns = this.entityHelperService.retrieveTableColumns({
      authUser: this.authUser,
      personType: this.activatedRoute.snapshot.data.personType,
      cluster: this.activatedRoute.snapshot.data.cluster,
      options: {
        certaintyLevel: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        exposureType: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        exposureFrequency: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        exposureDuration: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        contextOfTransmission: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
      }
    });
  }

  /**
   * Initialize process data
   */
  protected initializeProcessSelectedData(): void {}

  /**
   * Initialize table infos
   */
  protected initializeTableInfos(): void {}

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {
    this.advancedFilters = this.entityHelperService.generateAdvancedFilters({
      options: {
        certaintyLevel: (this.activatedRoute.snapshot.data.certaintyLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        exposureType: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.exposureType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        exposureFrequency: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.exposureFrequency as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        exposureDuration: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.exposureDuration as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        contextOfTransmission: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.contextOfTransmission as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        cluster: (this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ClusterModel>).options,
        yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options
      }
    });
  }

  /**
   * Initialize table quick actions
   */
  protected initializeQuickActions(): void {}

  /**
   * Initialize table group actions
   */
  protected initializeGroupActions(): void {
    this.groupActions = {
      type: V2ActionType.GROUP_ACTIONS,
      visible: () =>
        (
          RelationshipModel.canShare(this.authUser) &&
          this.entityHelperService.entityMap[this._entity.type].can[this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'].share(this.authUser) &&
          this.selectedOutbreakIsActive
        ) || (
          this.relationshipType === RelationshipType.CONTACT &&
          this.entityHelperService.entityMap[this._entity.type].can[this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'].changeSource(this.authUser) &&
          this.selectedOutbreakIsActive
        ) || (
          RelationshipModel.canBulkDelete(this.authUser) &&
          this.entityHelperService.entityMap[this._entity.type].can[this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'].bulkDelete(this.authUser) &&
          this.selectedOutbreakIsActive
        ),
      actions: [
        // Share
        {
          label: {
            get: () => this.relationshipType === RelationshipType.EXPOSURE ?
              'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_GROUP_ACTION_SHARE_SELECTED_EXPOSURES' :
              'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_GROUP_ACTION_SHARE_SELECTED_CONTACTS'
          },
          action: {
            click: (selected: string[]) => {
              // determine list of model ids
              const selectedRecords: string[] = _.map(selected, (idRelationship: string) => this._relationshipsListRecordsMap[idRelationship].model.id)
                .filter((record, index, self) => {
                  // keep only unique dates
                  return self.indexOf(record) === index;
                });

              // redirect to next step
              this.router.navigate(
                [`/relationships/${this._entity.type}/${this._entity.id}/${this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'}/share`],
                {
                  queryParams: {
                    selectedTargetIds: JSON.stringify(selectedRecords)
                  }
                }
              );
            }
          },
          visible: (): boolean => {
            return RelationshipModel.canShare(this.authUser) &&
              this.entityHelperService.entityMap[this._entity.type].can[this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'].share(this.authUser) &&
              this.selectedOutbreakIsActive;
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
          }
        },

        // Change source
        {
          label: {
            get: () => 'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_ACTION_CHANGE_SOURCE'
          },
          action: {
            click: (selected: string[]) => {
              // pass the selected target persons for not including them in available peoples
              const selectedTargetPersons = {};
              _.forEach(this._relationshipsListRecordsMap, (model) => {
                const targetPerson: RelationshipPersonModel = _.find(model.relationship.persons, 'target');
                selectedTargetPersons[targetPerson.id] = true;
              });

              // redirect
              this.router.navigate(
                [`/relationships/${this._entity.type}/${this._entity.id}/${this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'}/switch`],
                {
                  queryParams: {
                    selectedTargetIds: JSON.stringify(selected),
                    selectedPersonsIds: JSON.stringify(Object.keys(selectedTargetPersons))
                  }
                }
              );
            }
          },
          visible: (): boolean => {
            return this.relationshipType === RelationshipType.CONTACT &&
              this.entityHelperService.entityMap[this._entity.type].can[this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'].changeSource(this.authUser) &&
              this.selectedOutbreakIsActive;
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
          }
        },

        // Divider
        {
          visible: (): boolean => {
            return RelationshipModel.canBulkDelete(this.authUser) &&
              this.entityHelperService.entityMap[this._entity.type].can[this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'].bulkDelete(this.authUser) &&
              this.selectedOutbreakIsActive;
          }
        },

        // Bulk delete
        {
          label: {
            get: () => 'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_GROUP_ACTION_DELETE_SELECTED_RELATIONSHIPS'
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
              this.dialogV2Service
                .showConfirmDialog({
                  config: {
                    title: {
                      get: () => 'LNG_PAGE_ACTION_DELETE'
                    },
                    message: {
                      get: () => 'LNG_DIALOG_CONFIRM_DELETE_RELATIONSHIPS'
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

                  // delete relationships
                  this.relationshipDataService
                    .deleteBulkRelationships(
                      this.selectedOutbreak.id,
                      qb
                    )
                    .pipe(
                      catchError((err) => {
                        this.toastV2Service.error(err);

                        // hide loading
                        loading.close();

                        return throwError(err);
                      })
                    )
                    .subscribe(() => {
                      this.toastV2Service.success('LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_GROUP_ACTION_DELETE_SELECTED_RELATIONSHIPS_SUCCESS_MESSAGE');

                      // hide loading
                      loading.close();

                      this.needsRefreshList(true);
                    });
                });
            }
          },
          visible: (): boolean => {
            return RelationshipModel.canBulkDelete(this.authUser) &&
              this.entityHelperService.entityMap[this._entity.type].can[this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'].bulkDelete(this.authUser) &&
              this.selectedOutbreakIsActive;
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
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
        link: (): string[] => [
          '/relationships',
          this._entity.type,
          this._entity.id,
          this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures',
          'available-entities'
        ]
      },
      visible: (): boolean => {
        return RelationshipModel.canCreate(this.authUser) &&
          this.entityHelperService.entityMap[this._entity.type].can[this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures'].create(this.authUser) &&
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
  initializeBreadcrumbs(): void {
    // set breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      }, {
        label: this.entityHelperService.entityMap[this._entity.type].label,
        action: {
          link: [this.entityHelperService.entityMap[this._entity.type].link]
        }
      }, {
        label: this._entity.name,
        action: {
          link: [
            this.entityHelperService.entityMap[this._entity.type].link,
            this._entity.id,
            'view'
          ]
        }
      }, {
        label: this.relationshipType === RelationshipType.EXPOSURE ?
          'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_EXPOSURES_TITLE' :
          'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_CONTACTS_TITLE',
        action: null
      }
    ];
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the Relationships list, based on the applied filter, sort criterias
   */
  refreshList(): void {
    // request data
    this.records$ = this.entityHelperService
      .retrieveRecords(
        this.relationshipType,
        this.selectedOutbreak,
        this._entity,
        this.queryBuilder
      )
      .pipe(
        tap((entities: EntityModel[]) => {
          // map models
          this._relationshipsListRecordsMap = {};
          (entities || []).forEach((entity) => {
            this._relationshipsListRecordsMap[entity.relationship.id] = entity;
          });
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(applyHasMoreLimit?: boolean): void {
    // reset
    this.pageCount = undefined;

    // set apply value
    if (applyHasMoreLimit !== undefined) {
      this.applyHasMoreLimit = applyHasMoreLimit;
    }

    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
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
    this.entityHelperService
      .retrieveRecordsCount(
        this.relationshipType,
        this.selectedOutbreak,
        this._entity,
        countQueryBuilder
      )
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      ).subscribe((response) => {
        this.pageCount = response;
      });
  }
}
