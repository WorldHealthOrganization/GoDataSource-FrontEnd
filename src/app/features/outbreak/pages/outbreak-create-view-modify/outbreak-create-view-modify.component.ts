import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable, throwError } from 'rxjs';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { TranslateService } from '@ngx-translate/core';
import {
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { catchError, takeUntil } from 'rxjs/operators';
import { RequestFilterGenerator } from '../../../../core/helperClasses/request-query-builder';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';

/**
 * Component
 */
@Component({
  selector: 'app-outbreak-create-view-modify',
  templateUrl: './outbreak-create-view-modify.component.html'
})
export class OutbreakCreateViewModifyComponent extends CreateViewModifyComponent<OutbreakModel> implements OnDestroy {
  /**
   * Constructor
   */
  constructor(
    private outbreakDataService: OutbreakDataService,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService,
    authDataService: AuthDataService,
    toastV2Service: ToastV2Service,
    renderer2: Renderer2,
    router: Router
  ) {
    super(
      activatedRoute,
      authDataService,
      toastV2Service,
      renderer2,
      router,
      true
    );
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
  protected createNewItem(): OutbreakModel {
    return new OutbreakModel();
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: OutbreakModel): Observable<OutbreakModel> {
    return this.outbreakDataService
      .getOutbreak(
        record ?
          record.id :
          this.activatedRoute.snapshot.params.outbreakId
      );
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {}

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // add info accordingly to page type
    if (this.isCreate) {
      this.pageTitle = 'LNG_PAGE_CREATE_OUTBREAK_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_OUTBREAK_LINK_MODIFY';
      this.pageTitleData = {
        name: this.itemData.name
      };
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_OUTBREAK_TITLE';
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

    // case list page
    if (OutbreakModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_OUTBREAKS_TITLE',
        action: {
          link: ['/outbreaks']
        }
      });
    }

    // add info accordingly to page type
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_CREATE_OUTBREAK_TITLE',
        action: null
      });
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_MODIFY_OUTBREAK_LINK_MODIFY', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.translateService.instant(
          'LNG_PAGE_VIEW_OUTBREAK_TITLE', {
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
        // Details
        this.initializeTabsDetails()

        // Map servers
        // #TODO
        // this.initializeMapServers()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.translateService.instant('LNG_PAGE_CREATE_OUTBREAK_ACTION_CREATE_OUTBREAK_BUTTON'),
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
      redirectAfterCreateUpdate: (data: OutbreakModel) => {
        // redirect to view
        this.router.navigate([
          '/outbreaks',
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
        'LNG_PAGE_CREATE_OUTBREAK_TAB_DETAILS' :
        'LNG_PAGE_MODIFY_OUTBREAK_TAB_DETAILS',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: this.isCreate ?
            'LNG_PAGE_CREATE_OUTBREAK_TAB_DETAILS' :
            'LNG_PAGE_MODIFY_OUTBREAK_TAB_DETAILS',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.ASYNC_VALIDATOR_TEXT,
              name: 'name',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_NAME',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.name,
                set: (value) => {
                  this.itemData.name = value;
                }
              },
              validators: {
                required: () => true,
                async: new Observable((observer) => {
                  this.outbreakDataService
                    .checkOutbreakNameUniquenessValidity(
                      this.itemData.name,
                      this.isCreate ?
                        undefined :
                        this.itemData.id
                    )
                    .pipe(
                      catchError((err) => {
                        observer.error(err);
                        observer.complete();

                        // send error down the road
                        return throwError(err);
                      })
                    )
                    .subscribe((response) => {
                      observer.next(response);
                      observer.complete();
                    });
                })
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'disease',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_DISEASE',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_DISEASE_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.disease as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.disease,
                set: (value) => {
                  this.itemData.disease = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_MULTIPLE,
              name: 'countries',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_COUNTRIES',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_COUNTRIES_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.country as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.countryIds,
                set: (value) => {
                  this.itemData.countries = value.map((item) => ({ id: item }));
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.LOCATION_MULTIPLE,
              name: 'locationIds',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_LOCATIONS',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_LOCATIONS_DESCRIPTION',
              value: {
                get: () => this.itemData.locationIds,
                set: (value) => {
                  this.itemData.locationIds = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXTAREA,
              name: 'description',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_DESCRIPTION',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_DESCRIPTION_DESCRIPTION',
              value: {
                get: () => this.itemData.description,
                set: (value) => {
                  this.itemData.description = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.DATE,
              name: 'startDate',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_START_DATE',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_START_DATE_DESCRIPTION',
              value: {
                get: () => this.itemData.startDate,
                set: (value) => {
                  this.itemData.startDate = value;
                }
              },
              validators: {
                required: () => true,
                dateSameOrBefore: () => [
                  'endDate'
                ]
              }
            }, {
              type: CreateViewModifyV2TabInputType.DATE,
              name: 'endDate',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_END_DATE',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_END_DATE_DESCRIPTION',
              value: {
                get: () => this.itemData.endDate,
                set: (value) => {
                  this.itemData.endDate = value;
                }
              },
              validators: {
                dateSameOrAfter: () => [
                  'startDate'
                ]
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'caseIdMask',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_CASE_ID_MASK',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_CASE_ID_MASK_DESCRIPTION',
              value: {
                get: () => this.itemData.caseIdMask,
                set: (value) => {
                  this.itemData.caseIdMask = value;
                }
              },
              validators: {
                regex: () => ({
                  expression: '^(?:9*[^9()]*|[^9()]*9*[^9()]*|[^9()]*9*)$',
                  msg: 'LNG_FORM_VALIDATION_ERROR_PATTERN'
                })
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'contactIdMask',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_CONTACT_ID_MASK',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_CONTACT_ID_MASK_DESCRIPTION',
              value: {
                get: () => this.itemData.contactIdMask,
                set: (value) => {
                  this.itemData.contactIdMask = value;
                }
              },
              validators: {
                regex: () => ({
                  expression: '^(?:9*[^9()]*|[^9()]*9*[^9()]*|[^9()]*9*)$',
                  msg: 'LNG_FORM_VALIDATION_ERROR_PATTERN'
                })
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'contactOfContactIdMask',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_CONTACT_OF_CONTACT_ID_MASK',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_CONTACT_OF_CONTACT_ID_MASK_DESCRIPTION',
              value: {
                get: () => this.itemData.contactOfContactIdMask,
                set: (value) => {
                  this.itemData.contactOfContactIdMask = value;
                }
              },
              validators: {
                regex: () => ({
                  expression: '^(?:9*[^9()]*|[^9()]*9*[^9()]*|[^9()]*9*)$',
                  msg: 'LNG_FORM_VALIDATION_ERROR_PATTERN'
                })
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'applyGeographicRestrictions',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_APPLY_GEOGRAPHIC_RESTRICTIONS',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_APPLY_GEOGRAPHIC_RESTRICTIONS_DESCRIPTION',
              value: {
                get: () => this.itemData.applyGeographicRestrictions,
                set: (value) => {
                  this.itemData.applyGeographicRestrictions = value;
                }
              }
            }
          ]
        },

        // Generate follow-ups
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOW_UP',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'generateFollowUpsTeamAssignmentAlgorithm',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.followUpGenerationTeamAssignmentAlgorithm as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => this.itemData.generateFollowUpsTeamAssignmentAlgorithm,
                set: (value) => {
                  this.itemData.generateFollowUpsTeamAssignmentAlgorithm = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'generateFollowUpsOverwriteExisting',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_OVERWRITE_EXISTING',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_OVERWRITE_EXISTING_DESCRIPTION',
              value: {
                get: () => this.itemData.generateFollowUpsOverwriteExisting,
                set: (value) => {
                  this.itemData.generateFollowUpsOverwriteExisting = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'generateFollowUpsKeepTeamAssignment',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_KEEP_TEAM_ASSIGNMENT',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_KEEP_TEAM_ASSIGNMENT_DESCRIPTION',
              value: {
                get: () => this.itemData.generateFollowUpsKeepTeamAssignment,
                set: (value) => {
                  this.itemData.generateFollowUpsKeepTeamAssignment = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'periodOfFollowup',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_DURATION_FOLLOWUP_DAYS',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_DURATION_FOLLOWUP_DAYS_DESCRIPTION',
              value: {
                get: () => this.itemData.periodOfFollowup,
                set: (value) => {
                  this.itemData.periodOfFollowup = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'frequencyOfFollowUpPerDay',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_FRECQUENCY_PER_DAY',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_FRECQUENCY_PER_DAY_DESCRIPTION',
              value: {
                get: () => this.itemData.frequencyOfFollowUpPerDay,
                set: (value) => {
                  this.itemData.frequencyOfFollowUpPerDay = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'intervalOfFollowUp',
              placeholder: () => 'LNG_OUTBREAK_FIELD_LABEL_INTERVAL_OF_FOLLOW_UPS',
              description: () => 'LNG_OUTBREAK_FIELD_LABEL_INTERVAL_OF_FOLLOW_UPS_DESCRIPTION',
              value: {
                get: () => this.itemData.intervalOfFollowUp,
                set: (value) => {
                  this.itemData.intervalOfFollowUp = value;
                }
              },
              validators: {
                required: () => true,
                regex: () => ({
                  expression: '^\\s*([1-9][0-9]*)(\\s*,\\s*([1-9][0-9]*))*$',
                  msg: 'LNG_FORM_VALIDATION_ERROR_PATTERN'
                })
              }
            }
          ]
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
          link: () => ['/outbreaks', this.itemData?.id, 'view']
        }
      },
      modify: {
        link: {
          link: () => ['/outbreaks', this.itemData?.id, 'modify']
        },
        visible: () => OutbreakModel.canModify(this.authUser)
      },
      createCancel: {
        link: {
          link: () => ['/outbreaks']
        }
      },
      viewCancel: {
        link: {
          link: () => ['/outbreaks']
        }
      },
      modifyCancel: {
        link: {
          link: () => ['/outbreaks']
        }
      },
      quickActions: {
        options: [
          // #TODO
          // // Record details
          // {
          //   type: CreateViewModifyV2MenuType.OPTION,
          //   label: 'LNG_PAGE_MODIFY_CASE_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
          //   action: {
          //     click: () => {
          //       // show record details dialog
          //       this.dialogV2Service.showRecordDetailsDialog(
          //         'LNG_PAGE_MODIFY_CASE_TAB_PERSONAL_SECTION_RECORD_DETAILS_TITLE',
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
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {
    this.expandListColumnRenderer = {
      type: CreateViewModifyV2ExpandColumnType.TEXT,
      get: (item: OutbreakModel) => item.name,
      link: (item: OutbreakModel) => ['/outbreaks', item.id, 'view']
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
  protected initializeExpandListAdvancedFilters(): void {
    this.expandListAdvancedFilters = OutbreakModel.generateAdvancedFilters({
      options: {
        disease: (this.activatedRoute.snapshot.data.disease as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        country: (this.activatedRoute.snapshot.data.country as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        geographicalLevel: (this.activatedRoute.snapshot.data.geographicalLevel as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        followUpGenerationTeamAssignmentAlgorithm: (this.activatedRoute.snapshot.data.followUpGenerationTeamAssignmentAlgorithm as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options
      }
    });
  }

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
    this.expandListRecords$ = this.outbreakDataService
      .getOutbreaksList(data.queryBuilder)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }
}
