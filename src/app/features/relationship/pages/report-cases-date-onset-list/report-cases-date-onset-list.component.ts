import { Component, OnDestroy } from '@angular/core';
import { Params } from '@angular/router';
import * as _ from 'lodash';
import { takeUntil, tap } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { CaseModel } from '../../../../core/models/case.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityType } from '../../../../core/models/entity-type';
import { ReportCasesWithOnsetModel } from '../../../../core/models/report-cases-with-onset.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { IV2ColumnToVisibleMandatoryConf } from '../../../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';
import { PersonAndRelatedHelperService } from '../../../../core/services/helper/person-and-related-helper.service';

@Component({
  selector: 'app-report-cases-date-onset-list',
  templateUrl: './report-cases-date-onset-list.component.html'
})
export class ReportCasesDateOnsetListComponent extends ListComponent<ReportCasesWithOnsetModel, IV2ColumnToVisibleMandatoryConf> implements OnDestroy {
  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private personAndRelatedHelperService: PersonAndRelatedHelperService
  ) {
    super(
      listHelperService, {
        disableFilterCaching: true
      }
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
   * Table column - actions
   */
  protected initializeTableColumnActions(): void {
    this.tableColumnActions = {
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
                get: () => 'LNG_PAGE_LIST_CASES_DATE_ONSET_ACTION_VIEW',
                data: (item: ReportCasesWithOnsetModel) => {
                  return {
                    name: item.primaryCase.name
                  };
                }
              },
              action: {
                link: (item: ReportCasesWithOnsetModel) => {
                  return ['/cases', item.primaryCase.id, 'view'];
                },
                linkQueryParams: (): Params => {
                  return {
                    onset: true
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
                get: () => 'LNG_PAGE_LIST_CASES_DATE_ONSET_ACTION_VIEW',
                data: (item: ReportCasesWithOnsetModel) => {
                  return {
                    name: item.secondaryCase.name
                  };
                }
              },
              action: {
                link: (item: ReportCasesWithOnsetModel) => {
                  return ['/cases', item.secondaryCase.id, 'view'];
                },
                linkQueryParams: (): Params => {
                  return {
                    onset: true
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
                get: () => 'LNG_PAGE_LIST_CASES_DATE_ONSET_ACTION_VIEW_RELATIONSHIP'
              },
              action: {
                link: (item: ReportCasesWithOnsetModel) => {
                  const relationTypePath: string = _.find(item.relationship.persons, { id: item.primaryCase.id }).source ? 'contacts' : 'exposures';
                  return ['/relationships', EntityType.CASE, item.primaryCase.id, relationTypePath, item.relationship.id, 'view'];
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
                get: () => 'LNG_PAGE_LIST_CASES_DATE_ONSET_ACTION_MODIFY',
                data: (item: ReportCasesWithOnsetModel) => {
                  return {
                    name: item.primaryCase.name
                  };
                }
              },
              action: {
                link: (item: ReportCasesWithOnsetModel) => {
                  return ['/cases', item.primaryCase.id, 'modify'];
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

            // Modify people 2
            {
              label: {
                get: () => 'LNG_PAGE_LIST_CASES_DATE_ONSET_ACTION_MODIFY',
                data: (item: ReportCasesWithOnsetModel) => {
                  return {
                    name: item.secondaryCase.name
                  };
                }
              },
              action: {
                link: (item: ReportCasesWithOnsetModel) => {
                  return ['/cases', item.secondaryCase.id, 'modify'];
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
                get: () => 'LNG_PAGE_LIST_CASES_DATE_ONSET_ACTION_MODIFY_RELATIONSHIP'
              },
              action: {
                link: (item: ReportCasesWithOnsetModel) => {
                  const relationTypePath: string = _.find(item.relationship.persons, { id: item.primaryCase.id }).source ? 'contacts' : 'exposures';
                  return ['/relationships', EntityType.CASE, item.primaryCase.id, relationTypePath, item.relationship.id, 'modify'];
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
    };
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns(): void {
    this.tableColumns = [
      {
        field: 'primaryCase.firstName',
        label: `${this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_LIST_CASES_LABEL_PRIMARY')} ${this.personAndRelatedHelperService.i18nService.instant('LNG_CASE_FIELD_LABEL_FIRST_NAME')}`,
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.case.visibleMandatoryKey,
          'firstName'
        )
      },
      {
        field: 'primaryCase.lastName',
        label: `${ this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_LIST_CASES_LABEL_PRIMARY') } ${ this.personAndRelatedHelperService.i18nService.instant('LNG_CASE_FIELD_LABEL_LAST_NAME') }`,
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.case.visibleMandatoryKey,
          'lastName'
        )
      },
      {
        field: 'primaryCase.dateOfOnset',
        label: `${ this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_LIST_CASES_LABEL_PRIMARY') } ${ this.personAndRelatedHelperService.i18nService.instant('LNG_CASE_FIELD_LABEL_DATE_OF_ONSET') }`,
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.case.visibleMandatoryKey,
          'dateOfOnset'
        ),
        format: {
          type: V2ColumnFormat.DATE
        }
      },
      {
        field: 'primaryCase.classification',
        label: `${ this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_LIST_CASES_LABEL_PRIMARY') } ${ this.personAndRelatedHelperService.i18nService.instant('LNG_CASE_FIELD_LABEL_CLASSIFICATION') }`,
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.case.visibleMandatoryKey,
          'classification'
        )
      },
      {
        field: 'secondaryCase.firstName',
        label: `${ this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_LIST_CASES_LABEL_SECONDARY') } ${ this.personAndRelatedHelperService.i18nService.instant('LNG_CASE_FIELD_LABEL_FIRST_NAME') }`,
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.case.visibleMandatoryKey,
          'firstName'
        )
      },
      {
        field: 'secondaryCase.lastName',
        label: `${ this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_LIST_CASES_LABEL_SECONDARY') } ${ this.personAndRelatedHelperService.i18nService.instant('LNG_CASE_FIELD_LABEL_LAST_NAME') }`,
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.case.visibleMandatoryKey,
          'lastName'
        )
      },
      {
        field: 'secondaryCase.dateOfOnset',
        label: `${ this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_LIST_CASES_LABEL_SECONDARY') } ${ this.personAndRelatedHelperService.i18nService.instant('LNG_CASE_FIELD_LABEL_DATE_OF_ONSET') }`,
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.case.visibleMandatoryKey,
          'dateOfOnset'
        ),
        format: {
          type: V2ColumnFormat.DATE
        }
      },
      {
        field: 'secondaryCase.classification',
        label: `${ this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_LIST_CASES_LABEL_SECONDARY') } ${ this.personAndRelatedHelperService.i18nService.instant('LNG_CASE_FIELD_LABEL_CLASSIFICATION') }`,
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.case.visibleMandatoryKey,
          'classification'
        )
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
        label: 'LNG_PAGE_LIST_CASES_DATE_ONSET_TITLE',
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
    this.records$ = this.personAndRelatedHelperService.relationship.relationshipDataService
      .getCasesWithDateOnsetBeforePrimaryCase(this.selectedOutbreak.id)
      .pipe(
        // update page count
        tap((casesWithOnset: ReportCasesWithOnsetModel[]) => {
          this.pageCount = {
            count: casesWithOnset.length,
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
