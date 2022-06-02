import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable, of } from 'rxjs';
import { throwError } from 'rxjs/internal/observable/throwError';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { AddressModel } from '../../../../core/models/address.model';
import { CaseModel } from '../../../../core/models/case.model';
import { Constants } from '../../../../core/models/constants';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityType } from '../../../../core/models/entity-type';
import { EventModel } from '../../../../core/models/event.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { UserSettings } from '../../../../core/models/user.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { V2AdvancedFilterType } from '../../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { TopnavComponent } from '../../../../core/components/topnav/topnav.component';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { LocationModel } from '../../../../core/models/location.model';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { DashboardModel } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-cases-list',
  templateUrl: './marked-not-duplicates-list.component.html'
})
export class MarkedNotDuplicatesListComponent
  extends ListComponent<EventModel | CaseModel | ContactModel | ContactOfContactModel>
  implements OnDestroy {

  // list of not duplicates
  recordId: string;
  recordType: EntityType;
  recordData: CaseModel | ContactModel | ContactOfContactModel;

  // provide constants to template
  Constants = Constants;
  UserSettings = UserSettings;

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private toastV2Service: ToastV2Service,
    private route: ActivatedRoute,
    private entityDataService: EntityDataService,
    private caseDataService: CaseDataService,
    private contactDataService: ContactDataService,
    private contactOfContactDataService: ContactsOfContactsDataService,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService,
    private dialogV2Service: DialogV2Service,
    private locationDataService: LocationDataService
  ) {
    // parent
    super(listHelperService);

    // disable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = true;

    // retrieve  id
    const paramMap = this.route.snapshot.paramMap;
    if (paramMap.get('caseId')) {
      this.recordId = paramMap.get('caseId');
      this.recordType = EntityType.CASE;
    } else if (paramMap.get('contactId')) {
      this.recordId = paramMap.get('contactId');
      this.recordType = EntityType.CONTACT;
    } else if (paramMap.get('contactOfContactId')) {
      this.recordId = paramMap.get('contactOfContactId');
      this.recordType = EntityType.CONTACT_OF_CONTACT;
    }
  }

  /**
   * Component destroyed
   */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();

    // enable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = false;
  }

  /**
  * Selected outbreak was changed
  */
  selectedOutbreakChanged(): void {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);

    // retrieve case / contact data
    this.getCaseContactData();
  }

  /**
   * Retrieve case / contact data
   */
  getCaseContactData() {
    // do we have contact type and outbreak data ?
    if (!this.recordType) {
      return;
    }

    // construct case / contact observer to retrieve data
    let observer$: Observable<CaseModel | ContactModel | ContactOfContactModel>;
    switch (this.recordType) {
      case EntityType.CASE:
        if (CaseModel.canView(this.authUser)) {
          observer$ = this.caseDataService.getCase(
            this.selectedOutbreak.id,
            this.recordId
          );
        }
        break;
      case EntityType.CONTACT:
        if (ContactModel.canView(this.authUser)) {
          observer$ = this.contactDataService.getContact(
            this.selectedOutbreak.id,
            this.recordId
          );
        }
        break;
      case EntityType.CONTACT_OF_CONTACT:
        if (ContactOfContactModel.canView(this.authUser)) {
          observer$ = this.contactOfContactDataService.getContactOfContact(
            this.selectedOutbreak.id,
            this.recordId
          );
        }
        break;
    }

    // get case / contact data
    if (observer$) {
      observer$.subscribe((recordData) => {
        // set data
        this.recordData = recordData;

        // update breadcrumbs
        this.initializeBreadcrumbs();
      });
    } else {
      // update breadcrumbs
      this.initializeBreadcrumbs();
    }
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns() {
    // address model used to search by phone number, address line, postal code, city....
    const filterAddressModel: AddressModel = new AddressModel({
      geoLocationAccurate: ''
    });

    // default table columns
    this.tableColumns = [
      {
        field: 'lastName',
        label: 'LNG_ENTITY_FIELD_LABEL_LAST_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'firstName',
        label: 'LNG_ENTITY_FIELD_LABEL_FIRST_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'visualId',
        label: 'LNG_ENTITY_FIELD_LABEL_VISUAL_ID',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'age',
        label: 'LNG_ENTITY_FIELD_LABEL_AGE',
        format: {
          type: V2ColumnFormat.AGE
        },
        sortable: true,
        filter: {
          type: V2FilterType.AGE_RANGE,
          min: 0,
          max: Constants.DEFAULT_AGE_MAX_YEARS
        }
      },
      {
        field: 'gender',
        label: 'LNG_ENTITY_FIELD_LABEL_GENDER',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'phoneNumber',
        label: 'LNG_ENTITY_FIELD_LABEL_PHONE_NUMBER',
        format: {
          type: 'mainAddress.phoneNumber'
        },
        sortable: true,
        filter: {
          type: V2FilterType.ADDRESS_PHONE_NUMBER,
          address: filterAddressModel,
          field: 'addresses',
          fieldIsArray: true
        }
      },
      {
        field: 'location',
        label: 'LNG_ADDRESS_FIELD_LABEL_LOCATION',
        format: {
          type: 'mainAddress.location.name'
        },
        link: (data) => {
          return data.mainAddress?.location?.name ?
            `/locations/${data.mainAddress.location.id}/view` :
            undefined;
        }
      },
      {
        field: 'addresses.addressLine1',
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS',
        notVisible: true,
        format: {
          type: 'mainAddress.addressLine1'
        }
      },
      {
        field: 'addresses.city',
        label: 'LNG_ADDRESS_FIELD_LABEL_CITY',
        notVisible: true,
        format: {
          type: 'mainAddress.city'
        }
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
          // View
          {
            type: V2ActionType.ICON,
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_MARKED_AS_NOT_DUPLICATES_ACTION_VIEW_ENTITY',
            action: {
              link: (item: CaseModel | ContactModel | ContactOfContactModel): string[] => {
                return [
                  `/${ EntityModel.getLinkForEntityType(item.type) }`,
                  item.id,
                  'view'
                ];
              }
            },
            visible: (item: CaseModel | ContactModel | ContactOfContactModel): boolean => {
              return !item.deleted &&
                this.selectedOutbreakIsActive &&
                item.canView(this.authUser);
            }
          },

          // Modify
          {
            type: V2ActionType.ICON,
            icon: 'edit',
            iconTooltip: 'LNG_PAGE_LIST_MARKED_AS_NOT_DUPLICATES_ACTION_MODIFY_ENTITY',
            action: {
              link: (item: CaseModel | ContactModel | ContactOfContactModel): string[] => {
                return [
                  `/${ EntityModel.getLinkForEntityType(item.type) }`,
                  item.id,
                  'modify'
                ];
              }
            },
            visible: (item: CaseModel | ContactModel | ContactOfContactModel): boolean => {
              return !item.deleted &&
                this.selectedOutbreakIsActive &&
                item.canModify(this.authUser);
            }
          },

          // Other actions
          {
            type: V2ActionType.MENU,
            icon: 'more_horiz',
            menuOptions: [
              // Delete
              {
                label: {
                  get: () => 'LNG_PAGE_LIST_MARKED_AS_NOT_DUPLICATES_ACTION_REMOVE_FROM_LIST_ENTITY'
                },
                cssClasses: () => 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: CaseModel | ContactModel | ContactOfContactModel) => {
                    this.dialogV2Service.showConfirmDialog({
                      config: {
                        title: {
                          get: () => 'LNG_COMMON_LABEL_DELETE',
                          data: () => ({
                            name: item.name
                          })
                        },
                        message: {
                          get: () => 'LNG_PAGE_LIST_MARKED_AS_NOT_DUPLICATES_ACTION_REMOVE_FROM_LIST_ENTITY_CONFIRMATION',
                          data: () => ({
                            name: item.name
                          })
                        }
                      }
                    }).subscribe((response) => {
                      // canceled ?
                      if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                        // finished
                        return;
                      }

                      // show loading
                      const loading = this.dialogV2Service.showLoadingDialog();

                      // delete
                      this.entityDataService
                        .markPersonAsOrNotADuplicate(
                          this.selectedOutbreak.id,
                          this.recordType,
                          this.recordId,
                          [],
                          [item.id]
                        )
                        .pipe(
                          catchError((err) => {
                            // show error
                            this.toastV2Service.error(err);

                            // hide loading
                            loading.close();

                            // send error down the road
                            return throwError(err);
                          })
                        )
                        .subscribe(() => {
                          // success
                          this.toastV2Service.success('LNG_PAGE_LIST_MARKED_AS_NOT_DUPLICATES_ACTION_DELETE_SUCCESS_MESSAGE');

                          // hide loading
                          loading.close();

                          // reload data
                          this.needsRefreshList(true);
                        });
                    });
                  }
                },
                visible: (item: CaseModel | ContactModel | ContactOfContactModel): boolean => {
                  return !item.deleted &&
                    this.selectedOutbreakIsActive &&
                    item.canModify(this.authUser);
                }
              }
            ]
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
  protected initializeTableAdvancedFilters(): void {
    // initialize
    this.advancedFilters = [
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'firstName',
        label: 'LNG_ENTITY_FIELD_LABEL_FIRST_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'lastName',
        label: 'LNG_ENTITY_FIELD_LABEL_LAST_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'visualId',
        label: 'LNG_ENTITY_FIELD_LABEL_VISUAL_ID',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_AGE,
        field: 'age',
        label: 'LNG_ENTITY_FIELD_LABEL_AGE'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'gender',
        label: 'LNG_ENTITY_FIELD_LABEL_GENDER',
        options: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        sortable: true
      }
    ];
  }

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
    // initialise breadcrumbs array
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

    // add list / view / modify record breadcrumbs
    if (this.recordType === EntityType.CASE) {
      // list
      if (CaseModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_CASES_TITLE',
          action: { link: ['/cases'] }
        });
      }

      // view / modify
      if (this.recordData) {
        this.breadcrumbs.push({
          label: this.translateService.instant(
            'LNG_PAGE_VIEW_CASE_TITLE',
            { name: this.recordData.name }
          ),
          action: {
            link: [`/cases/${ this.recordId }/view`]
          }
        });
      }
    } else if (this.recordType === EntityType.CONTACT) {
      // list
      if (ContactModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
          action: { link: ['/contacts'] }
        });
      }

      // view / modify
      if (this.recordData) {
        this.breadcrumbs.push({
          label: this.translateService.instant(
            'LNG_PAGE_VIEW_CONTACT_TITLE',
            { name: this.recordData.name }
          ),
          action: { link: [`/contacts/${ this.recordId }/view`] }
        });
      }
    } else if (this.recordType === EntityType.CONTACT_OF_CONTACT) {
      // list
      if (ContactOfContactModel.canList(this.authUser)) {
        this.breadcrumbs.push({
          label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
          action: { link: ['/contacts-of-contacts'] }
        });
      }

      // view / modify
      if (this.recordData) {
        this.breadcrumbs.push({
          label: this.translateService.instant(
            'LNG_PAGE_VIEW_CONTACT_OF_CONTACT_TITLE',
            { name: this.recordData.name }
          ),
          action: { link: [`/contacts-of-contacts/${ this.recordId }/view`] }
        });
      }
    }

    // add main breadcrumb
    this.breadcrumbs.push({
      label:  'LNG_PAGE_LIST_MARKED_AS_NOT_DUPLICATES_TITLE',
      action: null
    });
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [
      'id',
      'lastName',
      'firstName',
      'visualId',
      'age',
      'gender',
      'address',
      'addresses',
      'phoneNumber',
      'type',
      'relationship',
      'labResults'
    ];
  }

  /**
   * Re(load) the list, based on the applied filter, sort criterias
   */
  refreshList() {
    // retrieve the list of Entities
    this.records$ = this.entityDataService
      .getEntitiesMarkedAsNotDuplicates(
        this.selectedOutbreak.id,
        this.recordType,
        this.recordId,
        this.queryBuilder
      )
      .pipe(
        switchMap((data) => {
          // determine locations that we need to retrieve
          const locationsIdsMap: {
            [locationId: string]: true
          } = {};
          data.forEach((item) => {
            const addresses: AddressModel[] = item instanceof EventModel ?
              [item.address] :
              item.addresses;
            (addresses || []).forEach((address) => {
              // nothing to add ?
              if (!address?.locationId) {
                return;
              }

              // add location to list
              locationsIdsMap[address.locationId] = true;
            });
          });

          // determine ids
          const locationIds: string[] = Object.keys(locationsIdsMap);

          // nothing to retrieve ?
          if (locationIds.length < 1) {
            return of(data);
          }

          // construct location query builder
          const qb = new RequestQueryBuilder();
          qb.filter.bySelect(
            'id',
            locationIds,
            false,
            null
          );

          // retrieve locations
          return this.locationDataService
            .getLocationsList(qb)
            .pipe(
              map((locations) => {
                // map locations
                const locationsMap: {
                  [locationId: string]: LocationModel
                } = {};
                locations.forEach((location) => {
                  locationsMap[location.id] = location;
                });

                // set locations
                data.forEach((item) => {
                  const addresses: AddressModel[] = item instanceof EventModel ?
                    [item.address] :
                    item.addresses;
                  (addresses || []).forEach((address) => {
                    address.location = address.locationId && locationsMap[address.locationId] ?
                      locationsMap[address.locationId] :
                      address.location;
                  });
                });

                // finished
                return data;
              })
            );
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
     * Get total number of items, based on the applied filters
     */
  refreshListCount(applyHasMoreLimit?: boolean) {
    // reset
    this.pageCount = undefined;

    // set apply value
    if (applyHasMoreLimit !== undefined) {
      this.applyHasMoreLimit = applyHasMoreLimit;
    }

    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();

    // apply has more limit
    if (this.applyHasMoreLimit) {
      countQueryBuilder.flag(
        'applyHasMoreLimit',
        true
      );
    }

    // count
    this.entityDataService
      .getEntitiesMarkedAsNotDuplicatesCount(
        this.selectedOutbreak.id,
        this.recordType,
        this.recordId,
        countQueryBuilder
      )
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      ).subscribe((response) => {
        this.pageCount = response;
      });
  }
}
