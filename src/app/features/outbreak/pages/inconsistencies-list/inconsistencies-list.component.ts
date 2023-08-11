import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { takeUntil, tap } from 'rxjs/operators';
import { InconsistencyIssueEnum } from '../../../../core/enums/inconsistency-issue.enum';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { EntityType } from '../../../../core/models/entity-type';
import { EventModel } from '../../../../core/models/event.model';
import { InconsistencyModel } from '../../../../core/models/inconsistency.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';

@Component({
  selector: 'app-inconsistencies-list',
  templateUrl: './inconsistencies-list.component.html'
})
export class InconsistenciesListComponent extends ListComponent<CaseModel | ContactModel | EventModel | ContactOfContactModel> implements OnDestroy {
  // Outbreak
  private _outbreak: OutbreakModel;

  /**
  * Constructor
  */
  constructor(
    protected listHelperService: ListHelperService,
    private outbreakDataService: OutbreakDataService,
    private i18nService: I18nService,
    private route: ActivatedRoute
  ) {
    // parent
    super(
      listHelperService, {
        disableFilterCaching: true,
        disableWaitForSelectedOutbreakToRefreshList: true
      }
    );

    // get data
    this._outbreak = this.route.snapshot.data.outbreak.map[this.route.snapshot.params.outbreakId];
  }

  /**
   * Release resources
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
    // this page doesn't have pagination

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
        // View
        {
          type: V2ActionType.ICON,
          icon: 'visibility',
          iconTooltip: 'LNG_PAGE_ACTION_VIEW',
          action: {
            link: (item: CaseModel | ContactModel | EventModel): string[] => {
              return [this.getItemRouterLink(item, 'view')];
            }
          },
          visible: (item: CaseModel | ContactModel | EventModel): boolean => {
            return !item.deleted &&
              item.canView(this.authUser) &&
              this.selectedOutbreak?.id === item.outbreakId;
          }
        },

        // Modify
        {
          type: V2ActionType.ICON,
          icon: 'edit',
          iconTooltip: 'LNG_PAGE_ACTION_MODIFY',
          action: {
            link: (item: CaseModel | ContactModel | EventModel): string[] => {
              return [this.getItemRouterLink(item, 'modify')];
            }
          },
          visible: (item: CaseModel | ContactModel | EventModel): boolean => {
            return !item.deleted &&
              this.selectedOutbreakIsActive &&
              item.canModify(this.authUser) &&
              this.selectedOutbreak?.id === item.outbreakId;
          }
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
        field: 'firstName',
        label: 'LNG_ENTITY_FIELD_LABEL_FIRST_NAME',
        color: 'warn',
        format: {
          type: (item) => item.type === EntityType.EVENT ? item.name : item.firstName
        },
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'lastName',
        label: 'LNG_ENTITY_FIELD_LABEL_LAST_NAME',
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'inconsistencies',
        label: 'LNG_ENTITY_FIELD_LABEL_INCONSISTENCIES',
        format: {
          type: (item) => this.inconsistencyToText(item)
        }
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
            items: (this.route.snapshot.data.personType as IResolverV2ResponseModel<ReferenceDataEntryModel>).list.map((item) => {
              return {
                form: {
                  type: IV2ColumnStatusFormType.CIRCLE,
                  color: item.getColorCode()
                },
                label: item.id,
                order: item.order
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
            (this.route.snapshot.data.personType as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[data.type]
          ) {
            forms.push({
              type: IV2ColumnStatusFormType.CIRCLE,
              color: (this.route.snapshot.data.personType as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[data.type].getColorCode(),
              tooltip: this.i18nService.instant(data.type)
            });
          } else {
            forms.push({
              type: IV2ColumnStatusFormType.EMPTY
            });
          }

          // finished
          return forms;
        }
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
      }
    ];

    // add list breadcrumb only if we have permission
    if (OutbreakModel.canList(this.authUser)) {
      this.breadcrumbs.push(
        {
          label: 'LNG_PAGE_LIST_OUTBREAKS_TITLE',
          action: {
            link: ['/outbreaks']
          }
        }
      );
    }

    // add outbreak details ?
    if (OutbreakModel.canModify(this.authUser)) {
      this.breadcrumbs.push(
        {
          label: this._outbreak.name,
          action: {
            link: [`/outbreaks/${ this._outbreak.id }/modify`]
          }
        }
      );
    } else if (OutbreakModel.canView(this.authUser)) {
      this.breadcrumbs.push(
        {
          label: this._outbreak.name,
          action: {
            link: [`/outbreaks/${ this._outbreak.id }/view`]
          }
        }
      );
    }

    // add inconsistencies breadcrumb
    this.breadcrumbs.push(
      {
        label: 'LNG_PAGE_LIST_INCONSISTENCIES_TITLE',
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
   * Re(load) list
   */
  refreshList() {
    // remove paginator
    this.queryBuilder.paginator.clear();

    // retrieve data
    this.records$ = this.outbreakDataService
      .getPeopleInconsistencies(this._outbreak.id, this.queryBuilder)
      .pipe(
        // update page count
        tap((entitiesList: []) => {
          this.pageCount = {
            count: entitiesList.length,
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
  refreshListCount(): void { }

  /**
   * Get the link to redirect to view page depending on item type and action
   */
  private getItemRouterLink(
    item: CaseModel | ContactModel | EventModel,
    action: string
  ) {
    switch (item.type) {
      case EntityType.CASE:
        return `/cases/${item.id}/${action}`;
      case EntityType.CONTACT:
        return `/contacts/${item.id}/${action}`;
      case EntityType.EVENT:
        return `/events/${item.id}/${action}`;
    }
  }

  /**
   * Inconsistencies
   */
  private inconsistencyToText(item: CaseModel | ContactModel | EventModel): string {
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
          date1: inconsistency.dates.length > 0 ? this.i18nService.instant(inconsistency.dates[0].label) : '—',
          date2: inconsistency.dates.length > 1 ? this.i18nService.instant(inconsistency.dates[1].label) : '—'
        }
      );

      // append inconsistency
      text += (text.length < 1 ? '' : ' / ') + label;
    });

    // finished
    return text;
  }
}
