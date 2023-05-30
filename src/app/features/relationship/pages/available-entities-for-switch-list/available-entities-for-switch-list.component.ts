import { Component, OnDestroy } from '@angular/core';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import * as _ from 'lodash';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { Constants } from '../../../../core/models/constants';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { EntityType } from '../../../../core/models/entity-type';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder/request-query-builder';
import { AddressModel } from '../../../../core/models/address.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { TopnavComponent } from '../../../../core/components/topnav/topnav.component';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { IV2ColumnPinned, IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterType, V2FilterTextType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { V2AdvancedFilterType } from '../../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
  selector: 'app-available-entities-for-switch-list',
  templateUrl: './available-entities-for-switch-list.component.html'
})
export class AvailableEntitiesForSwitchListComponent extends ListComponent<CaseModel | ContactModel | EventModel | ContactOfContactModel> implements OnDestroy {
  // entity
  private _entity: CaseModel | ContactModel | EventModel | ContactOfContactModel;
  // selected records
  private _selectedRecords: string[];

  // relationship type
  relationshipType: RelationshipType;
  // available side filters
  selectedTargetIds: string[];
  selectedPeopleIds: string[];

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    protected router: Router,
    protected activatedRoute: ActivatedRoute,
    protected outbreakDataService: OutbreakDataService,
    protected entityDataService: EntityDataService,
    protected entityHelperService: EntityHelperService,
    protected i18nService: I18nService,
    private toastV2Service: ToastV2Service,
    private relationshipDataService: RelationshipDataService,
    private genericDataService: GenericDataService,
    private dialogV2Service: DialogV2Service

  ) {
    // parent
    super(
      listHelperService
    );

    // disable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = true;

    // retreive entity related data
    this._entity = this.activatedRoute.snapshot.data.entity;
    this.relationshipType = this.activatedRoute.snapshot.data.relationshipType;

    // initialize query builder
    this.clearQueryBuilder();

    // read route query params
    if (_.isEmpty(this.activatedRoute.snapshot.queryParams.selectedTargetIds)) {
      this.toastV2Service.error('LNG_PAGE_LIST_AVAILABLE_ENTITIES_FOR_SWITCH_RELATIONSHIP_NO_CONTACTS_SELECTED');
      this.router.navigate(['/contacts/follow-ups']);
    } else {
      this.selectedTargetIds = JSON.parse(this.activatedRoute.snapshot.queryParams.selectedTargetIds);
      this.selectedPeopleIds = JSON.parse(this.activatedRoute.snapshot.queryParams.selectedPersonsIds);
    }
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
  protected initializeTableColumnActions(): void {}

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
        field: 'lastName',
        label: 'LNG_ENTITY_FIELD_LABEL_LAST_NAME',
        sortable: true,
        pinned: IV2ColumnPinned.LEFT,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'firstName',
        label: 'LNG_ENTITY_FIELD_LABEL_FIRST_NAME',
        sortable: true,
        pinned: IV2ColumnPinned.LEFT,
        format: {
          type: (item) => item.type === EntityType.EVENT ? item.name : item.firstName
        },
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'visualId',
        label: 'LNG_ENTITY_FIELD_LABEL_VISUAL_ID',
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
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
          // person type
          {
            title: 'LNG_ENTITY_FIELD_LABEL_TYPE',
            items: this.activatedRoute.snapshot.data.personType.list.map((item) => {
              return {
                form: {
                  type: IV2ColumnStatusFormType.CIRCLE,
                  color: item.getColorCode()
                },
                label: item.id
              };
            })
          }
        ],
        forms: (_column, data): V2ColumnStatusForm[] => {
          // construct list of forms that we need to display
          const forms: V2ColumnStatusForm[] = [];

          // person type
          if (
            data.type &&
            this.activatedRoute.snapshot.data.personType.map[data.type]
          ) {
            forms.push({
              type: IV2ColumnStatusFormType.CIRCLE,
              color: this.activatedRoute.snapshot.data.personType.map[data.type].getColorCode(),
              tooltip: this.i18nService.instant(data.type)
            });
          }

          // finished
          return forms;
        }
      },
      {
        field: 'gender',
        label: 'LNG_ENTITY_FIELD_LABEL_GENDER',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'place',
        label: 'LNG_ADDRESS_FIELD_LABEL_LOCATION',
        format: {
          type: 'mainAddress.location.name'
        },
        filter: {
          type: V2FilterType.ADDRESS_MULTIPLE_LOCATION,
          address: filterAddressModel,
          field: 'addresses',
          fieldIsArray: true
        },
        link: (data) => {
          return data.mainAddress?.location?.name ?
            `/locations/${ data.mainAddress.location.id }/view` :
            undefined;
        }
      }
    ];
  }

  /**
   * Initialize process data
   */
  protected initializeProcessSelectedData(): void {
    // update selected
    this.processSelectedData = [
      // all selected records were not deleted ?
      {
        key: 'updateSelected',
        shouldProcess: () => true,
        process: (
          _dataMap,
          selected
        ) => {
          // update selected
          this._selectedRecords = selected;
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
    this.advancedFilters = [
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'firstName',
        label: 'LNG_ENTITY_FIELD_LABEL_FIRST_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'lastName',
        label: 'LNG_ENTITY_FIELD_LABEL_LAST_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'visualId',
        label: 'LNG_ENTITY_FIELD_LABEL_VISUAL_ID'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'gender',
        label: 'LNG_ENTITY_FIELD_LABEL_GENDER',
        options: this.activatedRoute.snapshot.data.gender.options,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.ADDRESS,
        field: 'addresses',
        label: 'LNG_ENTITY_FIELD_LABEL_ADDRESS',
        isArray: true
      }
    ];
  }

  /**
   * Initialize table quick actions
   */
  protected initializeQuickActions(): void {}

  /**
   * Initialize table group actions
   */
  protected initializeGroupActions(): void {}

  /**
   * Initialize table add action
   */
  protected initializeAddAction(): void {
    this.addAction = {
      type: V2ActionType.ICON_LABEL,
      label: 'LNG_PAGE_LIST_AVAILABLE_ENTITIES_FOR_SWITCH_RELATIONSHIP_SET_SOURCE_BUTTON',
      icon: 'add_circle_outline',
      action: {
        click: () => {
          // get the selected record
          const selectedRecordId = this._selectedRecords[0];
          if (!selectedRecordId) {
            return;
          }

          // create query builder for relationships
          const qb = new RequestQueryBuilder();

          // filter
          qb.filter.where({
            id: {
              inq: this.selectedTargetIds
            }
          });

          // display confirm dialog
          this.dialogV2Service.showConfirmDialog({
            config: {
              title: {
                get: () => 'LNG_PAGE_LIST_AVAILABLE_ENTITIES_FOR_SWITCH_RELATIONSHIP_CHANGE_SOURCE_TITLE'
              },
              message: {
                get: () => 'LNG_DIALOG_CONFIRM_CHANGE_SOURCE'
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

            this.relationshipDataService
              .bulkChangeSource(
                this.selectedOutbreak.id,
                selectedRecordId,
                qb
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
                this.toastV2Service.success('LNG_PAGE_LIST_AVAILABLE_ENTITIES_FOR_SWITCH_RELATIONSHIP_ACTION_SET_SOURCE_SUCCESS_MESSAGE');

                // hide loading
                loading.close();

                // redirect
                this.router.navigate(['/relationships', this._entity.type, selectedRecordId, 'contacts']);
              });
          });
        }
      },
      disable: () => {
        return !this._selectedRecords?.length;
      }
    };
  }

  /**
   * Initialize table grouped data
   */
  protected initializeGroupedData(): void {}

  /**
   * clear query builder
   */
  clearQueryBuilder() {
    // clear query builder
    this.queryBuilder.clear();
    // retrieve only available entity types
    const availableTypes: EntityType[] = this.genericDataService.getAvailableRelatedEntityTypes(
      this._entity.type,
      this.relationshipType,
      Constants.APP_PAGE.AVAILABLE_ENTITIES_FOR_SWITCH.value
    );
    this.queryBuilder.filter.where({
      type: {
        'inq': availableTypes
      }
    });
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
      },
      {
        label: this.entityHelperService.entityMap[this._entity.type].label,
        action: {
          link: [this.entityHelperService.entityMap[this._entity.type].link]
        }
      },
      {
        label: this._entity.name,
        action: {
          link: [`${ this.entityHelperService.entityMap[this._entity.type].link }/${ this._entity.id }/view`]
        }
      },
      {
        label: this.relationshipType === RelationshipType.EXPOSURE ?
          'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_EXPOSURES_TITLE' :
          'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_CONTACTS_TITLE',
        action: {
          link: [`/relationships/${ this._entity.type }/${ this._entity.id }/${ this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures' }`]
        }
      },
      {
        label: 'LNG_PAGE_LIST_AVAILABLE_ENTITIES_FOR_SWITCH_RELATIONSHIP_TITLE',
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
   * Re(load) the available Entities list, based on the applied filter, sort criterias
   */
  refreshList() {
    if (
      this._entity.type &&
            this._entity.id &&
            this.selectedOutbreak
    ) {
      // create queryBuilder
      const qb = new RequestQueryBuilder();
      qb.merge(this.queryBuilder);

      qb.filter.where({
        id: {
          nin: this.selectedPeopleIds
        }
      });

      // retrieve location list
      qb.include('locations', true);

      // retrieve the list of Relationships
      this.records$ = this.relationshipDataService
        .getEntityAvailablePeople(
          this.selectedOutbreak.id,
          this._entity.type,
          this._entity.id,
          qb
        )
        .pipe(
          // should be the last pipe
          takeUntil(this.destroyed$)
        );
    }
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(applyHasMoreLimit?: boolean): void {
    // reset
    this.pageCount = undefined;

    if (
      this._entity.type &&
            this._entity.id &&
            this.selectedOutbreak
    ) {
      // set apply value
      if (applyHasMoreLimit !== undefined) {
        this.applyHasMoreLimit = applyHasMoreLimit;
      }

      // create queryBuilder
      const qb = new RequestQueryBuilder();
      qb.merge(this.queryBuilder);
      qb.paginator.clear();
      qb.filter.where({
        id: {
          nin: this.selectedPeopleIds
        }
      });

      // apply has more limit
      if (this.applyHasMoreLimit) {
        qb.flag(
          'applyHasMoreLimit',
          true
        );
      }

      // count
      this.relationshipDataService
        .getEntityAvailablePeopleCount(
          this.selectedOutbreak.id,
          this._entity.type,
          this._entity.id,
          qb
        )
        .pipe(
          // should be the last pipe
          takeUntil(this.destroyed$)
        ).subscribe((response) => {
          this.pageCount = response;
        });
    }
  }
}
