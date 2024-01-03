import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { WorldMapComponent, WorldMapMarker, WorldMapMarkerLayer, WorldMapPoint } from '../../../../common-modules/world-map/components/world-map/world-map.component';
import * as _ from 'lodash';
import { Subscription, throwError } from 'rxjs';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as FileSaver from 'file-saver';
import { TransmissionChainModel } from '../../../../core/models/transmission-chain.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { catchError } from 'rxjs/operators';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IV2Breadcrumb } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { V2AdvancedFilter, V2AdvancedFilterComparatorOptions, V2AdvancedFilterComparatorType, V2AdvancedFilterType } from '../../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { Constants } from '../../../../core/models/constants';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { ActivatedRoute } from '@angular/router';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import {
  TransmissionChainFilters,
  TransmissionChainFiltersFrom
} from '../../classes/filter';
import { IV2ActionMenuLabel, V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2SideDialogAdvancedFiltersResponse } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';

@Component({
  selector: 'app-case-count-map',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './case-count-map.component.html',
  styleUrls: ['./case-count-map.component.scss']
})
export class CaseCountMapComponent implements OnInit, OnDestroy {
  // breadcrumbs
  breadcrumbs: IV2Breadcrumb[] = [];

  // outbreak
  private _selectedOutbreak: OutbreakModel;

  displayLoading: boolean = true;

  markers: WorldMapMarker[] = [];

  // constants
  WorldMapMarkerLayer = WorldMapMarkerLayer;
  Constants = Constants;

  // authenticated user
  authUser: UserModel;

  filters: TransmissionChainFilters = new TransmissionChainFilters();

  // cluster distance
  displayClusterDistance: boolean = false;

  clusterDistance: number = 10;

  clusterDistanceOptions: ILabelValuePairModel[] = [
    {
      label: '10',
      value: 10
    }, {
      label: '50',
      value: 50
    }, {
      label: '100',
      value: 100
    }, {
      label: '150',
      value: 150
    }
  ];

  @ViewChild('worldMap') worldMap: WorldMapComponent;

  // advanced filters
  advancedFilters: V2AdvancedFilter[];

  // quick actions
  quickActions: IV2ActionMenuLabel;

  // subscribers
  outbreakSubscriber: Subscription;

  /**
     * Constructor
     */
  constructor(
    private caseDataService: CaseDataService,
    private outbreakDataService: OutbreakDataService,
    private i18nService: I18nService,
    private authDataService: AuthDataService,
    private toastV2Service: ToastV2Service,
    private dialogV2Service: DialogV2Service,
    private activatedRoute: ActivatedRoute,
    private referenceDataHelperService: ReferenceDataHelperService
  ) {}

  /**
     * Component initialized
     */
  ngOnInit() {
    // authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    // subscribe to the Selected Outbreak Subject stream
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        if (selectedOutbreak) {
          this._selectedOutbreak = selectedOutbreak;

          // advanced filters
          this.advancedFilters = [
            {
              type: V2AdvancedFilterType.MULTISELECT,
              field: 'classificationId',
              label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
              options: this.referenceDataHelperService.filterPerOutbreakOptions(
                this._selectedOutbreak,
                (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                undefined
              ),
              allowedComparators: [
                _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.MULTISELECT], { value: V2AdvancedFilterComparatorType.NONE })
              ],
              filterBy: (_qb, filter) => {
                this.filters.classificationId = filter.value;
              }
            }, {
              type: V2AdvancedFilterType.MULTISELECT,
              field: 'occupation',
              label: 'LNG_CONTACT_FIELD_LABEL_OCCUPATION',
              options: this.referenceDataHelperService.filterPerOutbreakOptions(
                this._selectedOutbreak,
                (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                undefined
              ),
              allowedComparators: [
                _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.MULTISELECT], { value: V2AdvancedFilterComparatorType.NONE })
              ],
              filterBy: (_qb, filter) => {
                this.filters.occupation = filter.value;
              }
            }, {
              type: V2AdvancedFilterType.MULTISELECT,
              field: 'outcomeId',
              label: 'LNG_CASE_FIELD_LABEL_OUTCOME',
              options: this.referenceDataHelperService.filterPerOutbreakOptions(
                this._selectedOutbreak,
                (this.activatedRoute.snapshot.data.outcome as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                undefined
              ),
              allowedComparators: [
                _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.MULTISELECT], { value: V2AdvancedFilterComparatorType.NONE })
              ],
              filterBy: (_qb, filter) => {
                this.filters.outcomeId = filter.value;
              }
            }, {
              type: V2AdvancedFilterType.TEXT,
              field: 'firstName',
              label: 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME',
              allowedComparators: [
                _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.TEXT], { value: V2AdvancedFilterComparatorType.TEXT_STARTS_WITH })
              ],
              filterBy: (_qb, filter) => {
                this.filters.firstName = filter.value;
              }
            }, {
              type: V2AdvancedFilterType.TEXT,
              field: 'lastName',
              label: 'LNG_CONTACT_FIELD_LABEL_LAST_NAME',
              allowedComparators: [
                _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.TEXT], { value: V2AdvancedFilterComparatorType.TEXT_STARTS_WITH })
              ],
              filterBy: (_qb, filter) => {
                this.filters.lastName = filter.value;
              }
            }, {
              type: V2AdvancedFilterType.MULTISELECT,
              field: 'labSequenceResult',
              label: 'LNG_PAGE_CASE_COUNT_LAB_SEQUENCE_RESULT',
              options: this.referenceDataHelperService.filterPerOutbreakOptions(
                this._selectedOutbreak,
                (this.activatedRoute.snapshot.data.labSequenceResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                undefined
              ),
              allowedComparators: [
                _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.MULTISELECT], { value: V2AdvancedFilterComparatorType.NONE })
              ],
              filterBy: (_qb, filter) => {
                this.filters.labSequenceResult = filter.value;
              }
            }, {
              type: V2AdvancedFilterType.MULTISELECT,
              field: 'gender',
              label: 'LNG_CASE_FIELD_LABEL_GENDER',
              options: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              allowedComparators: [
                _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.MULTISELECT], { value: V2AdvancedFilterComparatorType.NONE })
              ],
              filterBy: (_qb, filter) => {
                this.filters.gender = filter.value;
              }
            }, {
              type: V2AdvancedFilterType.LOCATION_MULTIPLE,
              field: 'locationIds',
              label: 'LNG_ADDRESS_FIELD_LABEL_LOCATION',
              filterBy: (_qb, filter) => {
                this.filters.locationIds = filter.value;
              }
            }, {
              type: V2AdvancedFilterType.MULTISELECT,
              field: 'clusterIds',
              label: 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER',
              options: (this.activatedRoute.snapshot.data.cluster as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              allowedComparators: [
                _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.MULTISELECT], { value: V2AdvancedFilterComparatorType.NONE })
              ],
              filterBy: (_qb, filter) => {
                this.filters.clusterIds = filter.value;
              }
            }, {
              type: V2AdvancedFilterType.RANGE_AGE,
              field: 'age',
              label: 'LNG_ENTITY_FIELD_LABEL_AGE',
              filterBy: (_qb, filter) => {
                this.filters.age = filter.value;
              }
            }, {
              type: V2AdvancedFilterType.RANGE_DATE,
              field: 'date',
              label: 'LNG_PAGE_CASE_COUNT_DATE',
              allowedComparators: [
                _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.RANGE_DATE], { value: V2AdvancedFilterComparatorType.BETWEEN }),
                _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.RANGE_DATE], { value: V2AdvancedFilterComparatorType.BEFORE }),
                _.find(V2AdvancedFilterComparatorOptions[V2AdvancedFilterType.RANGE_DATE], { value: V2AdvancedFilterComparatorType.AFTER })
              ],
              filterBy: (_qb, filter) => {
                this.filters.date = filter.value;
              }
            }
          ];

          // re-load the list when the Selected Outbreak is changed
          this.reloadCases();
        }
      });

    // quick actions
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: () => TransmissionChainModel.canExportCaseCountMap(this.authUser),
      menuOptions: [
        // Export
        {
          label: {
            get: () => 'LNG_PAGE_CASE_COUNT_EXPORT_MAP'
          },
          action: {
            click: () => {
              this.exportCaseCountMap();
            }
          },
          visible: () => TransmissionChainModel.canExportCaseCountMap(this.authUser)
        }
      ]
    };
  }

  /**
     * Component destroyed
     */
  ngOnDestroy() {
    // outbreak subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }
  }

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {
    // set breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      }, {
        label: 'LNG_PAGE_CASE_COUNT_TITLE',
        action: null
      }
    ];
  }

  /**
   * Export case count map
   */
  exportCaseCountMap() {
    if (this.worldMap) {
      const loadingDialog = this.dialogV2Service.showLoadingDialog();
      this.worldMap
        .printToBlob()
        .subscribe((blob) => {
          const fileName = this.i18nService.instant('LNG_PAGE_CASE_COUNT_TITLE');
          FileSaver.saveAs(
            blob,
            `${fileName}.png`
          );
          loadingDialog.close();
        });
    }
  }

  /**
   * Reload case data
   */
  reloadCases(response?: IV2SideDialogAdvancedFiltersResponse): void {
    // must reset filters ?
    if (
      response !== undefined &&
      (
        !response.queryBuilder ||
        !response.filtersApplied?.appliedFilters?.length
      )
    ) {
      // reset
      this.filters = new TransmissionChainFilters();
    } else if (response?.filtersApplied) {
      // check if some filters were removed
      const usedFilters: {
        [uniqueKey: string]: true
      } = {};
      (response.filtersApplied.appliedFilters || []).forEach((filter) => {
        usedFilters[filter.filter.uniqueKey] = true;
      });

      // check if we need to remove
      if (!usedFilters['classificationIdLNG_CASE_FIELD_LABEL_CLASSIFICATION']) {
        this.filters.classificationId = undefined;
      }
      if (!usedFilters['occupationLNG_CONTACT_FIELD_LABEL_OCCUPATION']) {
        this.filters.occupation = undefined;
      }
      if (!usedFilters['outcomeIdLNG_CASE_FIELD_LABEL_OUTCOME']) {
        this.filters.outcomeId = undefined;
      }
      if (!usedFilters['firstNameLNG_CONTACT_FIELD_LABEL_FIRST_NAME']) {
        this.filters.firstName = undefined;
      }
      if (!usedFilters['lastNameLNG_CONTACT_FIELD_LABEL_LAST_NAME']) {
        this.filters.lastName = undefined;
      }
      if (!usedFilters['genderLNG_CASE_FIELD_LABEL_GENDER']) {
        this.filters.gender = undefined;
      }
      if (!usedFilters['labSequenceResultLNG_PAGE_CASE_COUNT_LAB_SEQUENCE_RESULT']) {
        this.filters.labSequenceResult = undefined;
      }
      if (!usedFilters['locationIdsLNG_ADDRESS_FIELD_LABEL_LOCATION']) {
        this.filters.locationIds = undefined;
      }
      if (!usedFilters['clusterIdsLNG_RELATIONSHIP_FIELD_LABEL_CLUSTER']) {
        this.filters.clusterIds = undefined;
      }
      if (!usedFilters['ageLNG_ENTITY_FIELD_LABEL_AGE']) {
        this.filters.age = undefined;
      }
      if (!usedFilters['dateLNG_PAGE_CASE_COUNT_DATE']) {
        this.filters.date = undefined;
      }
    }

    // retrieve data
    if (this._selectedOutbreak?.id) {
      // display loading
      this.displayLoading = true;

      // configure case search criteria
      const qb = new RequestQueryBuilder();

      // add custom filters
      if (!_.isEmpty(this.filters)) {
        this.filters.attachConditionsToRequestQueryBuilder(
          qb, {
            from: TransmissionChainFiltersFrom.CASE_COUNT
          }
        );
      }

      // retrieve addresses
      this.caseDataService
        .getCaseCountMapAddresses(this._selectedOutbreak.id, qb)
        .pipe(
          catchError((err) => {
            // show error
            this.toastV2Service.error(err);

            // hide loading
            this.displayLoading = false;
            return throwError(err);
          })
        )
        .subscribe((geoPoints) => {
          // reset data
          this.markers = [];

          // add markers
          (geoPoints || []).forEach((geoPoint) => {
            // add marker
            this.markers.push(new WorldMapMarker({
              point: new WorldMapPoint(
                geoPoint.lat,
                geoPoint.lng
              ),
              layer: WorldMapMarkerLayer.CLUSTER
            }));
          });

          // finished
          this.displayLoading = false;
        });
    }
  }
}
