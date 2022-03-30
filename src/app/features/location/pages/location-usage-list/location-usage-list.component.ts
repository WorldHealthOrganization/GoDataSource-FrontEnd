import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ActivatedRoute } from '@angular/router';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { LocationUsageModel, UsageDetails, UsageDetailsItem } from '../../../../core/models/location-usage.model';
import { LocationModel } from '../../../../core/models/location.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import * as _ from 'lodash';
import { Constants } from '../../../../core/models/constants';
import { HoverRowAction } from '../../../../shared/components';
import { EventModel } from '../../../../core/models/event.model';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs/internal/observable/throwError';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-location-usage-list',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './location-usage-list.component.html',
  styleUrls: ['./location-usage-list.component.less']
})
export class LocationUsageListComponent extends ListComponent implements OnInit, OnDestroy {
  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [];

  locationId: string;
  locationData: LocationModel;

  usageDetailsList: UsageDetailsItem[];
  usageDetailsListMore: {
    displayed: number,
    total: number
  };

  fixedTableColumns: string[] = [
    'type',
    'name',
    'outbreakName'
  ];

  // selected outbreak
  outbreakSubscriber: Subscription;

  recordActions: HoverRowAction[] = [
    // View Item
    new HoverRowAction({
      icon: 'visibility',
      iconTooltip: 'LNG_PAGE_ACTION_VIEW',
      disabledTooltip: 'LNG_PAGE_LIST_USAGE_LOCATIONS_NOT_SELECTED_OUTBREAK',
      linkGenerator: (item: UsageDetailsItem): string[] => {
        return [item.viewUrl];
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
    }),

    // Modify Item
    new HoverRowAction({
      icon: 'settings',
      iconTooltip: 'LNG_PAGE_ACTION_MODIFY',
      disabledTooltip: 'LNG_PAGE_LIST_USAGE_LOCATIONS_NOT_SELECTED_OUTBREAK',
      linkGenerator: (item: UsageDetailsItem): string[] => {
        return [item.modifyUrl];
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
    })
  ];

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private toastV2Service: ToastV2Service,
    private locationDataService: LocationDataService,
    private outbreakDataService: OutbreakDataService,
    protected route: ActivatedRoute
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // subscribe to the Selected Outbreak Subject stream
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        this.selectedOutbreak = selectedOutbreak;
      });

    // get location for which we need to retrieve usages
    this.route.params.subscribe((params: { locationId }) => {
      this.locationId = params.locationId;

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
    });
  }

  /**
     * Release resources
     */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();

    // release subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns(): void {}

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
  // initializeBreadcrumbs() {
  //   // reset
  //   this.breadcrumbs = [];
  //
  //   // add list breadcrumb only if we have permission
  //   if (LocationModel.canList(this.authUser)) {
  //     this.breadcrumbs.push(
  //       new BreadcrumbItemModel('LNG_PAGE_LIST_LOCATIONS_TITLE', '/locations')
  //     );
  //   }
  //
  //   // usage breadcrumb
  //   this.breadcrumbs.push(
  //     new BreadcrumbItemModel(
  //       'LNG_PAGE_LIST_USAGE_LOCATIONS_TITLE',
  //       '.',
  //       true,
  //       {},
  //       this.locationData
  //     )
  //   );
  // }

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {
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
      // retrieve outbreaks
      this.outbreakDataService
        .getOutbreaksListReduced()
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            return throwError(err);
          })
        )
        .subscribe((outbreaks: OutbreakModel[]) => {
          // map outbreaks to id / model
          const outbreaksMapped: {
            [ id: string ]: OutbreakModel
          } = _.transform(
            outbreaks,
            (result, outbreak: OutbreakModel) => {
              result[outbreak.id] = outbreak;
            },
            {}
          );

          // retrieve usages of a location
          this.locationDataService
            .getLocationUsage(this.locationId)
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                return throwError(err);
              })
            )
            .subscribe((locationUsage: LocationUsageModel) => {
              // remove keys if we don't have rights
              // #TODO - not sure if this is how it should be...

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
              const usageData: UsageDetails = new UsageDetails(locationUsage, outbreaksMapped);
              this.usageDetailsListMore = usageData.items.length > Constants.DEFAULT_USAGE_MAX_RECORDS_DISPLAYED ? {
                displayed: Constants.DEFAULT_USAGE_MAX_RECORDS_DISPLAYED,
                total: usageData.items.length
              } : null;
              this.usageDetailsList = usageData.items.slice(0, Constants.DEFAULT_USAGE_MAX_RECORDS_DISPLAYED);
            });
        });
    }
  }
}
