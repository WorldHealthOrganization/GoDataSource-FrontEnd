import { Component, OnDestroy } from '@angular/core';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { EntityType } from '../../../../core/models/entity-type';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import * as _ from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { TopnavComponent } from '../../../../core/components/topnav/topnav.component';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { IV2ColumnPinned, IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterType, V2FilterTextType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { V2AdvancedFilterType } from '../../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
  selector: 'app-entity-relationships-list-add',
  templateUrl: './entity-relationships-list-add.component.html'
})
export class EntityRelationshipsListAddComponent extends ListComponent<CaseModel | ContactModel | EventModel | ContactOfContactModel> implements OnDestroy {
  // entity
  private _entity: CaseModel | ContactModel | EventModel | ContactOfContactModel;
  // selected records
  private _selectedRecords: string[];

  // relationship type
  relationshipType: RelationshipType;
  // // selected records ids
  selectedTargetIds: string[] = [];
  // provide constants to template
  RelationshipType = RelationshipType;

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
    private i18nService: I18nService
  ) {
    super(
      listHelperService
    );

    // disable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = true;

    // retrieve entity related data
    this._entity = this.activatedRoute.snapshot.data.entity;
    this.relationshipType = this.activatedRoute.snapshot.data.relationshipType;

    // get selected records ids
    if (!_.isEmpty(this.activatedRoute.snapshot.queryParams.selectedTargetIds)) {
      this.selectedTargetIds = JSON.parse(this.activatedRoute.snapshot.queryParams.selectedTargetIds);
    }

    // clear queryBuilder
    this.clearQueryBuilder();
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
  protected initializeTableColumns() {
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
        field: 'age',
        label: 'LNG_ENTITY_FIELD_LABEL_AGE',
        sortable: true,
        format: {
          type: V2ColumnFormat.AGE
        },
        filter: {
          type: V2FilterType.AGE_RANGE,
          min: 0,
          max: Constants.DEFAULT_AGE_MAX_YEARS
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
        field: 'riskLevel',
        label: 'LNG_ENTITY_FIELD_LABEL_RISK',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'classification',
        label: 'LNG_ENTITY_FIELD_LABEL_CLASSIFICATION',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'dateOfOnset',
        label: 'LNG_ENTITY_FIELD_LABEL_DATE_OF_ONSET',
        sortable: true,
        format: {
          type: V2ColumnFormat.DATE
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'place',
        label: 'LNG_ADDRESS_FIELD_LABEL_LOCATION',
        format: {
          type: 'mainAddress.location.name'
        },
        link: (data) => {
          return data.mainAddress?.location?.name ?
            `/locations/${ data.mainAddress.location.id }/view` :
            undefined;
        }
      },
      {
        field: 'address',
        label: 'LNG_ENTITY_FIELD_LABEL_ADDRESS',
        format: {
          type: 'mainAddress.fullAddress'
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
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'type',
        label: 'LNG_ENTITY_FIELD_LABEL_TYPE',
        options: this.activatedRoute.snapshot.data.personType.options,
        sortable: true
      },
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
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'gender',
        label: 'LNG_ENTITY_FIELD_LABEL_GENDER',
        options: this.activatedRoute.snapshot.data.gender.options,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_AGE,
        field: 'age',
        label: 'LNG_ENTITY_FIELD_LABEL_AGE',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.ADDRESS,
        field: 'addresses',
        label: 'LNG_ENTITY_FIELD_LABEL_ADDRESS',
        isArray: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dob',
        label: 'LNG_ENTITY_FIELD_LABEL_DOB',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'riskLevel',
        label: 'LNG_ENTITY_FIELD_LABEL_RISK',
        options: this.activatedRoute.snapshot.data.risk.options,
        sortable: true
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
  protected initializeGroupActions(): void {
    // trick to display checkboxes
    this.groupActions = {
      type: V2ActionType.GROUP_ACTIONS,
      visible: () => true,
      actions: [
        {
          visible: () => false
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
      label: 'LNG_COMMON_BUTTON_SELECT',
      icon: 'add_circle_outline',
      action: {
        link: (): string[] => [
          '/relationships',
          this._entity.type,
          this._entity.id,
          'exposures',
          'add-and-convert',
          'create-bulk'
        ],
        linkQueryParams: () => ({
          selectedSourceIds: JSON.stringify(this._selectedRecords),
          selectedTargetIds: JSON.stringify([this._entity.id])
        })
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
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs(): void {
    if (
      this.relationshipType &&
      this._entity
    ) {
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
          label: 'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_EXPOSURES_TITLE',
          action: {
            link: [`/relationships/${ this._entity.type }/${ this._entity.id }/exposures }`]
          }
        },
        {
          label: 'LNG_PAGE_LIST_ENTITY_ADD_EXPOSURES_TITLE',
          action: null
        }
      ];
    }
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
   * Set query builder
   */
  clearQueryBuilder() {
    // clear query builder
    this.queryBuilder.clear();

    // get available entities as exposures. note that the entity type is before convert
    // exclude root person
    const availableTypes: EntityType[] = this._entity.type === EntityType.CONTACT_OF_CONTACT ?
      [EntityType.EVENT, EntityType.CASE] :
      [EntityType.CONTACT];

    this.queryBuilder.filter.where({
      id: {
        neq: this._entity.id
      },
      type: {
        inq: availableTypes
      }
    });
  }

  /**
   * Re(load) the available Entities list, based on the applied filter, sort criteria
   */
  refreshList() {
    // retrieve the list of Relationships
    this.records$ = this.entityDataService
      .getEntitiesList(
        this.selectedOutbreak.id,
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

    // apply has more limit
    if (this.applyHasMoreLimit) {
      countQueryBuilder.flag(
        'applyHasMoreLimit',
        true
      );
    }

    // count
    this.entityDataService
      .getEntitiesCount(this.selectedOutbreak.id, countQueryBuilder)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      ).subscribe((response) => {
        this.pageCount = response;
      });
  }
}
