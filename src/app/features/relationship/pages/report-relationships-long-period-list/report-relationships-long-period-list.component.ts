import { Component, OnDestroy } from '@angular/core';
import { Params } from '@angular/router';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { CaseModel } from '../../../../core/models/case.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { RelationshipModel, ReportDifferenceOnsetRelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityType } from '../../../../core/models/entity-type';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';

@Component({
  selector: 'app-report-relationships-long-period',
  templateUrl: './report-relationships-long-period-list.component.html'
})
export class ReportRelationshipsLongPeriodListComponent extends ListComponent implements OnDestroy {
  // list of long periods in the dates of onset between cases in the chain of transmission i.e. indicate where an intermediate contact may have been missed
  relationshipList$: Observable<ReportDifferenceOnsetRelationshipModel[]>;

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private relationshipDataService: RelationshipDataService
  ) {
    super(
      listHelperService,
      true
    );
  }

  /**
   * Component destroyed
   */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
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
        field: 'people[0].model.firstName',
        label: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
        format: {
          type: 'people[0].model.firstName'
        }
      },
      {
        field: 'people[0].model.lastName',
        label: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
        format: {
          type: 'people[0].model.lastName'
        }
      },
      {
        field: 'people[0].model.dateOfOnset',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
        format: {
          type: V2ColumnFormat.DATE
        }
      },
      {
        field: 'people[1].model.firstName',
        label: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
        format: {
          type: 'people[1].model.firstName'
        }
      },
      {
        field: 'people[1].model.lastName',
        label: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
        format: {
          type: 'people[1].model.lastName'
        }
      },
      {
        field: 'people[1].model.dateOfOnset',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
        format: {
          type: V2ColumnFormat.DATE
        }
      },
      {
        field: 'differenceBetweenDatesOfOnset',
        label: 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_LABEL_DIFFERENCE_BETWEEN_DATES'
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
          // Other actions
          {
            type: V2ActionType.MENU,
            icon: 'more_horiz',
            menuOptions: [
              // View people 1
              {
                label: {
                  get: () => 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_VIEW',
                  data: (item: ReportDifferenceOnsetRelationshipModel) => {
                    return {
                      name: item.people[0].model.name
                    };
                  }
                },
                action: {
                  link: (item: ReportDifferenceOnsetRelationshipModel) => {
                    return ['/cases', item.people[0].model.id, 'view'];
                  },
                  linkQueryParams: (): Params => {
                    return {
                      longPeriod: true
                    };
                  }
                },
                visible: () => {
                  return CaseModel.canView(this.authUser);
                }
              },

              // View people 2
              {
                label: {
                  get: () => 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_VIEW',
                  data: (item: ReportDifferenceOnsetRelationshipModel) => {
                    return {
                      name: item.people[1].model.name
                    };
                  }
                },
                action: {
                  link: (item: ReportDifferenceOnsetRelationshipModel) => {
                    return ['/cases', item.people[1].model.id, 'view'];
                  },
                  linkQueryParams: (): Params => {
                    return {
                      longPeriod: true
                    };
                  }
                },
                visible: () => {
                  return CaseModel.canView(this.authUser);
                }
              },

              // View relationship
              {
                label: {
                  get: () => 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_VIEW_RELATIONSHIP'
                },
                action: {
                  link: (item: ReportDifferenceOnsetRelationshipModel) => {
                    // #TODO TBD - if this is correct !? (old comment)
                    const relationTypePath: string = _.find(item.persons, { id: item.people[0].model.id }).source ? 'contacts' : 'exposures';
                    return ['/relationships', EntityType.CASE, item.people[0].model.id, relationTypePath, item.id, 'view'];
                  }
                },
                visible: () => {
                  return RelationshipModel.canView(this.authUser);
                }
              },

              // Divider
              {
                visible: () => {
                  return CaseModel.canView(this.authUser) ||
                    RelationshipModel.canView(this.authUser);
                }
              },

              // Modify people 1
              {
                label: {
                  get: () => 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_MODIFY',
                  data: (item: ReportDifferenceOnsetRelationshipModel) => {
                    return {
                      name: item.people[0].model.name
                    };
                  }
                },
                action: {
                  link: (item: ReportDifferenceOnsetRelationshipModel) => {
                    return ['/cases', item.people[0].model.id, 'modify'];
                  },
                  linkQueryParams: (): Params => {
                    return {
                      longPeriod: true
                    };
                  }
                },
                visible: () => {
                  return this.selectedOutbreakIsActive &&
                    CaseModel.canModify(this.authUser);
                }
              },

              // Modify people 2
              {
                label: {
                  get: () => 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_MODIFY',
                  data: (item: ReportDifferenceOnsetRelationshipModel) => {
                    return {
                      name: item.people[1].model.name
                    };
                  }
                },
                action: {
                  link: (item: ReportDifferenceOnsetRelationshipModel) => {
                    return ['/cases', item.people[1].model.id, 'modify'];
                  },
                  linkQueryParams: (): Params => {
                    return {
                      onset: true
                    };
                  }
                },
                visible: () => {
                  return this.selectedOutbreakIsActive &&
                    CaseModel.canModify(this.authUser);
                }
              },

              // Modify relationship
              {
                label: {
                  get: () => 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_ACTION_MODIFY_RELATIONSHIP'
                },
                action: {
                  link: (item: ReportDifferenceOnsetRelationshipModel) => {
                    // #TODO TBD - if this is correct !? (old comment)
                    const relationTypePath: string = _.find(item.persons, { id: item.people[0].model.id }).source ? 'contacts' : 'exposures';
                    return ['/relationships', EntityType.CASE, item.people[0].model.id, relationTypePath, item.id, 'modify'];
                  }
                },
                visible: () => {
                  return this.selectedOutbreakIsActive &&
                    RelationshipModel.canModify(this.authUser);
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
  protected initializeTableAdvancedFilters(): void {}

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
  protected initializeAddAction(): void {}

  /**
   * Initialize table grouped data
   */
  protected initializeGroupedData(): void {}

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {
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

    // cases list
    if (CaseModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CASES_TITLE',
        action: {
          link: ['/cases']
        }
      });
    }

    // current page
    this.breadcrumbs.push(
      {
        label: 'LNG_PAGE_LIST_LONG_PERIOD_BETWEEN_ONSET_DATES_TITLE',
        action: null
      }
    );
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the Cases list, based on the applied filter, sort criterias
   */
  refreshList() {
    // retrieve the list
    this.relationshipList$ = this.relationshipDataService
      .getLongPeriodBetweenDateOfOnset(this.selectedOutbreak.id)
      .pipe(
        // update page count
        tap((relationshipList: ReportDifferenceOnsetRelationshipModel[]) => {
          this.pageCount = {
            count: relationshipList.length,
            hasMore: false
          };
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(): void {}
}
