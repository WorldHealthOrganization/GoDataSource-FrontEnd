import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityType } from '../../../../core/models/entity-type';
import { catchError, takeUntil } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { EventModel } from '../../../../core/models/event.model';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { ICreateViewModifyV2Refresh } from '../../../../shared/components-v2/app-create-view-modify-v2/models/refresh.model';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2CreateOrUpdate, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { UserModel } from '../../../../core/models/user.model';
import { TranslateService } from '@ngx-translate/core';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';

@Component({
  selector: 'app-event-merge-duplicate-records',
  templateUrl: './event-merge-duplicate-records.component.html'
})
export class EventMergeDuplicateRecordsComponent extends CreateViewModifyComponent<EventModel> implements OnDestroy {
  // data
  mergeRecordIds: string[];
  mergeRecords: EntityModel[];

  /**
   * Constructor
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    private outbreakDataService: OutbreakDataService,
    private i18nService: I18nService,
    private translateService: TranslateService,
    protected toastV2Service: ToastV2Service,
    authDataService: AuthDataService,
    renderer2: Renderer2,
    redirectService: RedirectService
  ) {
    super(
      toastV2Service,
      renderer2,
      redirectService,
      activatedRoute,
      authDataService
    );

    // retrieve contacts ids
    this.mergeRecordIds = JSON.parse(this.activatedRoute.snapshot.queryParams.ids);
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
  protected createNewItem(): EventModel {
    return null;
  }

  /**
  * Retrieve item
  */
  protected retrieveItem(_record?: EventModel): Observable<EventModel> {
    return new Observable<EventModel>((subscriber) => {
      // retrieve records
      const qb = new RequestQueryBuilder();
      qb.filter.bySelect(
        'id',
        this.mergeRecordIds,
        true,
        null
      );
      this.outbreakDataService
        .getPeopleList(this.selectedOutbreak.id, qb)
        .pipe(
          catchError((err) => {
            subscriber.error(err);
            return throwError(err);
          })
        )
        .subscribe((recordMerge) => {
          // merge records
          this.mergeRecords = recordMerge;

          // Complete Observable
          subscriber.next(new EventModel());
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
    this.pageTitle = 'LNG_PAGE_EVENT_MERGE_DUPLICATE_RECORDS_TITLE';
    this.pageTitleData = undefined;
  }

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs(): void {
    // reset breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      },
      {
        label: 'LNG_PAGE_LIST_DUPLICATE_RECORDS_TITLE',
        action: {
          link: ['/duplicated-records']
        }
      },
      {
        label: 'LNG_PAGE_EVENT_MERGE_DUPLICATE_RECORDS_TITLE',
        action: null
      }
    ];
  }

  /**
    * Initialize tabs
    */
  protected initializeTabs(): void {
    this.tabData = {
      // tabs
      tabs: [
        // Personal
        this.initializeTabDetails()
      ],

      // create details
      create: null,

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: () => {
        // redirect to view
        this.redirectService.to(['/duplicated-records']);
      }
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
  refreshExpandList(_data: ICreateViewModifyV2Refresh): void {}

  /**
 * Initialize buttons
 */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: {
        link: {
          link: () => null
        },
        visible: () => false
      },
      modify: {
        link: {
          link: () => null
        },
        visible: () => false
      },
      createCancel: {
        link: {
          link: () => ['/duplicated-records']
        }
      },
      viewCancel: {
        link: {
          link: () => null
        },
        visible: () => false
      },
      modifyCancel: {
        link: {
          link: () => ['/duplicated-records']
        }
      },
      quickActions: {
        options: []
      }
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
      // finished
      this.outbreakDataService
        .mergePeople(
          this.selectedOutbreak.id,
          EntityType.EVENT,
          this.mergeRecordIds,
          data
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
        .subscribe((item) => {
          // success creating / updating event
          this.toastV2Service.success(
            'LNG_PAGE_EVENT_MERGE_DUPLICATE_RECORDS_MERGE_EVENTS_SUCCESS_MESSAGE'
          );

          // finished with success
          finished(undefined, item);
        });
    };
  }

  // get field unique options
  private getFieldOptions(key: string): { options: ILabelValuePairModel[], value: any } {
    switch (key) {
      case 'age': return EntityModel.uniqueAgeOptions(
        this.mergeRecords,
        this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS'),
        this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS')
      );
      case 'dob': return EntityModel.uniqueDobOptions(this.mergeRecords);
      case 'date': return EntityModel.uniqueDateOptions(this.mergeRecords, key);
      case 'endDate': return EntityModel.uniqueDateOptions(this.mergeRecords, key);
      case 'dateOfReporting': return EntityModel.uniqueDateOptions(this.mergeRecords, key);
      case 'isDateOfReportingApproximate': return EntityModel.uniqueBooleanOptions(this.mergeRecords, key);
      case 'responsibleUserId': {
        const uniqueUserOptions = EntityModel.uniqueStringOptions(this.mergeRecords, key);
        uniqueUserOptions.options = uniqueUserOptions.options.map(
          (labelValuePair) => {
            labelValuePair.label = this.activatedRoute.snapshot.data.users.options.find(
              (user) => user.value === labelValuePair.value).label;

            return {
              label: labelValuePair.label,
              value: labelValuePair.value
            };
          });
        return uniqueUserOptions;
      }
      case 'address': return EntityModel.uniqueAddressOptions(this.mergeRecords, key);

      default: return EntityModel.uniqueStringOptions(this.mergeRecords, key);
    }
  }

  /**
  * Initialize tab details
  */
  private initializeTabDetails(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      label: 'LNG_PAGE_MODIFY_EVENT_TAB_DETAILS_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_PAGE_MODIFY_EVENT_TAB_DETAILS_TITLE',
          inputs: [{
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'name',
            placeholder: () => 'LNG_EVENT_FIELD_LABEL_NAME',
            description: () => 'LNG_EVENT_FIELD_LABEL_NAME_DESCRIPTION',
            options: this.getFieldOptions('name').options,
            value: {
              get: () => this.itemData.name,
              set: (value) => {
                this.itemData.name = value;
              }
            },
            validators: {
              required: () => true
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'date',
            placeholder: () => 'LNG_EVENT_FIELD_LABEL_DATE',
            description: () => 'LNG_EVENT_FIELD_LABEL_DATE_DESCRIPTION',
            options: this.getFieldOptions('date').options,
            value: {
              get: () => this.itemData.date?.toString(),
              set: (value) => {
                this.itemData.date = value;
              }
            },
            validators: {
              required: () => true
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'dateOfReporting',
            placeholder: () => 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING',
            description: () => 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING_DESCRIPTION',
            options: this.getFieldOptions('dateOfReporting').options,
            value: {
              get: () => this.itemData.dateOfReporting?.toString(),
              set: (value) => {
                this.itemData.dateOfReporting = value;
              }
            },
            validators: {
              required: () => true
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'isDateOfReportingApproximate',
            placeholder: () => 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
            description: () => 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE_DESCRIPTION',
            options: this.getFieldOptions('isDateOfReportingApproximate').options,
            value: {
              get: () => this.itemData.isDateOfReportingApproximate === undefined ?
                'LNG_COMMON_LABEL_NONE' :
                (
                  this.itemData.isDateOfReportingApproximate === true ?
                    'LNG_COMMON_LABEL_YES' :
                    'LNG_COMMON_LABEL_NO'
                ),
              set: (value) => {
                this.itemData.isDateOfReportingApproximate = value === 'LNG_COMMON_LABEL_YES' ?
                  true :
                  (
                    value === 'LNG_COMMON_LABEL_NO' ?
                      false :
                      undefined
                  );
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'responsibleUserId',
            placeholder: () => 'LNG_EVENT_FIELD_LABEL_RESPONSIBLE_USER_ID',
            description: () => 'LNG_EVENT_FIELD_LABEL_RESPONSIBLE_USER_ID_DESCRIPTION',
            options: this.getFieldOptions('isDateOfReportingApproximate').options,
            value: {
              get: () => this.itemData.responsibleUserId,
              set: (value) => {
                this.itemData.responsibleUserId = value;
              }
            },
            replace: {
              condition: () => !UserModel.canListForFilters(this.authUser),
              html: this.translateService.instant('LNG_PAGE_CREATE_EVENT_CANT_SET_RESPONSIBLE_ID_TITLE')
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'eventCategory',
            placeholder: () => 'LNG_EVENT_FIELD_LABEL_EVENT_CATEGORY',
            description: () => 'LNG_EVENT_FIELD_LABEL_EVENT_CATEGORY_DESCRIPTION',
            options: this.getFieldOptions('eventCategory').options,
            value: {
              get: () => this.itemData.eventCategory,
              set: (value) => {
                this.itemData.eventCategory = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'endDate',
            placeholder: () => 'LNG_EVENT_FIELD_LABEL_END_DATE',
            description: () => 'LNG_EVENT_FIELD_LABEL_END_DATE_DESCRIPTION',
            options: this.getFieldOptions('endDate').options,
            value: {
              get: () => this.itemData.endDate?.toString(),
              set: (value) => {
                this.itemData.endDate = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'description',
            placeholder: () => 'LNG_EVENT_FIELD_LABEL_DESCRIPTION',
            description: () => 'LNG_EVENT_FIELD_LABEL_DESCRIPTION_DESCRIPTION',
            options: this.getFieldOptions('description').options,
            value: {
              get: () => this.itemData.description,
              set: (value) => {
                this.itemData.description = value;
              }
            }
          }]
        },
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_EVENT_FIELD_LABEL_ADDRESS',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'addresses',
              placeholder: () => 'LNG_EVENT_FIELD_LABEL_CHOOSE_ADDRESS',
              options: this.getFieldOptions('address').options,
              value: {
                // #TODO: Value is displayed in dropdown only after it's selected twice in a row, please investigate
                // May be because value is of type "ICreateViewModifyV2TabInputValue<string>" instead of "ICreateViewModifyV2TabInputValue<any>"
                get: () => this.itemData.address?.fullAddress,
                set: (value: any) => {
                  this.itemData.address = this.getFieldOptions('address').options.find((pair: ILabelValuePairModel) => pair.label === value.fullAddress)?.value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.ADDRESS,
              typeOptions: (this.activatedRoute.snapshot.data.addressType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              name: 'address',
              value: {
                get: () => this.itemData.address
              }
            }
          ]
        }
      ]
    };
  }
}
