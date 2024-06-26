import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable, throwError } from 'rxjs';
import {
  CreateViewModifyV2ActionType,
  CreateViewModifyV2MenuType,
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab, ICreateViewModifyV2TabTable
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { RequestFilterGenerator } from '../../../../core/helperClasses/request-query-builder';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ITreeEditorDataCategory } from '../../../../shared/forms-v2/components/app-form-tree-editor-v2/models/tree-editor.model';
import { IconModel } from '../../../../core/models/icon.model';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';
import { OutbreakAndOutbreakTemplateHelperService } from '../../../../core/services/helper/outbreak-and-outbreak-template-helper.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { IGeneralAsyncValidatorResponse } from '../../../../shared/forms-v2/validators/general-async-validator.directive';

/**
 * Component
 */
@Component({
  selector: 'app-reference-data-category-entries-create-view-modify',
  templateUrl: './reference-data-category-entries-create-view-modify.component.html'
})
export class ReferenceDataCategoryEntriesCreateViewModifyComponent extends CreateViewModifyComponent<ReferenceDataEntryModel> implements OnDestroy {
  // category
  category: ReferenceDataCategoryModel;

  // per disease
  private _diseaseSpecificReferenceData: ITreeEditorDataCategory[];
  private _diseaseSpecificCategories: IResolverV2ResponseModel<ReferenceDataCategoryModel>;

  /**
   * Constructor
   */
  constructor(
    protected authDataService: AuthDataService,
    protected activatedRoute: ActivatedRoute,
    protected renderer2: Renderer2,
    protected redirectService: RedirectService,
    protected toastV2Service: ToastV2Service,
    protected outbreakAndOutbreakTemplateHelperService: OutbreakAndOutbreakTemplateHelperService,
    protected i18nService: I18nService,
    protected router: Router,
    protected referenceDataDataService: ReferenceDataDataService,
    protected dialogV2Service: DialogV2Service,
    protected referenceDataHelperService: ReferenceDataHelperService
  ) {
    // parent
    super(
      authDataService,
      activatedRoute,
      renderer2,
      redirectService,
      toastV2Service,
      outbreakAndOutbreakTemplateHelperService
    );

    // retrieve
    this.category = this.activatedRoute.snapshot.data.category;
    this._diseaseSpecificCategories = this.activatedRoute.snapshot.data.diseaseSpecificCategories;
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
  protected createNewItem(): ReferenceDataEntryModel {
    return new ReferenceDataEntryModel();
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: ReferenceDataEntryModel): Observable<ReferenceDataEntryModel> {
    return this.referenceDataDataService
      .getEntry(
        record ?
          record.id :
          this.activatedRoute.snapshot.params.entryId
      );
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {
    // nothing to do ?
    if (this.category.id !== ReferenceDataCategory.LNG_REFERENCE_DATA_CATEGORY_DISEASE) {
      return;
    }

    // format reference data per disease to expected tree format
    this._diseaseSpecificReferenceData = this.referenceDataHelperService.convertRefCategoriesToTreeCategories(this._diseaseSpecificCategories.list);
  }

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // add info accordingly to page type
    if (this.isCreate) {
      this.pageTitle = 'LNG_PAGE_CREATE_REFERENCE_DATA_ENTRY_TITLE';
    } else {
      this.pageTitle = this.itemData.value;
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
    if (ReferenceDataCategoryModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE',
        action: {
          link: ['/reference-data']
        }
      }, {
        label: this.category.name,
        action: {
          link: ['/reference-data', this.category.id]
        }
      });
    }

    // add info accordingly to page type
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: this.i18nService.instant('LNG_PAGE_CREATE_REFERENCE_DATA_ENTRY_TITLE'),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.i18nService.instant(this.itemData.value),
        action: null
      });
    }
  }

  /**
   * Initialize breadcrumb infos
   */
  protected initializeBreadcrumbInfos(): void {}

  /**
   * Initialize tabs
   */
  protected initializeTabs(): void {
    this.tabData = {
      // tabs
      tabs: [
        // Details
        this.initializeTabsDetails(),

        // Reference Data Per Disease
        this.initializeTabsReferenceDataPerDisease()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.i18nService.instant('LNG_COMMON_BUTTON_SAVE'),
          message: () => this.i18nService.instant(
            'LNG_STEPPER_FINAL_STEP_TEXT_GENERAL',
            {
              name: this.itemData.value ?
                this.i18nService.instant(this.itemData.value) :
                ''
            }
          )
        }
      },

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: (
        data: ReferenceDataEntryModel,
        extraQueryParams: Params
      ) => {
        // redirect to view
        this.router.navigate(
          [
            '/reference-data',
            this.category.id,
            data.id,
            'view'
          ], {
            queryParams: extraQueryParams
          }
        );
      }
    };
  }

  /**
   * Initialize tabs - Details
   */
  private initializeTabsDetails(): ICreateViewModifyV2Tab {
    // create tab
    const tab: ICreateViewModifyV2Tab = {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'details',
      label: 'LNG_COMMON_LABEL_DETAILS',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_COMMON_LABEL_DETAILS',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'value',
              placeholder: () => 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_VALUE',
              description: () => 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_VALUE_DESCRIPTION',
              value: {
                get: () => this.itemData.value ?
                  this.i18nService.instant(this.itemData.value) :
                  this.itemData.value,
                set: (value) => {
                  // set data
                  this.itemData.value = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.ASYNC_VALIDATOR_TEXT,
              name: 'code',
              placeholder: () => 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_CODE',
              description: () => 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_CODE_DESCRIPTION',
              value: {
                get: () => this.itemData.code,
                set: (value) => {
                  // set data
                  this.itemData.code = value;
                }
              },
              validators: {
                async: new Observable((observer) => {
                  // is there any point to validate ?
                  if (!this.itemData.code) {
                    observer.next(true);
                    observer.complete();
                    return;
                  }

                  // validate
                  this.referenceDataDataService
                    .checkCodeUniqueness(
                      this.itemData.code,
                      this.isModify ?
                        this.itemData.id :
                        undefined
                    )
                    .subscribe((isValid: boolean | IGeneralAsyncValidatorResponse) => {
                      observer.next(isValid);
                      observer.complete();
                    });
                })
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'active',
              placeholder: () => 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ACTIVE',
              description: () => 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ACTIVE_DESCRIPTION',
              value: {
                get: () => this.itemData.active,
                set: (value) => {
                  // set data
                  this.itemData.active = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'order',
              placeholder: () => 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ORDER',
              description: () => 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ORDER_DESCRIPTION',
              value: {
                get: () => this.itemData.order,
                set: (value) => {
                  this.itemData.order = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.COLOR,
              name: 'colorCode',
              placeholder: () => 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_COLOR',
              description: () => 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_COLOR_DESCRIPTION',
              value: {
                get: () => this.itemData.colorCode,
                set: (value) => {
                  // set data
                  this.itemData.colorCode = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'iconId',
              placeholder: () => 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ICON',
              description: () => 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ICON_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.icon as IResolverV2ResponseModel<IconModel>).options,
              value: {
                get: () => this.itemData.iconId,
                set: (value) => {
                  // set data
                  this.itemData.iconId = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'isSystemWide',
              placeholder: () => 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_IS_SYSTEM_WIDE',
              description: () => 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_IS_SYSTEM_WIDE_DESCRIPTION',
              value: {
                get: () => this.itemData.isSystemWide,
                set: (value) => {
                  // set data
                  this.itemData.isSystemWide = value;
                }
              },
              visible: () => !!this._diseaseSpecificCategories?.map[this.category.id]
            }, {
              type: CreateViewModifyV2TabInputType.TEXTAREA,
              name: 'description',
              placeholder: () => 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_DESCRIPTION',
              description: () => 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_DESCRIPTION_DESCRIPTION',
              value: {
                get: () => this.itemData.description ?
                  this.i18nService.instant(this.itemData.description) :
                  this.itemData.description,
                set: (value) => {
                  // set data
                  this.itemData.description = value;
                }
              }
            }
          ]
        }
      ]
    };

    // add lat & lng for specific categories
    if (
      this.category.id === ReferenceDataCategory.LNG_REFERENCE_DATA_CATEGORY_INSTITUTION_NAME ||
      this.category.id === ReferenceDataCategory.LNG_REFERENCE_DATA_CATEGORY_LAB_NAME ||
      this.category.id === ReferenceDataCategory.LNG_REFERENCE_DATA_CATEGORY_LAB_SEQUENCE_LABORATORY ||
      this.category.id === ReferenceDataCategory.LNG_REFERENCE_DATA_CATEGORY_CENTRE_NAME
    ) {
      tab.sections[0].inputs.push({
        type: CreateViewModifyV2TabInputType.NUMBER,
        name: 'geoLocation[lat]',
        placeholder: () => 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_GEO_LOCATION_LAT',
        value: {
          get: () => this.itemData.geoLocation?.lat,
          set: (value) => {
            // set data
            this.itemData.geoLocation = this.itemData.geoLocation || { lat: undefined, lng: undefined };
            this.itemData.geoLocation.lat = value;
          }
        },
        validators: {
          required: () => !!this.itemData.geoLocation?.lng ||
            this.itemData.geoLocation?.lng === 0
        }
      }, {
        type: CreateViewModifyV2TabInputType.NUMBER,
        name: 'geoLocation[lng]',
        placeholder: () => 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_GEO_LOCATION_LNG',
        value: {
          get: () => this.itemData.geoLocation?.lng,
          set: (value) => {
            // set data
            this.itemData.geoLocation = this.itemData.geoLocation || { lat: undefined, lng: undefined };
            this.itemData.geoLocation.lng = value;
          }
        },
        validators: {
          required: () => !!this.itemData.geoLocation?.lat ||
            this.itemData.geoLocation?.lat === 0
        }
      });
    }

    // finished
    return tab;
  }

  /**
   * Initialize tabs - Reference data per disease
   */
  private initializeTabsReferenceDataPerDisease(): ICreateViewModifyV2TabTable {
    return {
      type: CreateViewModifyV2TabInputType.TAB_TABLE,
      name: 'ref_data_per_disease',
      label: 'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE',
      definition: {
        type: CreateViewModifyV2TabInputType.TAB_TABLE_TREE_EDITOR,
        name: 'allowedRefDataItems',
        options: this._diseaseSpecificReferenceData,
        emptyLabel: 'LNG_COMMON_LABEL_ALL_OPTIONS_INCLUDED',
        value: {
          get: () => this.itemData.allowedRefDataItems,
          set: (value) => {
            this.itemData.allowedRefDataItems = value;
          }
        },
        add: {
          callback: (data) => {
            this.referenceDataHelperService
              .showNewItemDialog(
                {
                  icon: (this.activatedRoute.snapshot.data.icon as IResolverV2ResponseModel<IconModel>).options
                },
                data.category,
                (
                  item,
                  addAnother
                ) => {
                  data.finish(
                    item ?
                      {
                        id: item.id,
                        label: item.value,
                        order: item.order,
                        disabled: !item.active,
                        colorCode: item.colorCode,
                        isSystemWide: !!item.isSystemWide,
                        iconUrl: item.iconUrl
                      } :
                      null,
                    addAnother
                  );
                }
              );
          },
          visible: () => ReferenceDataEntryModel.canCreate(this.authUser)
        }
      },
      visible: () => {
        return this.category.id === ReferenceDataCategory.LNG_REFERENCE_DATA_CATEGORY_DISEASE;
      }
    };
  }

  /**
   * Initialize buttons
   */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: {
        link: {
          link: () => ['/reference-data', this.category.id, this.itemData?.id, 'view']
        }
      },
      modify: {
        link: {
          link: () => ['/reference-data', this.category.id, this.itemData?.id, 'modify']
        },
        visible: () => ReferenceDataEntryModel.canModify(this.authUser)
      },
      createCancel: {
        link: {
          link: () => ['/reference-data', this.category.id]
        }
      },
      viewCancel: {
        link: {
          link: () =>  ['/reference-data', this.category.id]
        }
      },
      modifyCancel: {
        link: {
          link: () => ['/reference-data', this.category.id]
        }
      },
      quickActions: {
        options: [
          // Record details
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_COMMON_LABEL_DETAILS',
            action: {
              click: () => {
                // show record details dialog
                this.dialogV2Service.showRecordDetailsDialog(
                  this.authUser,
                  'LNG_COMMON_LABEL_DETAILS',
                  this.itemData,
                  this.activatedRoute.snapshot.data.user,
                  this.activatedRoute.snapshot.data.deletedUser
                );
              }
            }
          }
        ]
      }
    };
  }

  /**
   * Initialize process data
   */
  private initializeProcessData(): ICreateViewModifyV2CreateOrUpdate {
    return (
      type,
      data,
      finished,
      _loading,
      _forms
    ) => {
      // set category ID for the new entry
      if (type === CreateViewModifyV2ActionType.CREATE) {
        data.categoryId = this.category.id;
      }

      // finished
      (type === CreateViewModifyV2ActionType.CREATE ?
        this.referenceDataDataService.createEntry(
          data
        ) :
        this.referenceDataDataService.modifyEntry(
          this.itemData.id,
          data
        )
      ).pipe(
        // handle error
        catchError((err) => {
          // show error
          finished(err, undefined);

          // finished
          return throwError(err);
        }),
        switchMap((item) => {
          // re-load language tokens
          return this.i18nService.loadUserLanguage()
            .pipe(
              catchError((err) => {
                // show error
                finished(err, undefined);

                // finished
                return throwError(err);
              }),
              map(() => item)
            );
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      ).subscribe((item) => {
        // success creating / updating event
        this.toastV2Service.success(
          type === CreateViewModifyV2ActionType.CREATE ?
            'LNG_PAGE_CREATE_REFERENCE_DATA_ENTRY_ACTION_CREATE_ENTRY_SUCCESS_MESSAGE' :
            'LNG_PAGE_MODIFY_REFERENCE_DATA_ENTRY_ACTION_MODIFY_ENTRY_SUCCESS_MESSAGE'
        );

        // finished with success
        finished(undefined, item);
      });
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {
    this.expandListColumnRenderer = {
      type: CreateViewModifyV2ExpandColumnType.TEXT,
      link: (item: ReferenceDataEntryModel) => ['/reference-data', this.category.id, item.id, 'view'],
      get: {
        text: (item: ReferenceDataEntryModel) => this.i18nService.instant(item.value)
      }
    };
  }

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {
    this.expandListQueryFields = [
      'id',
      'value'
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
        value: RequestFilterGenerator.textContains(
          data.searchBy
        )
      });
    }

    // add category id to request
    data.queryBuilder.filter.byEquality(
      'categoryId',
      this.category.id
    );

    // retrieve records
    this.expandListRecords$ = this.referenceDataDataService
      .getEntries(data.queryBuilder)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }
}
