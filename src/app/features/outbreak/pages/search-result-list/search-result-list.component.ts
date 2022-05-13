import {
  Component,
  OnDestroy,
  ViewEncapsulation
} from '@angular/core';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { Observable, throwError } from 'rxjs';
import { TopnavComponent } from '../../../../core/components/topnav/topnav.component';
import { ActivatedRoute } from '@angular/router';
import { GlobalEntitySearchDataService } from '../../../../core/services/data/global-entity-search.data.service';
import { catchError, takeUntil } from 'rxjs/operators';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import * as _ from 'lodash';
import { IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-search-result-list',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './search-result-list.component.html',
  styleUrls: ['./search-result-list.less']
})
export class SearchResultListComponent extends ListComponent implements OnDestroy {
  // list of search result
  entityList$: Observable<(CaseModel | ContactModel | ContactOfContactModel | EventModel)[]>;

  // search by value
  private _searchValue: string;

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private globalEntitySearchDataService: GlobalEntitySearchDataService,
    private toastV2Service: ToastV2Service,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService
  ) {
    // parent
    super(listHelperService);

    // disable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = true;

    // determine search by value
    this._searchValue = activatedRoute.snapshot.queryParams.search;
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
   * Initialize Side Table Columns
   */
  protected initializeTableColumns(): void {
    this.tableColumns = [
      {
        field: 'id',
        label: 'LNG_COMMON_MODEL_FIELD_LABEL_ID',
        highlight: this._searchValue
      },
      {
        field: 'statuses',
        label: 'LNG_COMMON_LABEL_STATUSES',
        format: {
          type: V2ColumnFormat.STATUS
        },
        notResizable: true,
        legends: [
          // person type
          {
            title: 'LNG_ENTITY_FIELD_LABEL_TYPE',
            items: (this.activatedRoute.snapshot.data.personType as IResolverV2ResponseModel<ReferenceDataEntryModel>).list.map((item) => {
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
            (this.activatedRoute.snapshot.data.personType as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[data.type]
          ) {
            forms.push({
              type: IV2ColumnStatusFormType.CIRCLE,
              color: (this.activatedRoute.snapshot.data.personType as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[data.type].getColorCode(),
              tooltip: this.translateService.instant(data.type)
            });
          }

          // finished
          return forms;
        }
      },
      {
        field: 'visualId',
        label: 'LNG_PAGE_LIST_SEARCH_RESULT_ENTITY_ID',
        highlight: this._searchValue
      },
      {
        field: 'name',
        label: 'LNG_ENTITY_FIELD_LABEL_NAME',
        highlight: this._searchValue
      }
    ];
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
  protected initializeTableAdvancedFilters(): void {}

  /**
   * Initialize quick actions
   */
  protected initializeQuickActions(): void {}

  /**
   * Initialize group actions
   */
  protected initializeGroupActions(): void {}

  /**
   * Initialize add action
   */
  protected initializeAddAction(): void {}

  /**
   * Initialize grouped data
   */
  protected initializeGroupedData(): void {}

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs(): void {}

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the Events list, based on the applied filter, sort criterias
   */
  refreshList(): void {
    // retrieve the list of entities
    this.entityList$ = this.globalEntitySearchDataService
      .searchEntity(
        this.selectedOutbreak.id,
        this._searchValue,
        this.queryBuilder
      );
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(applyHasMoreLimit?: boolean): void {
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
    this.globalEntitySearchDataService
      .searchEntityCount(
        this.selectedOutbreak.id,
        this._searchValue,
        countQueryBuilder
      )
      .pipe(
        catchError((err) => {
          // show error
          this.toastV2Service.error(err);

          // continue
          return throwError(err);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      )
      .subscribe((response) => {
        this.pageCount = response;
      });
  }

  // Breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [
  //   new BreadcrumbItemModel('LNG_PAGE_LIST_SEARCH_RESULT_TITLE', '.', true)
  // ];

  // searchValue: string;
  //
  // // list of search result
  // entityList$: Observable<(CaseModel | ContactModel | ContactOfContactModel | EventModel)[]>;
  // entityListCount$: Observable<IBasicCount>;
  //
  // // models
  // personTypesListMap: { [id: string]: ReferenceDataEntryModel };
  //
  // // constants
  // EntityType = EntityType;
  // UserSettings = UserSettings;
  // ReferenceDataCategory = ReferenceDataCategory;
  // OutbreakModel = OutbreakModel;
  //
  // // subscribers
  // outbreakSubscriber: Subscription;
  //
  // recordActions: HoverRowAction[] = [
  //   // View Item
  //   new HoverRowAction({
  //     icon: 'visibility',
  //     iconTooltip: 'LNG_PAGE_ACTION_VIEW',
  //     linkGenerator: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): string[] => {
  //       return [this.getItemRouterLink(item, 'view')];
  //     },
  //     visible: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): boolean => {
  //       return !item.deleted &&
  //                   this.authUser &&
  //                   this.canViewItem(item);
  //     }
  //   }),
  //
  //   // Modify Item
  //   new HoverRowAction({
  //     icon: 'settings',
  //     iconTooltip: 'LNG_PAGE_ACTION_MODIFY',
  //     linkGenerator: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): string[] => {
  //       return [this.getItemRouterLink(item, 'modify')];
  //     },
  //     visible: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): boolean => {
  //       return !item.deleted &&
  //                   this.authUser &&
  //                   this.canModifyItem(item);
  //     }
  //   })
  // ];
  //
  // /**
  //    * Constructor
  //    */
  // constructor(
  //   protected listHelperService: ListHelperService,
  //   private globalEntitySearchDataService: GlobalEntitySearchDataService,
  //   private outbreakDataService: OutbreakDataService,
  //   private toastV2Service: ToastV2Service,
  //   private referenceDataDataService: ReferenceDataDataService,
  //   private route: ActivatedRoute
  // ) {
  //   super(
  //     listHelperService,
  //     true
  //   );
  // }
  //
  // /**
  //    * Component initialized
  //    */
  // ngOnInit() {
  //   // reference data
  //   const personTypes$ = this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.PERSON_TYPE).pipe(share());
  //   personTypes$.subscribe((personTypeCategory: ReferenceDataCategoryModel) => {
  //     this.personTypesListMap = _.transform(
  //       personTypeCategory.entries,
  //       (result, entry: ReferenceDataEntryModel) => {
  //         // groupBy won't work here since groupBy will put an array instead of one value
  //         result[entry.id] = entry;
  //       },
  //       {}
  //     );
  //   });
  //
  //   // subscribe to the Selected Outbreak Subject stream
  //   this.outbreakSubscriber = this.outbreakDataService
  //     .getSelectedOutbreakSubject()
  //     .subscribe((selectedOutbreak: OutbreakModel) => {
  //       this.selectedOutbreak = selectedOutbreak;
  //
  //       // initialize pagination
  //       this.initPaginator();
  //
  //       // retrieve query params
  //       this.route.queryParams
  //         .subscribe((params: { searchValue }) => {
  //           this.searchValue = _.get(params, 'search');
  //
  //           // ...and re-load the list when the Selected Outbreak is changed
  //           this.needsRefreshList(true);
  //         });
  //     });
  //
  //   // initialize Side Table Columns
  //   this.initializeTableColumns();
  // }
  //
  // /**
  //    * Release resources
  //    */
  // ngOnDestroy() {
  //   // release parent resources
  //   super.onDestroy();
  // }
  //
  // /**
  //    * Initialize Side Table Columns
  //    */
  // initializeTableColumns() {
  //   // default table columns
  //   // this.tableColumns = [
  //   //   new VisibleColumnModel({
  //   //     field: 'id',
  //   //     label: 'LNG_ENTITY_FIELD_LABEL_ID'
  //   //   }),
  //   //   new VisibleColumnModel({
  //   //     field: 'visualId',
  //   //     label: 'LNG_ENTITY_FIELD_LABEL_VISUAL_ID'
  //   //   }),
  //   //   new VisibleColumnModel({
  //   //     field: 'name',
  //   //     label: 'LNG_ENTITY_FIELD_LABEL_NAME'
  //   //   })
  //   // ];
  // }
  //
  // /**
  //  * Initialize process data
  //  */
  // protected initializeProcessSelectedData(): void {}
  //
  // /**
  //  * Initialize table infos
  //  */
  // protected initializeTableInfos(): void {}
  //
  // /**
  //  * Initialize Table Advanced Filters
  //  */
  // protected initializeTableAdvancedFilters(): void {}
  //
  // /**
  //  * Initialize table quick actions
  //  */
  // protected initializeQuickActions(): void {}
  //
  // /**
  //  * Initialize table group actions
  //  */
  // protected initializeGroupActions(): void {}
  //
  // /**
  //  * Initialize table add action
  //  */
  // protected initializeAddAction(): void {}
  //
  // /**
  //  * Initialize table grouped data
  //  */
  // protected initializeGroupedData(): void {}
  //
  // /**
  //  * Initialize breadcrumbs
  //  */
  // initializeBreadcrumbs(): void {
  // }
  //
  // /**
  //  * Fields retrieved from api to reduce payload size
  //  */
  // protected refreshListFields(): string[] {
  //   return [];
  // }

  // /**
  //    * Retrieve Person Type color
  //    */
  // getPersonTypeColor(personType: string) {
  //   const personTypeData = _.get(this.personTypesListMap, personType);
  //   return _.get(personTypeData, 'colorCode', '');
  // }
  //
  // /**
  //    * Check if we can view item
  //    * @param {Object} item
  //    * @returns {boolean}
  //    */
  // canViewItem(item: CaseModel | ContactModel | ContactOfContactModel | EventModel): boolean {
  //   // check if we can modify item
  //   switch (item.type) {
  //     case EntityType.CASE:
  //       return CaseModel.canView(this.authUser);
  //     case EntityType.CONTACT:
  //       return ContactModel.canView(this.authUser);
  //     case EntityType.CONTACT_OF_CONTACT:
  //       return ContactOfContactModel.canModify(this.authUser);
  //     case EntityType.EVENT:
  //       return EventModel.canView(this.authUser);
  //   }
  //
  //   return false;
  // }
  //
  // /**
  //    * Check if we can modify item
  //    * @param {Object} item
  //    * @returns {boolean}
  //    */
  // canModifyItem(item: CaseModel | ContactModel | ContactOfContactModel | EventModel): boolean {
  //   // check if we can modify item
  //   switch (item.type) {
  //     case EntityType.CASE:
  //       return CaseModel.canModify(this.authUser);
  //     case EntityType.CONTACT:
  //       return ContactModel.canModify(this.authUser);
  //     case EntityType.CONTACT_OF_CONTACT:
  //       return ContactOfContactModel.canModify(this.authUser);
  //     case EntityType.EVENT:
  //       return EventModel.canModify(this.authUser);
  //   }
  //
  //   return false;
  // }
  //
  // /**
  //    * Get the link to redirect to view page depending on item type and action
  //    * @param {Object} item
  //    * @param {string} action
  //    * @returns {string}
  //    */
  // getItemRouterLink(item: CaseModel | ContactModel | ContactOfContactModel | EventModel, action: string): string {
  //   switch (item.type) {
  //     case EntityType.CASE:
  //       return `/cases/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
  //     case EntityType.CONTACT:
  //       return `/contacts/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
  //     case EntityType.CONTACT_OF_CONTACT:
  //       return `/contacts-of-contacts/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
  //     case EntityType.EVENT:
  //       return `/events/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
  //   }
  //
  //   return '';
  // }
}
