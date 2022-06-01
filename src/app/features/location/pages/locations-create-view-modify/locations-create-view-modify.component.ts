import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable } from 'rxjs';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { TranslateService } from '@ngx-translate/core';
import {
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { RequestFilterGenerator } from '../../../../core/helperClasses/request-query-builder';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { LocationModel } from '../../../../core/models/location.model';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { HierarchicalLocationModel } from '../../../../core/models/hierarchical-location.model';
import { takeUntil } from 'rxjs/operators';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { LocationIdentifierModel } from '../../../../core/models/location-identifier.model';

/**
 * Component
 */
@Component({
  selector: 'app-locations-create-view-modify',
  templateUrl: './locations-create-view-modify.component.html'
})
export class LocationsCreateViewModifyComponent extends CreateViewModifyComponent<LocationModel> implements OnDestroy {
  // parent tree
  private _parentLocationTree: HierarchicalLocationModel;
  expandPageTitle: string;

  /**
   * Constructor
   */
  constructor(
    protected activatedRoute: ActivatedRoute,
    protected toastV2Service: ToastV2Service,
    protected translateService: TranslateService,
    protected router: Router,
    protected dialogV2Service: DialogV2Service,
    protected locationDataService: LocationDataService,
    authDataService: AuthDataService,
    renderer2: Renderer2,
    redirectService: RedirectService
  ) {
    // parent
    super(
      toastV2Service,
      renderer2,
      redirectService,
      activatedRoute,
      authDataService
    );

    // get data
    this._parentLocationTree = this.activatedRoute.snapshot.data.parentLocationTree;
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();
  }

  /**
   * Create new item model if needed
   */
  protected createNewItem(): LocationModel {
    return new LocationModel();
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: LocationModel): Observable<LocationModel> {
    return this.locationDataService
      .getLocation(
        record ?
          record.id :
          this.activatedRoute.snapshot.params.locationId
      );
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {
    if (this.isCreate) {
      this.itemData.parentLocationId = this.activatedRoute.snapshot.params.parentId;
    }
  }

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // add info accordingly to page type
    if (this.isCreate) {
      this.pageTitle = 'LNG_PAGE_CREATE_LOCATION_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_LOCATION_TITLE';
      this.pageTitleData = {
        name: this.itemData.name
      };
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_LOCATION_TITLE';
      this.pageTitleData = {
        name: this.itemData.name
      };
    }
  }

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs() {
    // reset breadcrumbs
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

    // list page
    if (LocationModel.canList(this.authUser)) {
      // root
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_LOCATIONS_TITLE',
        action: {
          link: ['/locations']
        }
      });

      // list parents ?
      this.expandPageTitle = 'LNG_PAGE_LIST_LOCATIONS_TITLE';
      if (this._parentLocationTree) {
        // add tree
        let tree: HierarchicalLocationModel = this._parentLocationTree;
        while (tree) {
          // add to list
          if (tree.location?.id) {
            // update page title
            if (
              this.itemData.parentLocationId &&
              tree.location.id === this.itemData.parentLocationId
            ) {
              this.expandPageTitle = tree.location.name;
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

    // add info accordingly to page type
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_CREATE_LOCATION_TITLE',
        action: null
      });
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_MODIFY_LOCATION_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_VIEW_LOCATION_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    }
  }

  /**
   * Initialize tabs
   */
  protected initializeTabs(): void {
    this.tabData = {
      // tabs
      tabs: [
        // Personal
        this.initializeTabsDetails()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.translateService.instant('LNG_PAGE_CREATE_LOCATION_ACTION_CREATE_LOCATION_BUTTON'),
          message: () => this.translateService.instant(
            'LNG_STEPPER_FINAL_STEP_TEXT_GENERAL',
            this.itemData
          )
        }
      },

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: (data: LocationModel) => {
        // redirect to view
        this.router.navigate([
          '/locations',
          data.id,
          'view'
        ]);
      }
    };
  }

  /**
   * Initialize tabs - Details
   */
  private initializeTabsDetails(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      label: this.isCreate ?
        'LNG_PAGE_CREATE_LOCATION_TAB_DETAILS_TITLE' :
        'LNG_PAGE_MODIFY_LOCATION_TAB_DETAILS_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: this.isCreate ?
            'LNG_PAGE_CREATE_LOCATION_TAB_DETAILS_TITLE' :
            'LNG_PAGE_MODIFY_LOCATION_TAB_DETAILS_TITLE',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'name',
              placeholder: () => 'LNG_LOCATION_FIELD_LABEL_NAME',
              description: () => 'LNG_LOCATION_FIELD_LABEL_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.name,
                set: (value) => {
                  // set data
                  this.itemData.name = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'active',
              placeholder: () => 'LNG_LOCATION_FIELD_LABEL_ACTIVE',
              description: () => 'LNG_LOCATION_FIELD_LABEL_ACTIVE_DESCRIPTION',
              value: {
                get: () => this.itemData.active,
                set: (value) => {
                  // set data
                  this.itemData.active = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'populationDensity',
              placeholder: () => 'LNG_LOCATION_FIELD_LABEL_POPULATION_DENSITY',
              description: () => 'LNG_LOCATION_FIELD_LABEL_POPULATION_DENSITY_DESCRIPTION',
              value: {
                get: () => this.itemData.populationDensity,
                set: (value) => {
                  // set data
                  this.itemData.populationDensity = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'geographicalLevelId',
              placeholder: () => 'LNG_LOCATION_FIELD_LABEL_GEOGRAPHICAL_LEVEL',
              description: () => 'LNG_LOCATION_FIELD_LABEL_GEOGRAPHICAL_LEVEL_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.geographicalLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.geographicalLevelId,
                set: (value) => {
                  this.itemData.geographicalLevelId = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.LOCATION_SINGLE,
              name: 'parentLocationId',
              placeholder: () => 'LNG_LOCATION_FIELD_LABEL_PARENT_LOCATION',
              description: () => 'LNG_LOCATION_FIELD_LABEL_PARENT_LOCATION_DESCRIPTION',
              useOutbreakLocations: false,
              excludeLocationsIds: this.isCreate ?
                undefined :
                [this.itemData.id],
              value: {
                get: () => this.itemData.parentLocationId,
                set: (value) => {
                  this.itemData.parentLocationId = value;
                }
              },
              disabled: () => {
                return this.isCreate;
              }
            }, {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'geoLocation[lat]',
              placeholder: () => 'LNG_LOCATION_FIELD_LABEL_GEO_LOCATION_LAT',
              description: () => 'LNG_LOCATION_FIELD_LABEL_GEO_LOCATION_LAT_DESCRIPTION',
              value: {
                get: () => this.itemData.geoLocation?.lat,
                set: (value) => {
                  // initialize
                  if (!this.itemData.geoLocation) {
                    this.itemData.geoLocation = {
                      lat: undefined,
                      lng: undefined
                    };
                  }

                  // set data
                  this.itemData.geoLocation.lat = value;
                }
              },
              validators: {
                required: () => typeof this.itemData.geoLocation.lng === 'number',
                minMax: () => ({
                  min: -90,
                  max: 90
                })
              }
            }, {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'geoLocation[lng]',
              placeholder: () => 'LNG_LOCATION_FIELD_LABEL_GEO_LOCATION_LNG',
              description: () => 'LNG_LOCATION_FIELD_LABEL_GEO_LOCATION_LNG_DESCRIPTION',
              value: {
                get: () => this.itemData.geoLocation?.lng,
                set: (value) => {
                  // initialize
                  if (!this.itemData.geoLocation) {
                    this.itemData.geoLocation = {
                      lat: undefined,
                      lng: undefined
                    };
                  }

                  // set data
                  this.itemData.geoLocation.lng = value;
                }
              },
              validators: {
                required: () => typeof this.itemData.geoLocation.lat === 'number',
                minMax: () => ({
                  min: -180,
                  max: 180
                })
              }
            }
          ]
        },

        // Synonyms
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_LOCATION_FIELD_LABEL_SYNONYMS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.LIST,
            name: 'synonyms',
            items: this.itemData.synonyms,
            itemsChanged: (list) => {
              this.itemData.synonyms = list.items;
            },
            definition: {
              add: {
                label: 'LNG_INPUT_LABEL_ADD_INPUT',
                newItem: () => ''
              },
              remove: {
                label: 'LNG_COMMON_BUTTON_DELETE',
                confirmLabel: 'LNG_DIALOG_CONFIRM_DELETE_ITEM'
              },
              input: {
                type: CreateViewModifyV2TabInputType.LIST_TEXT,
                placeholder: () => 'LNG_LOCATION_FIELD_LABEL_SYNONYM',
                description: () => 'LNG_LOCATION_FIELD_LABEL_SYNONYM_DESCRIPTION'
              }
            }
          }]
        },

        // Location identifiers
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_LOCATION_FIELD_LABEL_IDENTIFIERS',
          inputs: [{
            type: CreateViewModifyV2TabInputType.LIST,
            name: 'identifiers',
            items: this.itemData.identifiers,
            itemsChanged: (list) => {
              this.itemData.identifiers = list.items;
            },
            definition: {
              add: {
                label: 'LNG_INPUT_LABEL_ADD_INPUT',
                newItem: () => new LocationIdentifierModel({})
              },
              remove: {
                label: 'LNG_COMMON_BUTTON_DELETE',
                confirmLabel: 'LNG_DIALOG_CONFIRM_DELETE_ITEM'
              },
              input: {
                type: CreateViewModifyV2TabInputType.LOCATION_IDENTIFIER,
                value: {
                  get: (index: number) => {
                    return this.itemData.identifiers[index];
                  }
                }
              }
            }
          }]
        }
      ]
    };
  }

  /**
   * Initialize buttons
   */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: {
        link: {
          link: () => ['/locations', this.itemData?.id, 'view']
        }
      },
      modify: {
        link: {
          link: () => ['/locations', this.itemData?.id, 'modify']
        },
        visible: () => LocationModel.canModify(this.authUser)
      },
      // #TODO - go back to parent
      createCancel: {
        link: {
          link: () => ['/locations']
        }
      },
      viewCancel: {
        link: {
          link: () => ['/locations']
        }
      },
      modifyCancel: {
        link: {
          link: () => ['/locations']
        }
      },
      quickActions: {
        options: [
          // #TODO
          // Record details
          // {
          //   type: CreateViewModifyV2MenuType.OPTION,
          //   label: 'LNG_COMMON_LABEL_DETAILS',
          //   action: {
          //     click: () => {
          //       // show record details dialog
          //       this.dialogV2Service.showRecordDetailsDialog(
          //         'LNG_COMMON_LABEL_DETAILS',
          //         this.itemData,
          //         this.activatedRoute.snapshot.data.user
          //       );
          //     }
          //   },
          //   visible: () => !this.isCreate
          // }
        ]
      }
    };
  }

  /**
   * Initialize process data
   */
  private initializeProcessData(): ICreateViewModifyV2CreateOrUpdate {
    return (
      _type,
      _data,
      _finished,
      _loading,
      _forms
    ) => {
      // #TODO
      console.log(_data);
      // // finished
      // (type === CreateViewModifyV2ActionType.CREATE ?
      //     this.languageDataService.createLanguage(
      //       data
      //     ) :
      //     this.languageDataService.modifyLanguage(
      //       this.itemData.id,
      //       data
      //     )
      // ).pipe(
      //   // handle error
      //   catchError((err) => {
      //     // show error
      //     finished(err, undefined);
      //
      //     // finished
      //     return throwError(err);
      //   }),
      //
      //   // should be the last pipe
      //   takeUntil(this.destroyed$)
      // ).subscribe((item: ClusterModel) => {
      //   // success creating / updating cluster
      //   this.toastV2Service.success(
      //     type === CreateViewModifyV2ActionType.CREATE ?
      //       'LNG_PAGE_CREATE_LANGUAGE_ACTION_CREATE_LANGUAGE_SUCCESS_MESSAGE' :
      //       'LNG_PAGE_MODIFY_LANGUAGE_ACTION_MODIFY_LANGUAGE_SUCCESS_MESSAGE'
      //   );
      //
      //   // finished with success
      //   finished(undefined, item);
      // });
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {
    this.expandListColumnRenderer = {
      type: CreateViewModifyV2ExpandColumnType.TEXT,
      get: (item: LocationModel) => item.name,
      link: (item: LocationModel) => ['/locations', item.id, 'view']
    };
  }

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {
    this.expandListQueryFields = [
      'id',
      'name'
    ];
  }

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {}

  /**
   * Refresh expand list
   */
  refreshExpandList(data): void {
    // append / remove search
    if (data.searchBy) {
      data.queryBuilder.filter.where({
        name: RequestFilterGenerator.textContains(
          data.searchBy
        )
      });
    }

    // retrieve data
    this.expandListRecords$ = this.locationDataService
      .getLocationsListByParent(
        this.itemData.parentLocationId,
        data.queryBuilder
      )
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }
}
