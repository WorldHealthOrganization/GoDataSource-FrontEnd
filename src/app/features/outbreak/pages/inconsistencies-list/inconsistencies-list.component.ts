import { Component, OnDestroy, OnInit } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Observable } from 'rxjs';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { EntityType } from '../../../../core/models/entity-type';
import { InconsistencyModel } from '../../../../core/models/inconsistency.model';
import * as _ from 'lodash';
import { InconsistencyIssueEnum } from '../../../../core/enums/inconsistency-issue.enum';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ActivatedRoute } from '@angular/router';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { catchError, share, tap } from 'rxjs/operators';
import { HoverRowAction } from '../../../../shared/components';
import { throwError } from 'rxjs/internal/observable/throwError';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-inconsistencies-list',
  templateUrl: './inconsistencies-list.component.html'
})
export class InconsistenciesListComponent extends ListComponent implements OnInit, OnDestroy {
  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [];

  // Outbreak
  outbreak: OutbreakModel;

  // entities
  entitiesList$: Observable<(CaseModel | ContactModel | EventModel)[]>;

  personTypesListMap: { [id: string]: ReferenceDataEntryModel };

  // constants
  EntityType = EntityType;
  ReferenceDataCategory = ReferenceDataCategory;

  fixedTableColumns: string[] = [
    'lastName',
    'firstName',
    'inconsistencies'
  ];

  recordActions: HoverRowAction[] = [
    // View Item
    new HoverRowAction({
      icon: 'visibility',
      iconTooltip: 'LNG_PAGE_ACTION_VIEW',
      linkGenerator: (item: CaseModel | ContactModel | EventModel): string[] => {
        return [this.getItemRouterLink(item, 'view')];
      },
      visible: (item: CaseModel | ContactModel | EventModel): boolean => {
        return !item.deleted &&
                    this.authUser &&
                    this.canViewItem(item);
      }
    }),

    // Modify Item
    new HoverRowAction({
      icon: 'settings',
      iconTooltip: 'LNG_PAGE_ACTION_MODIFY',
      linkGenerator: (item: CaseModel | ContactModel | EventModel): string[] => {
        return [this.getItemRouterLink(item, 'modify')];
      },
      visible: (item: CaseModel | ContactModel | EventModel): boolean => {
        return !item.deleted &&
                    this.authUser &&
                    this.outbreak &&
                    this.authUser.activeOutbreakId === this.outbreak.id &&
                    this.canModifyItem(item);
      }
    })
  ];

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private toastV2Service: ToastV2Service,
    private outbreakDataService: OutbreakDataService,
    private i18nService: I18nService,
    private route: ActivatedRoute,
    private referenceDataDataService: ReferenceDataDataService
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // update breadcrumbs
    this.initializeBreadcrumbs();

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

    // retrieve route params
    this.route.params
      .subscribe((params: { outbreakId }) => {
        this.outbreakDataService
          .getOutbreak(params.outbreakId)
          .subscribe((outbreak: OutbreakModel) => {
            // outbreak
            this.outbreak = outbreak;

            // update breadcrumbs
            this.initializeBreadcrumbs();

            // ...and re-load the list when the Selected Outbreak is changed
            this.needsRefreshList(true);
          });
      });
  }

  /**
     * Release resources
     */
  ngOnDestroy() {
    // release parent resources
    super.ngOnDestroy();
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
   * Re(load) list
   */
  refreshList(finishCallback: (records: any[]) => void) {
    if (this.outbreak) {
      this.entitiesList$ = this.outbreakDataService
        .getPeopleInconsistencies(this.outbreak.id, this.queryBuilder)
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            finishCallback([]);
            return throwError(err);
          }),
          tap((data: any[]) => {
            finishCallback(data);
          })
        );
    } else {
      finishCallback([]);
    }
  }

  /**
     * Init breadcrumbs
     */
  // initializeBreadcrumbs() {
  //   // reset
  //   this.breadcrumbs = [];
  //
  //   // add list breadcrumb only if we have permission
  //   if (OutbreakModel.canList(this.authUser)) {
  //     this.breadcrumbs.push(
  //       new BreadcrumbItemModel('LNG_PAGE_LIST_OUTBREAKS_TITLE', '/outbreaks')
  //     );
  //   }
  //
  //   // add outbreak details ?
  //   if (this.outbreak) {
  //     if (OutbreakModel.canModify(this.authUser)) {
  //       this.breadcrumbs.push(
  //         new BreadcrumbItemModel(
  //           this.outbreak.name,
  //           `/outbreaks/${this.outbreak.id}/modify`
  //         )
  //       );
  //     } else if (OutbreakModel.canView(this.authUser)) {
  //       this.breadcrumbs.push(
  //         new BreadcrumbItemModel(
  //           this.outbreak.name,
  //           `/outbreaks/${this.outbreak.id}/view`
  //         )
  //       );
  //     }
  //   }
  //
  //   // add inconsistencies breadcrumb
  //   this.breadcrumbs.push(
  //     new BreadcrumbItemModel(
  //       'LNG_PAGE_LIST_INCONSISTENCIES_TITLE',
  //       '.',
  //       true
  //     )
  //   );
  // }

  /**
     * Retrieve Person Type color
     */
  getPersonTypeColor(personType: string) {
    const personTypeData = _.get(this.personTypesListMap, personType);
    return _.get(personTypeData, 'colorCode', '');
  }

  /**
     * Get the link to redirect to view page depending on item type and action
     * @param {Object} item
     * @param {string} action
     * @returns {string}
     */
  getItemRouterLink (item: CaseModel | ContactModel | EventModel, action: string) {
    switch (item.type) {
      case EntityType.CASE:
        return `/cases/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
      case EntityType.CONTACT:
        return `/contacts/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
      case EntityType.EVENT:
        return `/events/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
    }
  }

  /**
     * Check if we can view item
     * @param {Object} item
     * @returns {boolean}
     */
  canViewItem(item: CaseModel | ContactModel | EventModel): boolean {
    // check if we can modify item
    switch (item.type) {
      case EntityType.CASE:
        return CaseModel.canView(this.authUser);
      case EntityType.CONTACT:
        return ContactModel.canView(this.authUser);
      case EntityType.EVENT:
        return EventModel.canView(this.authUser);
    }

    // :)
    return false;
  }

  /**
     * Check if we can modify item
     * @param {Object} item
     * @returns {boolean}
     */
  canModifyItem(item: CaseModel | ContactModel | EventModel): boolean {
    // check if we can modify item
    switch (item.type) {
      case EntityType.CASE:
        return CaseModel.canModify(this.authUser);
      case EntityType.CONTACT:
        return ContactModel.canModify(this.authUser);
      case EntityType.EVENT:
        return EventModel.canModify(this.authUser);
    }

    // :)
    return false;
  }

  /**
     * Inconsistencies
     * @param item
     */
  inconsistencyToText(item: CaseModel | ContactModel | EventModel): string {
    // construct inconsistencies text
    let text: string = '';
    _.each(item.inconsistencies, (inconsistency: InconsistencyModel) => {
      // determine label
      let label: string;
      switch (inconsistency.issue) {
        case InconsistencyIssueEnum.LNG_PAGE_INCONSISTENCY_LABEL_BIGGER:
          label = 'LNG_PAGE_INCONSISTENCY_LABEL_BIGGER';
          break;
        case InconsistencyIssueEnum.LNG_PAGE_INCONSISTENCY_LABEL_BIGGER_OR_EQUAL:
          label = 'LNG_PAGE_INCONSISTENCY_LABEL_BIGGER_OR_EQUAL';
          break;
        case InconsistencyIssueEnum.LNG_PAGE_INCONSISTENCY_LABEL_SMALLER:
          label = 'LNG_PAGE_INCONSISTENCY_LABEL_SMALLER';
          break;
        case InconsistencyIssueEnum.LNG_PAGE_INCONSISTENCY_LABEL_SMALLER_OR_EQUAL:
          label = 'LNG_PAGE_INCONSISTENCY_LABEL_SMALLER_OR_EQUAL';
          break;
        case InconsistencyIssueEnum.LNG_PAGE_INCONSISTENCY_LABEL_NOT_EQUAL:
          label = 'LNG_PAGE_INCONSISTENCY_LABEL_NOT_EQUAL';
          break;
        case InconsistencyIssueEnum.LNG_PAGE_INCONSISTENCY_LABEL_EQUAL:
          label = 'LNG_PAGE_INCONSISTENCY_LABEL_EQUAL';
          break;
      }

      // translate label
      label = this.i18nService.instant(
        label, {
          date1: inconsistency.dates.length > 0 ? this.i18nService.instant(inconsistency.dates[0].label) : '-',
          date2: inconsistency.dates.length > 1 ? this.i18nService.instant(inconsistency.dates[1].label) : '-'
        }
      );

      // append inconsistency
      text += (text.length < 1 ? '' : ' / ') + label;
    });

    // finished
    return text;
  }
}
