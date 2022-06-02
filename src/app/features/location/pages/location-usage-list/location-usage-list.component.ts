import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, takeUntil, tap } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { EventModel } from '../../../../core/models/event.model';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { LocationUsageModel, UsageDetails, UsageDetailsItem } from '../../../../core/models/location-usage.model';
import { LocationModel } from '../../../../core/models/location.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';

@Component({
  selector: 'app-location-usage-list',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './location-usage-list.component.html',
  styleUrls: ['./location-usage-list.component.less']
})
export class LocationUsageListComponent extends ListComponent<any> implements OnDestroy {
  // location
  locationId: string;
  locationData: LocationModel;

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private locationDataService: LocationDataService,
    protected activatedRoute: ActivatedRoute,
    public i18nService: I18nService
  ) {
    super(listHelperService);

    // get location for which we need to retrieve usages
    this.locationId = this.activatedRoute.snapshot.params.locationId;

    // retrieve location
    this.locationDataService
      .getLocation(this.locationId)
      .subscribe((location: LocationModel) => {
        // location data
        this.locationData = location;

        // update breadcrumbs
        this.initializeBreadcrumbs();

        // get usage list
        this.needsRefreshList(true);
      });
  }

  /**
   * Release resources
   */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
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
          // View Case
          {
            type: V2ActionType.ICON,
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_ACTION_VIEW',
            // TODO: Needs disabledTooltip
            // disabledTooltip: 'LNG_PAGE_LIST_USAGE_LOCATIONS_NOT_SELECTED_OUTBREAK',
            action: {
              link: (item: UsageDetailsItem): string[] => {
                return [item.viewUrl];
              }
            },
            visible: (item: UsageDetailsItem): boolean => {
              return item.typePermissions &&
                item.typePermissions.canView(this.authUser) &&
                !!item.outbreakId &&
                !!item.outbreakName;
            },
            disable: (item: UsageDetailsItem): boolean => {
              return !this.selectedOutbreak ||
              item.outbreakId !== this.selectedOutbreak.id;
            }
          },

          // Modify Case
          {
            type: V2ActionType.ICON,
            icon: 'edit',
            iconTooltip: 'LNG_PAGE_ACTION_MODIFY',
            // TODO: Needs disabledTooltip
            // disabledTooltip: 'LNG_PAGE_LIST_USAGE_LOCATIONS_NOT_SELECTED_OUTBREAK',
            action: {
              link: (item: UsageDetailsItem): string[] => {
                return [item.modifyUrl];
              }
            },
            visible: (item: UsageDetailsItem): boolean => {
              return item.typePermissions &&
                item.typePermissions.canModify(this.authUser) &&
                !!item.outbreakId &&
                item.outbreakId === this.authUser.activeOutbreakId;
            },
            disable: (item: UsageDetailsItem): boolean => {
              return !this.selectedOutbreak ||
                item.outbreakId !== this.selectedOutbreak.id;
            }
          }
        ]
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
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_LOCATIONS_TITLE',
        action: {
          link: ['/locations']
        }
      });
    }

    // usage breadcrumb
    this.breadcrumbs.push({
      label: this.i18nService.instant('LNG_PAGE_LIST_USAGE_LOCATIONS_TITLE', this.locationData ? { name: this.locationData.name } : '?'),
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
    if (this.locationId) {
      // retrieve usages of a location
      this.records$ = this.locationDataService
        .getLocationUsage(this.locationId)
        .pipe(
          map((locationUsage: LocationUsageModel) => {
            // remove keys if we don't have rights
            // #TODO - not sure if this is how it should be... (OLD COMMENT)

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

            // cases
            if (!CaseModel.canList(this.authUser)) {
              locationUsage.case = [];
            }

            // create usage list
            return new UsageDetails(locationUsage, (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).map).items;
          }),

          // update page count
          tap((usageDetails: []) => {
            this.pageCount = {
              count: usageDetails.length,
              hasMore: false
            };
          }),

          // TODO: Should be deleted?
          // Constants.DEFAULT_USAGE_MAX_RECORDS_DISPLAYED,

          // should be the last pipe
          takeUntil(this.destroyed$)
        );
    }
  }

  /**
 * Get total number of items, based on the applied filters
 */
  refreshListCount() {}
}
