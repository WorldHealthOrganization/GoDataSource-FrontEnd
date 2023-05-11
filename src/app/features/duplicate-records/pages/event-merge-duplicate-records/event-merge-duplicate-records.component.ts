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
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2CreateOrUpdate, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { UserModel } from '../../../../core/models/user.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
  selector: 'app-event-merge-duplicate-records',
  templateUrl: './event-merge-duplicate-records.component.html'
})
export class EventMergeDuplicateRecordsComponent extends CreateViewModifyComponent<EventModel> implements OnDestroy {
  // data
  private _mergeRecordIds: string[];
  private _uniqueOptions: {
    name: ILabelValuePairModel[],
    date: ILabelValuePairModel[],
    dateOfReporting: ILabelValuePairModel[],
    isDateOfReportingApproximate: ILabelValuePairModel[],
    visualId: ILabelValuePairModel[],
    responsibleUserId: ILabelValuePairModel[],
    eventCategory: ILabelValuePairModel[],
    endDate: ILabelValuePairModel[],
    description: ILabelValuePairModel[]
    addresses: ILabelValuePairModel[]
  };
  private _addressID: string;

  /**
   * Constructor
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    private outbreakDataService: OutbreakDataService,
    private i18nService: I18nService,
    private locationDataService: LocationDataService,
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

    // retrieve events ids
    this._mergeRecordIds = JSON.parse(this.activatedRoute.snapshot.queryParams.ids);
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
        this._mergeRecordIds,
        true,
        null
      );

      // records
      this.outbreakDataService
        .getPeopleList(this.selectedOutbreak.id, qb)
        .pipe(
          catchError((err) => {
            subscriber.error(err);
            return throwError(err);
          })
        )
        .subscribe((mergeRecords) => {
          // map locations
          const locationsMap: {
            [id: string]: string
          } = {};

          // determine and format data for each item
          const finish = () => {
            // determine data
            this._uniqueOptions = {
              name: this.getFieldOptions(
                mergeRecords,
                'name'
              ).options,
              date: this.getFieldOptions(
                mergeRecords,
                'date'
              ).options,
              dateOfReporting: this.getFieldOptions(
                mergeRecords,
                'dateOfReporting'
              ).options,
              isDateOfReportingApproximate: this.getFieldOptions(
                mergeRecords,
                'isDateOfReportingApproximate'
              ).options,
              visualId: this.getFieldOptions(
                mergeRecords,
                'visualId'
              ).options,
              responsibleUserId: this.getFieldOptions(
                mergeRecords,
                'responsibleUserId'
              ).options,
              eventCategory: this.getFieldOptions(
                mergeRecords,
                'eventCategory'
              ).options,
              endDate: this.getFieldOptions(
                mergeRecords,
                'endDate'
              ).options,
              description: this.getFieldOptions(
                mergeRecords,
                'description'
              ).options,
              addresses: []
            };

            // go through records and determine data
            mergeRecords.forEach((item) => {
              // determine addresses
              const event = item.model as EventModel;
              const eventFullAddress = event.address?.fullAddress;

              // create a full address with all fields (filter is used to remove empty strings or undefined values)
              const addressLabelFields: string = [
                eventFullAddress,
                event.address?.locationId ? locationsMap[event.address.locationId] : undefined,
                event.address?.postalCode,
                event.address?.emailAddress,
                event.address?.phoneNumber,
                event.address?.geoLocation?.lat,
                event.address?.geoLocation?.lng
              ].map((e) => e ? e.toString().trim() : e)
                .filter((e) => e)
                .join(', ');

              // add to list ?
              if (addressLabelFields) {
                this._uniqueOptions.addresses.push({
                  label: addressLabelFields,
                  value: event.id,
                  data: event.address
                });
              }
            });

            // auto-select if only one value
            const data: EventModel = new EventModel();
            data.name = this._uniqueOptions.name.length === 1 ?
              this._uniqueOptions.name[0].value :
              data.name;
            data.date = this._uniqueOptions.date.length === 1 ?
              this._uniqueOptions.date[0].value :
              data.date;
            data.dateOfReporting = this._uniqueOptions.dateOfReporting.length === 1 ?
              this._uniqueOptions.dateOfReporting[0].value :
              data.dateOfReporting;
            data.isDateOfReportingApproximate = this._uniqueOptions.isDateOfReportingApproximate.length === 1 ?
              this._uniqueOptions.isDateOfReportingApproximate[0].value :
              data.isDateOfReportingApproximate;
            data.visualId = this._uniqueOptions.visualId.length === 1 ?
              this._uniqueOptions.visualId[0].value :
              data.visualId;
            data.responsibleUserId = this._uniqueOptions.responsibleUserId.length === 1 ?
              this._uniqueOptions.responsibleUserId[0].value :
              data.responsibleUserId;
            data.eventCategory = this._uniqueOptions.eventCategory.length === 1 ?
              this._uniqueOptions.eventCategory[0].value :
              data.eventCategory;
            data.endDate = this._uniqueOptions.endDate.length === 1 ?
              this._uniqueOptions.endDate[0].value :
              data.endDate;
            data.description = this._uniqueOptions.description.length === 1 ?
              this._uniqueOptions.description[0].value :
              data.description;
            this._addressID = this._uniqueOptions.addresses.length === 1 ?
              this._uniqueOptions.addresses[0].value :
              undefined;
            data.address = this._addressID !== undefined ?
              this._uniqueOptions.addresses.find((addressItem) => addressItem.value === this._addressID).data :
              undefined;

            // finish
            subscriber.next(data);
            subscriber.complete();
          };

          // map list of location Ids
          const locationIdsMap: {
            [locationId: string]: true
          } = {};
          mergeRecords.forEach((item) => {
            if ((item.model as EventModel)?.address?.locationId) {
              locationIdsMap[(item.model as EventModel).address.locationId] = true;
            }
          });

          // check if there are location to retrieve
          const locationIds: string[] = Object.keys(locationIdsMap);
          if (locationIds.length) {
            // construct query builder
            const qbLocations: RequestQueryBuilder = new RequestQueryBuilder();
            qb.fields(
              'id',
              'name'
            );
            qbLocations.filter.bySelect(
              'id',
              locationIds,
              false,
              null
            );

            // retrieve locations
            this.locationDataService
              .getLocationsList(qbLocations)
              .pipe(
                catchError((err) => {
                  // finished
                  subscriber.error(err);
                  return throwError(err);
                })
              )
              .subscribe((locations) => {
                // map the new locations
                locations.forEach((location) => {
                  locationsMap[location.id] = location.name;
                });

                // format data
                finish();
              });
          } else {
            // format data
            finish();
          }
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
        this.initializeTabsDetails()
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
  refreshExpandList(_data): void {}

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
      quickActions: undefined
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
      // cleanup
      delete data.addresses;

      // finished
      this.outbreakDataService
        .mergePeople(
          this.selectedOutbreak.id,
          EntityType.EVENT,
          this._mergeRecordIds,
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
          this.toastV2Service.success('LNG_PAGE_EVENT_MERGE_DUPLICATE_RECORDS_MERGE_EVENTS_SUCCESS_MESSAGE');

          // finished with success
          finished(undefined, item);
        });
    };
  }

  // get field unique options
  private getFieldOptions(
    mergeRecords: EntityModel[],
    key: string
  ): { options: ILabelValuePairModel[], value: any } {
    switch (key) {
      case 'date': return EntityModel.uniqueDateOptions(mergeRecords, key);
      case 'endDate': return EntityModel.uniqueDateOptions(mergeRecords, key);
      case 'dateOfReporting': return EntityModel.uniqueDateOptions(mergeRecords, key);
      case 'isDateOfReportingApproximate': return EntityModel.uniqueBooleanOptions(mergeRecords, key);
      case 'responsibleUserId': {
        const uniqueUserOptions = EntityModel.uniqueStringOptions(mergeRecords, key);
        uniqueUserOptions.options.forEach(
          (labelValuePair) => {
            labelValuePair.label = (this.activatedRoute.snapshot.data.users as IResolverV2ResponseModel<UserModel>).map[labelValuePair.value] ?
              (this.activatedRoute.snapshot.data.users as IResolverV2ResponseModel<UserModel>).map[labelValuePair.value].name :
              labelValuePair.label;
          });
        return uniqueUserOptions;
      }

      default: return EntityModel.uniqueStringOptions(mergeRecords, key);
    }
  }

  /**
  * Initialize tab details
  */
  private initializeTabsDetails(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'details',
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
            options: this._uniqueOptions.name,
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
            options: this._uniqueOptions.date,
            value: {
              get: () => this.itemData.date as any,
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
            options: this._uniqueOptions.dateOfReporting,
            value: {
              get: () => this.itemData.dateOfReporting,
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
            options: this._uniqueOptions.isDateOfReportingApproximate,
            value: {
              get: () => this.itemData.isDateOfReportingApproximate as any,
              set: (value) => {
                this.itemData.isDateOfReportingApproximate = value as any;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'visualId',
            placeholder: () => 'LNG_EVENT_FIELD_LABEL_VISUAL_ID',
            description: () => this.i18nService.instant(
              'LNG_EVENT_FIELD_LABEL_VISUAL_ID_DESCRIPTION',
              this.selectedOutbreak.eventIdMask
            ),
            options: this._uniqueOptions.visualId,
            value: {
              get: () => this.itemData.visualId,
              set: (value) => {
                this.itemData.visualId = value;
              }
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'responsibleUserId',
            placeholder: () => 'LNG_EVENT_FIELD_LABEL_RESPONSIBLE_USER_ID',
            description: () => 'LNG_EVENT_FIELD_LABEL_RESPONSIBLE_USER_ID_DESCRIPTION',
            options: this._uniqueOptions.responsibleUserId,
            value: {
              get: () => this.itemData.responsibleUserId,
              set: (value) => {
                this.itemData.responsibleUserId = value;
              }
            },
            replace: {
              condition: () => !UserModel.canListForFilters(this.authUser),
              html: this.i18nService.instant('LNG_PAGE_CREATE_EVENT_CANT_SET_RESPONSIBLE_ID_TITLE')
            }
          }, {
            type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
            name: 'eventCategory',
            placeholder: () => 'LNG_EVENT_FIELD_LABEL_EVENT_CATEGORY',
            description: () => 'LNG_EVENT_FIELD_LABEL_EVENT_CATEGORY_DESCRIPTION',
            options: this._uniqueOptions.eventCategory,
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
            options: this._uniqueOptions.endDate,
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
            options: this._uniqueOptions.description,
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
              options: this._uniqueOptions.addresses,
              value: {
                get: () => this._addressID,
                set: (value: any) => {
                  this._addressID = value ?
                    value :
                    undefined;
                  this.itemData.address = this._addressID !== undefined ?
                    this._uniqueOptions.addresses.find((addressItem) => addressItem.value === this._addressID).data :
                    undefined;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.ADDRESS,
              typeOptions: (this.activatedRoute.snapshot.data.addressType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              name: 'address',
              value: {
                get: () => this.itemData.address
              },
              visible: () => !!this.itemData.address,
              readonly: true
            }
          ]
        }
      ]
    };
  }
}
