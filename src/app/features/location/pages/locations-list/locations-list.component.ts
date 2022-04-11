import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ActivatedRoute, Router } from '@angular/router';
import { LocationModel } from '../../../../core/models/location.model';
import { Observable, throwError } from 'rxjs';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import * as _ from 'lodash';
import { ErrorCodes } from '../../../../core/enums/error-codes.enum';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { FormLocationDropdownComponent, LocationAutoItem } from '../../../../shared/components/form-location-dropdown/form-location-dropdown.component';
import { catchError, share } from 'rxjs/operators';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { RequestFilter } from '../../../../core/helperClasses/request-query-builder';
import { moment } from '../../../../core/helperClasses/x-moment';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-locations-list',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './locations-list.component.html',
  styleUrls: ['./locations-list.component.less']
})
export class LocationsListComponent extends ListComponent implements OnInit, OnDestroy {
  // breadcrumb header
  // public breadcrumbs: BreadcrumbItemModel[] =  [
  //   new BreadcrumbItemModel(
  //     'LNG_PAGE_LIST_LOCATIONS_TITLE',
  //     '/locations'
  //   )
  // ];

  // constants
  ExportDataExtension = ExportDataExtension;
  LocationModel = LocationModel;

  // user list
  userList$: Observable<UserModel[]>;

  // parent location ID
  parentId: string;

  // list of existing locations
  locationsList$: Observable<LocationModel[]>;
  locationsListCount$: Observable<IBasicCount>;

  yesNoOptionsList$: Observable<any[]>;

  // authenticated user
  UserSettings = UserSettings;

  @ViewChild('locationFilter', { static: true }) locationFilter: FormLocationDropdownComponent;

  // export
  hierarchicalLocationsDataExportFileName: string = moment().format('YYYY-MM-DD');

  geographicalLevelsList$: Observable<any[]>;

  recordActions: HoverRowAction[] = [
    // View Location
    new HoverRowAction({
      icon: 'visibility',
      iconTooltip: 'LNG_PAGE_LIST_LOCATIONS_ACTION_VIEW_LOCATION',
      linkGenerator: (item: LocationModel): string[] => {
        return ['/locations', item.id, 'view'];
      },
      visible: (): boolean => {
        return LocationModel.canView(this.authUser);
      }
    }),

    // Modify Location
    new HoverRowAction({
      icon: 'settings',
      iconTooltip: 'LNG_PAGE_LIST_LOCATIONS_ACTION_MODIFY_LOCATION',
      linkGenerator: (item: LocationModel): string[] => {
        return ['/locations', item.id, 'modify'];
      },
      visible: (): boolean => {
        return LocationModel.canModify(this.authUser);
      }
    }),

    // View Location Children
    new HoverRowAction({
      icon: 'groupWork',
      iconTooltip: 'LNG_PAGE_LIST_LOCATIONS_ACTION_SEE_CHILDREN',
      click: (item: LocationModel) => {
        this.router.navigate(['/locations', item.id, 'children']);
      }
    }),

    // Other actions
    new HoverRowAction({
      type: HoverRowActionType.MENU,
      icon: 'moreVertical',
      menuOptions: [
        // Delete Location
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_LOCATIONS_ACTION_DELETE_LOCATION',
          click: (item: LocationModel) => {
            this.deleteLocation(item);
          },
          visible: (): boolean => {
            return LocationModel.canDelete(this.authUser);
          },
          class: 'mat-menu-item-delete'
        }),

        // Divider
        new HoverRowAction({
          type: HoverRowActionType.DIVIDER,
          visible: (): boolean => {
            // visible only if at least one of the previous...
            return LocationModel.canDelete(this.authUser);
          }
        }),

        // See Location usage
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_LOCATIONS_ACTION_USAGE',
          click: (item: LocationModel) => {
            this.router.navigate(['/locations', item.id, 'usage']);
          },
          visible: (): boolean => {
            return LocationModel.canListUsage(this.authUser);
          }
        })
      ]
    })
  ];

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private locationDataService: LocationDataService,
    private genericDataService: GenericDataService,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private toastV2Service: ToastV2Service,
    private router: Router,
    private i18nService: I18nService,
    private referenceDataDataService: ReferenceDataDataService,
    private userDataService: UserDataService
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
    // add page title
    this.hierarchicalLocationsDataExportFileName = `${this.i18nService.instant('LNG_PAGE_LIST_LOCATIONS_TITLE')} - ${this.hierarchicalLocationsDataExportFileName}`;

    // retrieve users
    this.userList$ = this.userDataService.getUsersListSorted().pipe(share());

    // lists
    this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

    // geographical level list
    this.geographicalLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LOCATION_GEOGRAPHICAL_LEVEL);

    // reload data
    this.route.params
      .subscribe((params: { parentId }) => {
        // set parent
        this.parentId = params.parentId;

        // initialize pagination
        this.initPaginator();
        // ...and re-load the list when parent location is changed
        this.needsRefreshList(true);
      });

    // initialize side table columns
    this.initializeTableColumns();
  }

  /**
     * Release resources
     */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  /**
     * Initialize Side Table Columns
     */
  initializeTableColumns() {
    // default table columns
    // this.tableColumns = [
    //   new VisibleColumnModel({
    //     field: 'name',
    //     label: 'LNG_LOCATION_FIELD_LABEL_NAME'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'synonyms',
    //     label: 'LNG_LOCATION_FIELD_LABEL_SYNONYMS'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'identifiers',
    //     label: 'LNG_LOCATION_FIELD_LABEL_IDENTIFIERS'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'latLng',
    //     label: 'LNG_LOCATION_FIELD_LABEL_GEO_LOCATION'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'active',
    //     label: 'LNG_LOCATION_FIELD_LABEL_ACTIVE'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'populationDensity',
    //     label: 'LNG_LOCATION_FIELD_LABEL_POPULATION_DENSITY'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'geographicalLevelId',
    //     label: 'LNG_LOCATION_FIELD_LABEL_GEOGRAPHICAL_LEVEL'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'createdBy',
    //     label: 'LNG_LOCATION_FIELD_LABEL_CREATED_BY',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'createdAt',
    //     label: 'LNG_LOCATION_FIELD_LABEL_CREATED_AT',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'updatedBy',
    //     label: 'LNG_LOCATION_FIELD_LABEL_UPDATED_BY',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'updatedAt',
    //     label: 'LNG_LOCATION_FIELD_LABEL_UPDATED_AT',
    //     visible: false
    //   })
    // ];
  }

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
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the list of Locations
   */
  refreshList() {
    // retrieve created user & modified user information
    this.queryBuilder.include('createdByUser', true);
    this.queryBuilder.include('updatedByUser', true);

    // refresh
    this.locationsList$ = this.locationDataService
      .getLocationsListByParent(
        this.parentId,
        this.queryBuilder,
        true
      )
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        })
      );
  }

  /**
     * Get total number of items, based on the applied filters
     */
  refreshListCount() {
    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();
    this.locationsListCount$ = this.locationDataService
      .getLocationsCountByParent(this.parentId, countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),
        share()
      );
  }

  /**
     * Delete location
     */
  deleteLocation(location: LocationModel) {
    // show confirm dialog to confirm the action
    this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_LOCATION', location)
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          // delete record
          // this.showLoadingDialog();
          this.locationDataService
            .deleteLocation(location.id)
            .pipe(
              catchError((err: {
                message: string,
                code: ErrorCodes,
                details: {
                  id: string,
                  model: string
                }
              }) => {
                // check if we have a model in use error
                // this.closeLoadingDialog();
                if (err.code === ErrorCodes.MODEL_IN_USE) {
                  this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_LOCATION_USED', location)
                    .subscribe((answerC: DialogAnswer) => {
                      if (answerC.button === DialogAnswerButton.Yes) {
                        // redirect to usage page where we can make changes
                        this.router.navigate(['/locations', err.details.id, 'usage']);
                      }
                    });
                } else {
                  this.toastV2Service.error(err);
                }

                return throwError(err);
              })
            )
            .subscribe(() => {
              this.toastV2Service.success('LNG_PAGE_LIST_LOCATIONS_ACTION_DELETE_SUCCESS_MESSAGE');

              // reset location cache after deleting a location
              FormLocationDropdownComponent.CACHE = {};

              // hide loading
              // this.closeLoadingDialog();

              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

  /**
     * Search location changed
     * @param data
     */
  searchLocationChanged(data: LocationAutoItem) {
    if (
      data &&
            data.id
    ) {
      // redirect
      this.locationFilter.clear();
      this.router.navigate(['/locations', data.id, 'children']);
    }
  }

  filterByIdentifierCode(value: string) {
    // remove previous condition
    this.queryBuilder.filter.remove('identifiers');

    if (!_.isEmpty(value)) {
      // add new condition
      this.queryBuilder.filter.where({
        identifiers: {
          elemMatch: {
            code: {
              $regex: RequestFilter.escapeStringForRegex(value)
                .replace(/%/g, '.*')
                .replace(/\\\?/g, '.'),
              $options: 'i'
            }
          }
        }
      });
    }

    // refresh list
    this.needsRefreshList();
  }
}
