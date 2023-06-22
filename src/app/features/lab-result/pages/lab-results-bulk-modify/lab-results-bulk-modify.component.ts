import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { Observable, throwError } from 'rxjs';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { catchError, takeUntil } from 'rxjs/operators';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2CreateOrUpdate, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { Constants } from '../../../../core/models/constants';
import { moment } from '../../../../core/helperClasses/x-moment';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';

@Component({
  selector: 'app-lab-results-bulk-modify',
  templateUrl: './lab-results-bulk-modify.component.html'
})
export class LabResultsBulkModifyComponent extends CreateViewModifyComponent<LabResultModel> implements OnDestroy {
  // data
  private _selectedLabResults: LabResultModel[] = [];

  // parent entity
  private _parentEntity: CaseModel | ContactModel;

  /**
   * Constructor
   */
  constructor(
    protected router: Router,
    protected activatedRoute: ActivatedRoute,
    protected labResultDataService: LabResultDataService,
    protected toastV2Service: ToastV2Service,
    protected i18nService: I18nService,
    protected referenceDataHelperService: ReferenceDataHelperService,
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

    // retrieve data
    this._parentEntity = this.activatedRoute.snapshot.data.entity;
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
  protected createNewItem(): LabResultModel {
    return null;
  }

  /**
  * Retrieve item
  */
  protected retrieveItem(): Observable<LabResultModel> {
    return new Observable<LabResultModel>((subscriber) => {
      // retrieve lab results information
      const qb: RequestQueryBuilder = new RequestQueryBuilder();

      // bring specific lab results
      qb.filter.bySelect(
        'id',
        JSON.parse(this.activatedRoute.snapshot.queryParams.labResultsIds),
        true,
        null
      );

      // retrieve lab results details
      this.labResultDataService
        .getOutbreakLabResults(
          this.selectedOutbreak.id,
          qb
        )
        .pipe(
          catchError((err) => {
            // hide loading
            subscriber.error(err);

            // send error down the road
            return throwError(err);
          })
        )
        .subscribe((labResults: LabResultModel[]) => {
          // lab results data
          this._selectedLabResults = labResults;

          // finished - no item to edit
          subscriber.next(new LabResultModel());
          subscriber.complete();
        });
    });
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
    if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_LAB_RESULT_LIST_TITLE';
      this.pageTitleData = undefined;
    }
  }

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs() {
    // reset breadcrumbs
    this.breadcrumbs = [{
      label: 'LNG_COMMON_LABEL_HOME',
      action: {
        link: DashboardModel.canViewDashboard(this.authUser) ?
          ['/dashboard'] :
          ['/account/my-profile']
      }
    }];

    // do we have parent ?
    if (this._parentEntity) {
      // case / event list & view pages
      if (this._parentEntity.type === EntityType.CASE) {
        // case list page
        if (CaseModel.canList(this.authUser)) {
          this.breadcrumbs.push({
            label: 'LNG_PAGE_LIST_CASES_TITLE',
            action: {
              link: ['/cases']
            }
          });
        }

        // case view page
        if (CaseModel.canView(this.authUser)) {
          this.breadcrumbs.push({
            label: this._parentEntity.name,
            action: {
              link: [`/cases/${this._parentEntity.id}/view`]
            }
          });
        }
      } else {
        // contact list page
        if (ContactModel.canList(this.authUser)) {
          this.breadcrumbs.push({
            label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
            action: {
              link: ['/contacts']
            }
          });
        }

        // contact view page
        if (ContactModel.canView(this.authUser)) {
          this.breadcrumbs.push({
            label: this._parentEntity.name,
            action: {
              link: [`/contacts/${this._parentEntity.id}/view`]
            }
          });
        }
      }

      // entity lab results page
      this.breadcrumbs.push(
        {
          label: 'LNG_PAGE_LIST_LAB_RESULTS_TITLE',
          action: {
            link: [
              '/lab-results',
              this._parentEntity.type === EntityType.CASE ?
                'cases' :
                'contacts',
              this._parentEntity.id
            ]
          }
        }
      );
    } else {
      // global lab results list page
      this.breadcrumbs.push(
        {
          label: 'LNG_PAGE_LIST_LAB_RESULTS_TITLE',
          action: {
            link: ['/lab-results']
          }
        }
      );
    }

    // main route
    this.breadcrumbs.push({
      label: 'LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_TITLE',
      action: null
    });
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
        this.initializeDetailTab()
      ],

      // create details
      create: null,

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: () => {
        // redirect
        if (this._parentEntity) {
          this.router.navigate([
            '/lab-results',
            this._parentEntity.type === EntityType.CASE ?
              'cases' :
              'contacts',
            this._parentEntity.id
          ]);
        } else {
          this.router.navigate(['/lab-results']);
        }
      }
    };
  }

  /**
   * Details tabs
   */
  private initializeDetailTab(): ICreateViewModifyV2Tab {
    // modify ?
    return {
      // Details
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'details',
      label: 'LNG_COMMON_LABEL_DETAILS',
      sections: [
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: null,
          inputs: [
            // warnings
            {
              type: CreateViewModifyV2TabInputType.LABEL,
              value: {
                get: () => 'LNG_PAGE_MODIFY_LAB_RESULT_LIST_MODIFY_DATA_INFO_LABEL'
              }
            },

            // selected results
            {
              type: CreateViewModifyV2TabInputType.LINK_LIST,
              label: {
                get: () => 'LNG_PAGE_MODIFY_LAB_RESULT_SELECTED_CONTACTS'
              },
              links: this._selectedLabResults.map((result) => ({
                label: result.labName ?
                  `${
                    (this.activatedRoute.snapshot.data.labName as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[result.labName] ?
                      this.i18nService.instant((this.activatedRoute.snapshot.data.labName as IResolverV2ResponseModel<ReferenceDataEntryModel>).map[result.labName].value) :
                      '—'
                  } (${result.dateSampleTaken ? moment(result.dateSampleTaken).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) : '—'})` :
                  (
                    result.dateSampleTaken ?
                      moment(result.dateSampleTaken).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
                      '—'
                  ),
                action: {
                  link: () => LabResultModel.canView(this.authUser) ?
                    [
                      '/lab-results',
                      result.person.type === EntityType.CASE ? 'cases' : 'contacts',
                      result.person.id,
                      result.id,
                      'view'
                    ] :
                    undefined
                }
              }))
            }
          ]
        }, {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_PAGE_MODIFY_LAB_RESULT_TAB_DETAILS_TITLE',
          inputs: [
            // inputs
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'labName',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_LAB_NAME',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_LAB_NAME_DESCRIPTION',
              options: this.referenceDataHelperService.filterPerOutbreakOptions(
                this.selectedOutbreak,
                (this.activatedRoute.snapshot.data.labName as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                undefined
              ),
              value: {
                get: () => null,
                set: () => null
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'result',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_RESULT',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_RESULT_DESCRIPTION',
              options: this.referenceDataHelperService.filterPerOutbreakOptions(
                this.selectedOutbreak,
                (this.activatedRoute.snapshot.data.labTestResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                undefined
              ),
              value: {
                get: () => null,
                set: () => null
              }
            },
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'testedFor',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR_DESCRIPTION',
              value: {
                get: () => null,
                set: () => null
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'status',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_STATUS',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_STATUS_DESCRIPTION',
              options: (this.activatedRoute.snapshot.data.labResultProgress as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              value: {
                get: () => null,
                set: () => null
              }
            }
          ]
        },
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'sequence[hasSequence]',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_HAS_SEQUENCE',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_HAS_SEQUENCE_DESCRIPTION',
              value: {
                get: () => this.itemData.sequence.hasSequence,
                set: (value) => {
                  // set value
                  this.itemData.sequence.hasSequence = value;

                  // reset data
                  if (this.itemData.sequence.hasSequence) {
                    this.itemData.sequence.noSequenceReason = null;
                  } else {
                    this.itemData.sequence.dateSampleSent = null;
                    this.itemData.sequence.labId = null;
                    this.itemData.sequence.dateResult = null;
                    this.itemData.sequence.resultId = null;
                  }
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.DATE,
              name: 'sequence[dateSampleSent]',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_SAMPLE_SENT',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_SAMPLE_SENT_DESCRIPTION',
              value: {
                get: () => this.itemData.sequence.dateSampleSent,
                set: (value) => {
                  this.itemData.sequence.dateSampleSent = value;
                }
              },
              disabled: () => !this.itemData.sequence.hasSequence
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'sequence[labId]',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_LAB',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_LAB_DESCRIPTION',
              options: this.referenceDataHelperService.filterPerOutbreakOptions(
                this.selectedOutbreak,
                (this.activatedRoute.snapshot.data.labSequenceLaboratory as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                undefined
              ),
              value: {
                get: () => this.itemData.sequence.labId,
                set: (value) => {
                  this.itemData.sequence.labId = value;
                }
              },
              disabled: () => !this.itemData.sequence.hasSequence
            },
            {
              type: CreateViewModifyV2TabInputType.DATE,
              name: 'sequence[dateResult]',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_RESULT',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_RESULT_DESCRIPTION',
              value: {
                get: () => this.itemData.sequence.dateResult,
                set: (value) => {
                  this.itemData.sequence.dateResult = value;
                }
              },
              disabled: () => !this.itemData.sequence.hasSequence
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'sequence[resultId]',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_RESULT',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_RESULT_DESCRIPTION',
              options: this.referenceDataHelperService.filterPerOutbreakOptions(
                this.selectedOutbreak,
                (this.activatedRoute.snapshot.data.labSequenceResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
                undefined
              ),
              value: {
                get: () => this.itemData.sequence.resultId,
                set: (value) => {
                  this.itemData.sequence.resultId = value;
                }
              },
              disabled: () => !this.itemData.sequence.hasSequence
            },
            {
              type: CreateViewModifyV2TabInputType.TEXTAREA,
              name: 'sequence[noSequenceReason]',
              placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_NO_SEQUENCE_REASON',
              description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_NO_SEQUENCE_REASON_DESCRIPTION',
              value: {
                get: () => this.itemData.sequence.noSequenceReason,
                set: (value) => {
                  this.itemData.sequence.noSequenceReason = value;
                }
              },
              disabled: () => this.itemData.sequence.hasSequence
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
      view: null,
      modify: {
        link: {
          link: () => [
            '/lab-results'
          ]
        },
        visible: () => LabResultModel.canList(this.authUser)
      },
      createCancel: null,
      modifyCancel: {
        link: {
          link: () => [
            '/lab-results'
          ]
        },
        visible: () => LabResultModel.canList(this.authUser)
      },
      viewCancel: null
    };
  }

  /**
  * Initialize process data
  */
  private initializeProcessData(): ICreateViewModifyV2CreateOrUpdate {
    return (
      _type,
      data,
      finished
    ) => {
      // get selected lab results ids to pass them to qb
      const selectedLabResultsIds: string[] = this._selectedLabResults.map((result: LabResultModel) => {
        return result.id;
      });

      // something went wrong ?
      if (selectedLabResultsIds.length < 1) {
        // show error
        this.toastV2Service.error('LNG_PAGE_MODIFY_LAB_RESULT_LIST_ERROR_NO_LAB_RESULTS_SELECTED');

        // don't do anything
        return;
      }

      // create query
      const qb: RequestQueryBuilder = new RequestQueryBuilder();
      qb.filter.where({
        id: {
          inq: selectedLabResultsIds
        }
      });

      // do request
      this.labResultDataService
        .bulkModifyLabResults(
          this.selectedOutbreak.id,
          data,
          qb
        )
        .pipe(
          // handle error
          catchError((err) => {
            // show error
            finished(err, undefined);

            // finished
            return throwError(err);
          }),

          // should be the last pipe
          takeUntil(this.destroyed$)
        )
        .subscribe((items) => {
          // success updating event
          this.toastV2Service.success('LNG_PAGE_MODIFY_LAB_RESULT_LIST_ACTION_MODIFY_MULTIPLE_LAB_RESULTS_SUCCESS_MESSAGE');

          // finished with success
          finished(undefined, items);
        });
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {}

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {}

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {}

  /**
   * Refresh expand list
   */
  refreshExpandList(): void {}
}
