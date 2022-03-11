import {
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { UserSettings } from '../../../../core/models/user.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import * as _ from 'lodash';
import {
  catchError,
  share,
  tap
} from 'rxjs/operators';
import { HoverRowAction } from '../../../../shared/components';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { GlobalEntitySearchDataService } from '../../../../core/services/data/global-entity-search.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { EntityType } from '../../../../core/models/entity-type';
import {
  ReferenceDataCategory,
  ReferenceDataCategoryModel,
  ReferenceDataEntryModel
} from '../../../../core/models/reference-data.model';

import {
  Observable,
  Subscription,
  throwError
} from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-search-result-list',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './search-result-list.component.html',
  styleUrls: ['./search-result-list.less']
})
export class SearchResultListComponent extends ListComponent implements OnInit, OnDestroy {
  // Breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [
  //   new BreadcrumbItemModel('LNG_PAGE_LIST_SEARCH_RESULT_TITLE', '.', true)
  // ];

  searchValue: string;

  // list of search result
  entityList$: Observable<(CaseModel | ContactModel | ContactOfContactModel | EventModel)[]>;
  entityListCount$: Observable<IBasicCount>;

  // models
  personTypesListMap: { [id: string]: ReferenceDataEntryModel };

  // constants
  EntityType = EntityType;
  UserSettings = UserSettings;
  ReferenceDataCategory = ReferenceDataCategory;
  OutbreakModel = OutbreakModel;

  // subscribers
  outbreakSubscriber: Subscription;

  recordActions: HoverRowAction[] = [
    // View Item
    new HoverRowAction({
      icon: 'visibility',
      iconTooltip: 'LNG_PAGE_ACTION_VIEW',
      linkGenerator: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): string[] => {
        return [this.getItemRouterLink(item, 'view')];
      },
      visible: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): boolean => {
        return !item.deleted &&
                    this.authUser &&
                    this.canViewItem(item);
      }
    }),

    // Modify Item
    new HoverRowAction({
      icon: 'settings',
      iconTooltip: 'LNG_PAGE_ACTION_MODIFY',
      linkGenerator: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): string[] => {
        return [this.getItemRouterLink(item, 'modify')];
      },
      visible: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): boolean => {
        return !item.deleted &&
                    this.authUser &&
                    this.canModifyItem(item);
      }
    })
  ];

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private globalEntitySearchDataService: GlobalEntitySearchDataService,
    private outbreakDataService: OutbreakDataService,
    private toastV2Service: ToastV2Service,
    private referenceDataDataService: ReferenceDataDataService,
    private route: ActivatedRoute
  ) {
    super(
      listHelperService,
      true
    );
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // reference data
    const personTypes$ = this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.PERSON_TYPE).pipe(share());
    personTypes$.subscribe((personTypeCategory: ReferenceDataCategoryModel) => {
      this.personTypesListMap = _.transform(
        personTypeCategory.entries,
        (result, entry: ReferenceDataEntryModel) => {
          // groupBy won't work here since groupBy will put an array instead of one value
          result[entry.id] = entry;
        },
        {}
      );
    });

    // subscribe to the Selected Outbreak Subject stream
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        this.selectedOutbreak = selectedOutbreak;

        // initialize pagination
        this.initPaginator();

        // retrieve query params
        this.route.queryParams
          .subscribe((params: { searchValue }) => {
            this.searchValue = _.get(params, 'search');

            // ...and re-load the list when the Selected Outbreak is changed
            this.needsRefreshList(true);
          });
      });

    // initialize Side Table Columns
    this.initializeTableColumns();
  }

  /**
     * Release resources
     */
  ngOnDestroy() {
    // release parent resources
    super.ngOnDestroy();
  }

  /**
     * Initialize Side Table Columns
     */
  initializeTableColumns() {
    // default table columns
    // this.tableColumns = [
    //   new VisibleColumnModel({
    //     field: 'id',
    //     label: 'LNG_ENTITY_FIELD_LABEL_ID'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'visualId',
    //     label: 'LNG_ENTITY_FIELD_LABEL_VISUAL_ID'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'name',
    //     label: 'LNG_ENTITY_FIELD_LABEL_NAME'
    //   })
    // ];
  }

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  refreshListFields(): string[] {
    return [];
  }

  /**
   * Refresh list
   */
  refreshList(finishCallback: (records: any[]) => void) {
    if (
      this.selectedOutbreak &&
            !_.isEmpty(this.searchValue)
    ) {
      // retrieve the list of entities
      this.entityList$ = this.globalEntitySearchDataService
        .searchEntity(
          this.selectedOutbreak.id,
          this.searchValue,
          this.queryBuilder
        )
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            finishCallback([]);
            return throwError(err);
          }),
          tap(this.checkEmptyList.bind(this)),
          tap((data: any[]) => {
            finishCallback(data);
          })
        );
    } else {
      finishCallback([]);
    }
  }

  /**
     * Get total number of items
     */
  refreshListCount(applyHasMoreLimit?: boolean) {
    if (
      this.selectedOutbreak &&
            !_.isEmpty(this.searchValue)
    ) {
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
      this.entityListCount$ = this.globalEntitySearchDataService
        .searchEntityCount(
          this.selectedOutbreak.id,
          this.searchValue,
          countQueryBuilder
        )
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            return throwError(err);
          }),
          share()
        );
    } else {
      // do not fetch any item
      this.entityListCount$ = new Observable((observer) => {
        observer.next({count: 0});
        observer.complete();
        return;
      });
    }
  }

  /**
     * Retrieve Person Type color
     */
  getPersonTypeColor(personType: string) {
    const personTypeData = _.get(this.personTypesListMap, personType);
    return _.get(personTypeData, 'colorCode', '');
  }

  /**
     * Check if we can view item
     * @param {Object} item
     * @returns {boolean}
     */
  canViewItem(item: CaseModel | ContactModel | ContactOfContactModel | EventModel): boolean {
    // check if we can modify item
    switch (item.type) {
      case EntityType.CASE:
        return CaseModel.canView(this.authUser);
      case EntityType.CONTACT:
        return ContactModel.canView(this.authUser);
      case EntityType.CONTACT_OF_CONTACT:
        return ContactOfContactModel.canModify(this.authUser);
      case EntityType.EVENT:
        return EventModel.canView(this.authUser);
    }

    return false;
  }

  /**
     * Check if we can modify item
     * @param {Object} item
     * @returns {boolean}
     */
  canModifyItem(item: CaseModel | ContactModel | ContactOfContactModel | EventModel): boolean {
    // check if we can modify item
    switch (item.type) {
      case EntityType.CASE:
        return CaseModel.canModify(this.authUser);
      case EntityType.CONTACT:
        return ContactModel.canModify(this.authUser);
      case EntityType.CONTACT_OF_CONTACT:
        return ContactOfContactModel.canModify(this.authUser);
      case EntityType.EVENT:
        return EventModel.canModify(this.authUser);
    }

    return false;
  }

  /**
     * Get the link to redirect to view page depending on item type and action
     * @param {Object} item
     * @param {string} action
     * @returns {string}
     */
  getItemRouterLink(item: CaseModel | ContactModel | ContactOfContactModel | EventModel, action: string): string {
    switch (item.type) {
      case EntityType.CASE:
        return `/cases/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
      case EntityType.CONTACT:
        return `/contacts/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
      case EntityType.CONTACT_OF_CONTACT:
        return `/contacts-of-contacts/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
      case EntityType.EVENT:
        return `/events/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
    }

    return '';
  }
}
