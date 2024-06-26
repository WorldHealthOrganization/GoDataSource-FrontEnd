import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { EventModel } from '../../../../core/models/event.model';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import {
  LocationUsageModel,
  UsageDetails,
  UsageDetailsItem,
  UsageDetailsItemType
} from '../../../../core/models/location-usage.model';
import { LocationModel } from '../../../../core/models/location.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2Column, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { HierarchicalLocationModel } from '../../../../core/models/hierarchical-location.model';
import { TeamModel } from '../../../../core/models/team.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';

@Component({
  selector: 'app-location-usage-list',
  templateUrl: './location-usage-list.component.html'
})
export class LocationUsageListComponent extends ListComponent<any, IV2Column> implements OnDestroy {
  // location
  private _locationId: string;
  private _parentLocationTree: HierarchicalLocationModel;
  locationName: {
    name: string
  } = {
      name: ''
    };

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    protected locationDataService: LocationDataService,
    protected activatedRoute: ActivatedRoute,
    protected i18nService: I18nService
  ) {
    // parent
    super(listHelperService);

    // get location for which we need to retrieve usages
    this._locationId = this.activatedRoute.snapshot.params.locationId;
    this._parentLocationTree = this.activatedRoute.snapshot.data.parentLocationTree;
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
    // already in process of refresh ?
    if (!this.tableColumns?.length) {
      return;
    }

    // redo buttons visibility
    this.tableV2Component.agTable?.api.redrawRows();
  }

  /**
   * Component initialized
   */
  initialized(): void {
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
        // View
        {
          type: V2ActionType.ICON,
          icon: 'visibility',
          iconTooltip: 'LNG_PAGE_ACTION_VIEW',
          action: {
            link: (item: UsageDetailsItem): string[] => {
              return [item.viewUrl];
            }
          },
          visible: (item: UsageDetailsItem): boolean => {
            return item.typePermissions &&
              item.typePermissions.canView(this.authUser) &&
              (
                (
                  item.type === UsageDetailsItemType.OUTBREAK ||
                  item.type === UsageDetailsItemType.TEAM
                ) || (
                  !!item.outbreakId &&
                  !!item.outbreakName &&
                  this.selectedOutbreak?.id &&
                  item.outbreakId === this.selectedOutbreak.id
                )
              );
          }
        },

        // Modify
        {
          type: V2ActionType.ICON,
          icon: 'edit',
          iconTooltip: 'LNG_PAGE_ACTION_MODIFY',
          action: {
            link: (item: UsageDetailsItem): string[] => {
              return [item.modifyUrl];
            }
          },
          visible: (item: UsageDetailsItem): boolean => {
            return item.typePermissions &&
              item.typePermissions.canModify(this.authUser) &&
              (
                (
                  item.type === UsageDetailsItemType.OUTBREAK ||
                  item.type === UsageDetailsItemType.TEAM
                ) || (
                  !!item.outbreakId &&
                  !!item.outbreakName &&
                  this.selectedOutbreak?.id &&
                  item.outbreakId === this.selectedOutbreak.id &&
                  item.outbreakId === this.authUser.activeOutbreakId
                )
              );
          }
        }
      ]
    };
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns(): void {
    // default table columns
    this.tableColumns = [
      {
        field: 'typeLabel',
        label: 'LNG_PAGE_LIST_USAGE_LOCATIONS_TYPE_LABEL_TYPE'
      },
      {
        field: 'name',
        label: 'LNG_PAGE_LIST_USAGE_LOCATIONS_TYPE_LABEL_NAME'
      },
      {
        field: 'outbreakName',
        label: 'LNG_PAGE_LIST_USAGE_LOCATIONS_TYPE_LABEL_OUTBREAK'
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
    if (LocationModel.canList(this.authUser)) {
      // root
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_LOCATIONS_TITLE',
        action: {
          link: ['/locations']
        }
      });

      // list parents ?
      if (this._parentLocationTree) {
        // add tree
        let tree: HierarchicalLocationModel = this._parentLocationTree;
        while (tree) {
          // add to list
          if (tree.location?.id) {
            // our location ?
            if (tree.location?.id === this._locationId) {
              this.locationName = {
                name: tree.location.name
              };
            }

            // add to list
            this.breadcrumbs.push({
              label: tree.location.name,
              action: {
                link: ['/locations', tree.location.id, 'children']
              }
            });
          }

          // next
          tree = tree.children?.length > 0 ?
            tree.children[0] :
            undefined;
        }
      }
    }

    // usage breadcrumb
    this.breadcrumbs.push({
      label: this.i18nService.instant(
        'LNG_PAGE_LIST_USAGE_LOCATIONS_TITLE',
        this.locationName
      ),
      action: null
    });
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the list
   */
  refreshList() {
    // retrieve usages of a location
    this.records$ = this.locationDataService
      .getLocationUsage(this._locationId)
      .pipe(
        map((locationUsage: LocationUsageModel) => {
          // follow-ups
          if (!FollowUpModel.canList(this.authUser)) {
            locationUsage.followUp = [];
          }

          // events
          if (!EventModel.canList(this.authUser)) {
            locationUsage.event = [];
          }

          // contacts
          if (!ContactModel.canList(this.authUser)) {
            locationUsage.contact = [];
          }

          // contacts of contacts
          if (!ContactOfContactModel.canList(this.authUser)) {
            locationUsage.contactOfContact = [];
          }

          // cases
          if (!CaseModel.canList(this.authUser)) {
            locationUsage.case = [];
          }

          // teams
          if (!TeamModel.canList(this.authUser)) {
            locationUsage.team = [];
          }

          // outbreaks
          if (!OutbreakModel.canList(this.authUser)) {
            locationUsage.outbreak = [];
          }

          // create usage
          const usageDetails = new UsageDetails(
            locationUsage,
            (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).map
          );

          // update page count
          this.pageCount = {
            count: usageDetails.items.length,
            hasMore: false
          };

          // create usage list
          // - max 1000
          return usageDetails.items.slice(0, this.pageSize);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
 * Get total number of items, based on the applied filters
 */
  refreshListCount() {}
}
