import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import * as _ from 'lodash';
import * as moment from 'moment';
import { of, throwError } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { AddressModel } from '../../../../core/models/address.model';
import { ApplyListFilter, Constants } from '../../../../core/models/constants';
import { ContactModel } from '../../../../core/models/contact.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import {
  RelationshipModel,
  EntityModel
} from '../../../../core/models/entity-and-relationship.model';
import { EntityType } from '../../../../core/models/entity-type';
import { EventModel } from '../../../../core/models/event.model';
import { ExportFieldsGroupModelNameEnum } from '../../../../core/models/export-fields-group.model';
import { LocationModel } from '../../../../core/models/location.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { UserModel } from '../../../../core/models/user.model';
import { EventDataService } from '../../../../core/services/data/event.data.service';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ExportDataExtension, ExportDataMethod, IV2ExportDataConfigGroupsRequired } from '../../../../core/services/helper/models/dialog-v2.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { IV2BreadcrumbAction } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import {
  IV2ColumnPinned,
  V2ColumnFormat,
  IV2ColumnStatusFormType,
  V2ColumnStatusForm
} from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { Moment } from 'moment';
import { EntityEventHelperService } from '../../../../core/services/helper/entity-event-helper.service';

@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.component.html'
})
export class EventsListComponent
  extends ListComponent<EventModel>
  implements OnDestroy {

  // event fields
  private eventFields: ILabelValuePairModel[] = [
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_ID', value: 'id' },
    { label: 'LNG_EVENT_FIELD_LABEL_NAME', value: 'name' },
    { label: 'LNG_EVENT_FIELD_LABEL_DATE', value: 'date' },
    { label: 'LNG_EVENT_FIELD_LABEL_DESCRIPTION', value: 'description' },
    { label: 'LNG_EVENT_FIELD_LABEL_ADDRESS', value: 'address' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', value: 'createdAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', value: 'createdBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', value: 'updatedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', value: 'updatedBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED', value: 'deleted' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', value: 'deletedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', value: 'createdOn' },
    { label: 'LNG_ENTITY_FIELD_LABEL_TYPE', value: 'type' },
    { label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_EXPOSURES', value: 'numberOfExposures' },
    { label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_CONTACTS', value: 'numberOfContacts' },
    { label: 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING', value: 'dateOfReporting' },
    { label: 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE', value: 'isDateOfReportingApproximate' },
    { label: 'LNG_EVENT_FIELD_LABEL_END_DATE', value: 'endDate' },
    { label: 'LNG_EVENT_FIELD_LABEL_RESPONSIBLE_USER_ID', value: 'responsibleUser' },
    { label: 'LNG_EVENT_FIELD_LABEL_EVENT_CATEGORY', value: 'eventCategory' },
    { label: 'LNG_EVENT_FIELD_LABEL_VISUAL_ID', value: 'visualId' },
    { label: 'LNG_EVENT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS', value: 'questionnaireAnswers' }
  ];

  // relationship fields
  private relationshipFields: ILabelValuePairModel[] = [
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_ID', value: 'id' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_SOURCE', value: 'sourcePerson' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_TARGET', value: 'targetPerson' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_DATE_OF_FIRST_CONTACT', value: 'dateOfFirstContact' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE', value: 'contactDate' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE_ESTIMATED', value: 'contactDateEstimated' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL', value: 'certaintyLevelId' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE', value: 'exposureTypeId' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY', value: 'exposureFrequencyId' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION', value: 'exposureDurationId' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION', value: 'socialRelationshipTypeId' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION_DETAIL', value: 'socialRelationshipDetail' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER', value: 'clusterId' },
    { label: 'LNG_RELATIONSHIP_FIELD_LABEL_COMMENT', value: 'comment' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', value: 'createdAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', value: 'createdBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', value: 'updatedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', value: 'updatedBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED', value: 'deleted' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', value: 'deletedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', value: 'createdOn' }
  ];

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private eventDataService: EventDataService,
    private outbreakDataService: OutbreakDataService,
    private toastV2Service: ToastV2Service,
    private i18nService: I18nService,
    private redirectService: RedirectService,
    private entityHelperService: EntityHelperService,
    private dialogV2Service: DialogV2Service,
    private locationDataService: LocationDataService,
    private activatedRoute: ActivatedRoute,
    private entityEventHelperService: EntityEventHelperService
  ) {
    super(listHelperService);
  }

  /**
   * Component destroyed
   */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  /**
   * Selected outbreak was changed
   */
  selectedOutbreakChanged(): void {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
   * Table column - actions
   */
  protected initializeTableColumnActions(): void {
    this.tableColumnActions = {
      format: {
        type: V2ColumnFormat.ACTIONS
      },
      actions: [
        // View Event
        {
          type: V2ActionType.ICON,
          icon: 'visibility',
          iconTooltip: 'LNG_PAGE_LIST_EVENTS_ACTION_VIEW_EVENT',
          action: {
            link: (data: EventModel): string[] => {
              return ['/events', data.id, 'view'];
            }
          },
          visible: (item: EventModel): boolean => {
            return !item.deleted && EventModel.canView(this.authUser);
          }
        },

        // Modify Event
        {
          type: V2ActionType.ICON,
          icon: 'edit',
          iconTooltip: 'LNG_PAGE_LIST_EVENTS_ACTION_MODIFY_EVENT',
          action: {
            link: (item: EventModel): string[] => {
              return ['/events', item.id, 'modify'];
            }
          },
          visible: (item: EventModel): boolean => {
            return (
              !item.deleted &&
              this.selectedOutbreakIsActive &&
              EventModel.canModify(this.authUser)
            );
          }
        },

        // Other actions
        {
          type: V2ActionType.MENU,
          icon: 'more_horiz',
          menuOptions: [
            // Delete Event
            {
              label: {
                get: () => 'LNG_PAGE_LIST_EVENTS_ACTION_DELETE_EVENT'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: EventModel): void => {
                  // determine what we need to delete
                  this.dialogV2Service
                    .showConfirmDialog({
                      config: {
                        title: {
                          get: () => 'LNG_COMMON_LABEL_DELETE',
                          data: () => ({
                            name: item.name
                          })
                        },
                        message: {
                          get: () => 'LNG_DIALOG_CONFIRM_DELETE_EVENT',
                          data: () => ({
                            name: item.name
                          })
                        }
                      },
                      yesLabel: 'LNG_DIALOG_CONFIRM_BUTTON_OK'
                    })
                    .subscribe((response) => {
                      // canceled ?
                      if ( response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                        // finished
                        return;
                      }

                      // show loading
                      const loading =
                        this.dialogV2Service.showLoadingDialog();

                      // delete event
                      this.eventDataService
                        .deleteEvent(this.selectedOutbreak.id, item.id)
                        .pipe(
                          catchError((err) => {
                            this.toastV2Service.error(err);
                            return throwError(err);
                          })
                        )
                        .subscribe(() => {
                          this.toastV2Service.success('LNG_PAGE_LIST_EVENTS_ACTION_DELETE_SUCCESS_MESSAGE');

                          // hide loading
                          loading.close();

                          // reload data
                          this.needsRefreshList(true);
                        });
                    });
                }
              },
              visible: (item: EventModel): boolean => {
                return (
                  !item.deleted &&
                  this.selectedOutbreakIsActive &&
                  EventModel.canDelete(this.authUser)
                );
              }
            },

            // Divider
            {
              visible: (item: EventModel): boolean => {
                // visible only if at least one of the first two items is visible
                return (
                  !item.deleted &&
                  this.selectedOutbreakIsActive &&
                  EventModel.canDelete(this.authUser)
                );
              }
            },

            // Add Contact to Event
            {
              label: {
                get: () => 'LNG_PAGE_ACTION_ADD_CONTACT'
              },
              action: {
                link: (): string[] => {
                  return ['/contacts', 'create'];
                },
                linkQueryParams: (item: EventModel): Params => {
                  return {
                    entityType: EntityType.EVENT,
                    entityId: item.id
                  };
                }
              },
              visible: (item: EventModel): boolean => {
                return (
                  !item.deleted &&
                  this.selectedOutbreakIsActive &&
                  ContactModel.canCreate(this.authUser) &&
                  EventModel.canCreateContact(this.authUser)
                );
              }
            },

            // Bulk add contacts to event
            {
              label: {
                get: () => 'LNG_PAGE_ACTION_BULK_ADD_CONTACTS'
              },
              action: {
                link: (): string[] => {
                  return ['/contacts', 'create-bulk'];
                },
                linkQueryParams: (item: EventModel): Params => {
                  return {
                    entityType: EntityType.EVENT,
                    entityId: item.id
                  };
                }
              },
              visible: (item: EventModel): boolean => {
                return (
                  !item.deleted &&
                  this.selectedOutbreakIsActive &&
                  ContactModel.canBulkCreate(this.authUser) &&
                  EventModel.canBulkCreateContact(this.authUser)
                );
              }
            },

            // Divider
            {
              visible: (item: EventModel): boolean => {
                // visible only if at least one of the previous two items is visible
                return (
                  !item.deleted &&
                  this.selectedOutbreakIsActive &&
                  ((ContactModel.canCreate(this.authUser) &&
                      EventModel.canCreateContact(this.authUser)) ||
                    (ContactModel.canBulkCreate(this.authUser) &&
                      EventModel.canBulkCreateContact(this.authUser)))
                );
              }
            },

            // See event contacts
            {
              label: {
                get: () => 'LNG_PAGE_ACTION_SEE_EXPOSURES_FROM'
              },
              action: {
                link: (item: EventModel): string[] => {
                  return [
                    '/relationships',
                    EntityType.EVENT,
                    item.id,
                    'contacts'
                  ];
                }
              },
              visible: (item: EventModel): boolean => {
                return (
                  !item.deleted &&
                  RelationshipModel.canList(this.authUser) &&
                  EventModel.canListRelationshipContacts(this.authUser)
                );
              }
            },

            // See event exposures
            {
              label: {
                get: () => 'LNG_PAGE_ACTION_SEE_EXPOSURES_TO'
              },
              action: {
                link: (item: EventModel): string[] => {
                  return [
                    '/relationships',
                    EntityType.EVENT,
                    item.id,
                    'exposures'
                  ];
                }
              },
              visible: (item: EventModel): boolean => {
                return (
                  !item.deleted &&
                  RelationshipModel.canList(this.authUser) &&
                  EventModel.canListRelationshipExposures(this.authUser)
                );
              }
            },

            // Restore a deleted event
            {
              label: {
                get: () => 'LNG_PAGE_LIST_EVENTS_ACTION_RESTORE_EVENT'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: EventModel) => {
                  // show confirm dialog to confirm the action
                  this.dialogV2Service
                    .showConfirmDialog({
                      config: {
                        title: {
                          get: () => 'LNG_COMMON_LABEL_RESTORE',
                          data: () => item as any
                        },
                        message: {
                          get: () => 'LNG_DIALOG_CONFIRM_RESTORE_EVENT',
                          data: () => item as any
                        }
                      },
                      yesLabel: 'LNG_DIALOG_CONFIRM_BUTTON_OK'
                    })
                    .subscribe((response) => {
                      // canceled ?
                      if (
                        response.button.type ===
                        IV2BottomDialogConfigButtonType.CANCEL
                      ) {
                        // finished
                        return;
                      }

                      // show loading
                      const loading =
                        this.dialogV2Service.showLoadingDialog();

                      // convert
                      this.eventDataService
                        .restoreEvent(this.selectedOutbreak.id, item.id)
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
                          this.toastV2Service.success('LNG_PAGE_LIST_EVENTS_ACTION_RESTORE_SUCCESS_MESSAGE');

                          // hide loading
                          loading.close();

                          // reload data
                          this.needsRefreshList(true);
                        });
                    });
                }
              },
              visible: (item: EventModel): boolean => {
                return (
                  item.deleted &&
                  this.selectedOutbreakIsActive &&
                  EventModel.canRestore(this.authUser)
                );
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns(): void {
    // address model used to search by phone number, address line, postal code, city....
    const filterAddressModel: AddressModel = new AddressModel({
      geoLocationAccurate: ''
    });

    // set columns
    this.tableColumns = [
      {
        field: 'name',
        label: 'LNG_EVENT_FIELD_LABEL_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'visualId',
        label: 'LNG_EVENT_FIELD_LABEL_VISUAL_ID',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'date',
        label: 'LNG_EVENT_FIELD_LABEL_DATE',
        format: {
          type: V2ColumnFormat.DATE
        },
        sortable: true,
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'eventCategory',
        label: 'LNG_EVENT_FIELD_LABEL_EVENT_CATEGORY',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.eventCategory as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          includeNoValue: true
        }
      },
      {
        field: 'endDate',
        label: 'LNG_EVENT_FIELD_LABEL_END_DATE',
        format: {
          type: V2ColumnFormat.DATE
        },
        sortable: true,
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'description',
        label: 'LNG_EVENT_FIELD_LABEL_DESCRIPTION',
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'phoneNumber',
        label: 'LNG_EVENT_FIELD_LABEL_PHONE_NUMBER',
        notVisible: true,
        sortable: true,
        format: {
          type: 'mainAddress.phoneNumber'
        },
        filter: {
          type: V2FilterType.ADDRESS_PHONE_NUMBER,
          address: filterAddressModel,
          field: 'address',
          fieldIsArray: false
        }
      },
      {
        field: 'address.emailAddress',
        label: 'LNG_EVENT_FIELD_LABEL_EMAIL',
        notVisible: true,
        format: {
          type: 'mainAddress.emailAddress'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'emailAddress',
          field: 'address',
          fieldIsArray: false,
          useLike: true
        },
        sortable: true
      },
      {
        field: 'responsibleUserId',
        label: 'LNG_EVENT_FIELD_LABEL_RESPONSIBLE_USER_ID',
        notVisible: true,
        format: {
          type: 'responsibleUser.nameAndEmail'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canListForFilters(this.authUser);
        },
        link: (data) => {
          return data.responsibleUserId && UserModel.canView(this.authUser) ?
            `/users/${data.responsibleUserId}/view` :
            undefined;
        }
      },
      {
        field: 'dateOfReporting',
        label: 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATE
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
      },
      {
        field: 'isDateOfReportingApproximate',
        label: 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.BOOLEAN,
          value: '',
          defaultValue: ''
        },
        sortable: true
      },
      {
        field: 'statuses',
        label: 'LNG_COMMON_LABEL_STATUSES',
        format: {
          type: V2ColumnFormat.STATUS
        },
        notResizable: true,
        pinned: true,
        legends: [

          // alerted
          {
            title: 'LNG_COMMON_LABEL_STATUSES_ALERTED',
            items: [{
              form: {
                type: IV2ColumnStatusFormType.STAR,
                color: 'var(--gd-danger)'
              },
              label: ' ',
              order: undefined
            }]
          }
        ],
        forms: (_column, data: EventModel): V2ColumnStatusForm[] => this.entityEventHelperService.getStatusForms({
          item: data
        })
      }
    ];

    // number of contacts & exposures columns should be visible only on pages where we have relationships
    // for events without relationships we don't need these columns
    if (this.appliedListFilter !== Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_RELATIONSHIPS) {
      this.tableColumns.push(
        {
          field: 'numberOfContacts',
          label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_CONTACTS',
          format: {
            type: V2ColumnFormat.BUTTON
          },
          filter: {
            type: V2FilterType.NUMBER_RANGE,
            min: 0
          },
          sortable: true,
          cssCellClass: 'gd-cell-button',
          buttonLabel: (item) => item.numberOfContacts === 0 ?
            item.numberOfContacts.toLocaleString('en') :
            (item.numberOfContacts || '').toLocaleString('en'),
          color: 'text',
          click: (item) => {
            // if we do not have contacts return
            if (item.numberOfContacts < 1) {
              return;
            }

            // display dialog
            this.entityHelperService.contacts(this.selectedOutbreak, item);
          },
          disabled: (data) => !RelationshipModel.canList(this.authUser) || !data.canListRelationshipContacts(this.authUser)
        },
        {
          field: 'numberOfExposures',
          label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
          format: {
            type: V2ColumnFormat.BUTTON
          },
          filter: {
            type: V2FilterType.NUMBER_RANGE,
            min: 0
          },
          sortable: true,
          cssCellClass: 'gd-cell-button',
          buttonLabel: (item) => item.numberOfExposures === 0 ?
            item.numberOfExposures.toLocaleString('en') :
            (item.numberOfExposures || '').toLocaleString('en'),
          color: 'text',
          click: (item) => {
            // if we do not have exposures return
            if (item.numberOfExposures < 1) {
              return;
            }

            // display dialog
            this.entityHelperService.exposures(this.selectedOutbreak, item);
          },
          disabled: (data) => !RelationshipModel.canList(this.authUser) || !data.canListRelationshipExposures(this.authUser)
        }
      );
    }

    // rest of columns :)
    this.tableColumns.push(
      {
        field: 'deleted',
        label: 'LNG_EVENT_FIELD_LABEL_DELETED',
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.DELETED,
          value: false,
          defaultValue: false
        },
        sortable: true
      },
      {
        field: 'deletedAt',
        label: 'LNG_EVENT_FIELD_LABEL_DELETED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
      },
      {
        field: 'createdBy',
        label: 'LNG_EVENT_FIELD_LABEL_CREATED_BY',
        notVisible: true,
        format: {
          type: 'createdByUser.nameAndEmail'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.createdBy && UserModel.canView(this.authUser) ?
            `/users/${data.createdBy}/view` :
            undefined;
        }
      },
      {
        field: 'createdAt',
        label: 'LNG_EVENT_FIELD_LABEL_CREATED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
      },
      {
        field: 'updatedBy',
        label: 'LNG_EVENT_FIELD_LABEL_UPDATED_BY',
        notVisible: true,
        format: {
          type: 'updatedByUser.nameAndEmail'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.updatedBy && UserModel.canView(this.authUser) ?
            `/users/${data.updatedBy}/view` :
            undefined;
        }
      },
      {
        field: 'updatedAt',
        label: 'LNG_EVENT_FIELD_LABEL_UPDATED_AT',
        notVisible: true,
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        format: {
          type: V2ColumnFormat.DATETIME
        },
        sortable: true
      },
      {
        field: 'location',
        label: 'LNG_ADDRESS_FIELD_LABEL_LOCATION',
        notVisible: true,
        format: {
          type: 'mainAddress.location.name'
        },
        filter: {
          type: V2FilterType.ADDRESS_MULTIPLE_LOCATION,
          address: filterAddressModel,
          field: 'address',
          fieldIsArray: false
        },
        link: (data) => {
          return data.mainAddress?.location?.name && LocationModel.canView(this.authUser) ?
            `/locations/${data.mainAddress.location.id}/view` :
            undefined;
        }
      },
      {
        field: 'address.addressLine1',
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1',
        notVisible: true,
        format: {
          type: 'mainAddress.addressLine1'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'addressLine1',
          field: 'address',
          fieldIsArray: false,
          useLike: true
        },
        sortable: true
      },
      {
        field: 'address.city',
        label: 'LNG_ADDRESS_FIELD_LABEL_CITY',
        notVisible: true,
        format: {
          type: 'mainAddress.city'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'city',
          field: 'address',
          fieldIsArray: false,
          useLike: true
        },
        sortable: true
      },
      {
        field: 'address.geoLocation.lat',
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LAT',
        notVisible: true,
        format: {
          type: 'mainAddress.geoLocation.lat'
        }
      },
      {
        field: 'address.geoLocation.lng',
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LNG',
        notVisible: true,
        format: {
          type: 'mainAddress.geoLocation.lng'
        }
      },
      {
        field: 'address.postalCode',
        label: 'LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE',
        notVisible: true,
        format: {
          type: 'mainAddress.postalCode'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'postalCode',
          field: 'address',
          fieldIsArray: false,
          useLike: true
        },
        sortable: true
      },
      {
        field: 'address.geoLocationAccurate',
        label: 'LNG_ADDRESS_FIELD_LABEL_MANUAL_COORDINATES',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN,
          field: 'mainAddress.geoLocationAccurate'
        },
        filter: {
          type: V2FilterType.ADDRESS_ACCURATE_GEO_LOCATION,
          address: filterAddressModel,
          field: 'address',
          fieldIsArray: false,
          options: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options,
          defaultValue: ''
        },
        sortable: true
      }
    );
  }

  /**
   * Initialize process data
   */
  protected initializeProcessSelectedData(): void {
    this.processSelectedData = [
      // all selected records were not deleted ?
      {
        key: 'allNotDeleted',
        shouldProcess: () => EventModel.canBulkDelete(this.authUser) &&
          this.selectedOutbreakIsActive,
        process: (
          dataMap: {
            [id: string]: EventModel
          },
          selected
        ) => {
          // determine if at least one record isn't deleted
          let allNotDeleted: boolean = selected.length > 0;
          for (let index = 0; index < selected.length; index++) {
            // found not deleted ?
            if (dataMap[selected[index]]?.deleted) {
              // at least one not deleted
              allNotDeleted = false;

              // stop
              break;
            }
          }

          // finished
          return allNotDeleted;
        }
      },

      // all selected records were deleted ?
      {
        key: 'allDeleted',
        shouldProcess: () => EventModel.canBulkRestore(this.authUser) &&
          this.selectedOutbreakIsActive,
        process: (
          dataMap: {
            [id: string]: EventModel
          },
          selected
        ) => {
          // determine if at least one record isn't deleted
          let allDeleted: boolean = selected.length > 0;
          for (let index = 0; index < selected.length; index++) {
            // found not deleted ?
            if (!dataMap[selected[index]]?.deleted) {
              // at least one not deleted
              allDeleted = false;

              // stop
              break;
            }
          }

          // finished
          return allDeleted;
        }
      }
    ];
  }

  /**
   * Initialize table infos
   */
  protected initializeTableInfos(): void {}

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {
    this.advancedFilters = this.entityEventHelperService.generateAdvancedFilters({
      eventInvestigationTemplate: () => this.selectedOutbreak.eventInvestigationTemplate,
      options: {
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
        eventCategory: (this.activatedRoute.snapshot.data.eventCategory as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        addressType: (this.activatedRoute.snapshot.data.addressType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        yesNoAll: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options
      }
    });
  }

  /**
   * Initialize quick actions
   */
  protected initializeQuickActions(): void {
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: (): boolean => {
        return (
          EventModel.canListPersonsWithoutRelationships(this.authUser) ||
          EventModel.canExport(this.authUser) ||
          EventModel.canImport(this.authUser) ||
          EventModel.canExportRelationships(this.authUser)
        );
      },
      menuOptions: [
        // No relationships
        {
          label: {
            get: () => 'LNG_PAGE_LIST_EVENTS_ACTION_NO_RELATIONSHIPS_BUTTON'
          },
          action: this.redirectService.linkAndQueryParams(['/events'], {
            applyListFilter:
              Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_RELATIONSHIPS
          }),
          visible: (): boolean => {
            return (
              EventModel.canListPersonsWithoutRelationships(this.authUser) &&
              this.appliedListFilter !==
                Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_RELATIONSHIPS
            );
          }
        },

        // Divider
        {
          visible: (): boolean => {
            return (
              EventModel.canListPersonsWithoutRelationships(this.authUser) &&
              this.appliedListFilter !==
                Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_RELATIONSHIPS
            );
          }
        },

        // Export events
        {
          label: {
            get: () => 'LNG_PAGE_LIST_EVENTS_EXPORT_BUTTON'
          },
          action: {
            click: () => {
              this.exportEvents(this.queryBuilder);
            }
          },
          visible: (): boolean => {
            return EventModel.canExport(this.authUser);
          }
        },

        // Import events
        {
          label: {
            get: () => 'LNG_PAGE_LIST_EVENTS_IMPORT_BUTTON'
          },
          action: {
            link: () => ['/import-export-data', 'event-data', 'import']
          },
          visible: (): boolean => {
            return (
              this.selectedOutbreakIsActive &&
              EventModel.canImport(this.authUser)
            );
          }
        },

        // Divider
        {
          visible: (): boolean => {
            return (
              EventModel.canExport(this.authUser) ||
              EventModel.canImport(this.authUser)
            );
          }
        },

        // Export relationships
        {
          label: {
            get: () => 'LNG_PAGE_LIST_EVENTS_ACTION_EXPORT_EVENTS_RELATIONSHIPS'
          },
          action: {
            click: () => {
              // construct filter by event query builder
              const qb = new RequestQueryBuilder();

              // retrieve only relationships that have at least one persons as desired type
              qb.filter.byEquality('persons.type', EntityType.EVENT);

              // merge out query builder
              const personsQb = qb.addChildQueryBuilder('person');
              personsQb.merge(this.queryBuilder);

              // remove pagination
              personsQb.paginator.clear();

              // attach condition only if not empty
              if (!personsQb.filter.isEmpty()) {
                // filter only event
                personsQb.filter.byEquality('type', EntityType.EVENT);
              }

              // export
              this.exportEventRelationships(qb);
            }
          },
          visible: (): boolean => {
            return EventModel.canExportRelationships(this.authUser);
          }
        },

        // Import relationships
        {
          label: {
            get: () => 'LNG_PAGE_LIST_EVENTS_ACTION_IMPORT_EVENTS_RELATIONSHIPS'
          },
          action: {
            link: () => ['/import-export-data', 'relationships', 'import'],
            linkQueryParams: (): Params => {
              return {
                from: Constants.APP_PAGE.EVENTS.value
              };
            }
          },
          visible: (): boolean => {
            return (
              OutbreakModel.canImportRelationship(this.authUser) &&
              this.selectedOutbreakIsActive
            );
          }
        }
      ]
    };
  }

  /**
   * Initialize group actions
   */
  protected initializeGroupActions(): void {
    this.groupActions = {
      type: V2ActionType.GROUP_ACTIONS,
      visible: () => EventModel.canExport(this.authUser) ||
        EventModel.canExportRelationships(this.authUser) ||
        (
          EventModel.canBulkDelete(this.authUser) &&
          this.selectedOutbreakIsActive
        ) ||
        (
          EventModel.canBulkRestore(this.authUser) &&
          this.selectedOutbreakIsActive
        ),
      actions: [
        {
          label: {
            get: () => 'LNG_PAGE_LIST_EVENTS_GROUP_ACTION_EXPORT_SELECTED_EVENTS'
          },
          action: {
            click: (selected: string[]) => {
              // construct query builder
              const qb = new RequestQueryBuilder();
              qb.filter.bySelect('id', selected, true, null);

              // allow deleted records
              qb.includeDeleted();

              // keep sort order
              if (!this.queryBuilder.sort.isEmpty()) {
                qb.sort.criterias = {
                  ...this.queryBuilder.sort.criterias
                };
              }

              // export
              this.exportEvents(qb);
            }
          },
          visible: (): boolean => {
            return EventModel.canExport(this.authUser);
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
          }
        },
        {
          label: {
            get: () => 'LNG_PAGE_LIST_EVENTS_GROUP_ACTION_EXPORT_SELECTED_EVENTS_RELATIONSHIPS'
          },
          action: {
            click: (selected: string[]) => {
              // construct query builder
              const qb = new RequestQueryBuilder();
              const personsQb = qb.addChildQueryBuilder('person');

              // retrieve only relationships that have at least one persons as desired type
              qb.filter.byEquality(
                'persons.type',
                EntityType.EVENT
              );

              // id
              personsQb.filter.bySelect(
                'id',
                selected,
                true,
                null
              );

              // type
              personsQb.filter.byEquality(
                'type',
                EntityType.EVENT
              );

              // export event relationships
              this.exportEventRelationships(qb);
            }
          },
          visible: (): boolean => {
            return EventModel.canExportRelationships(this.authUser);
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
          }
        },

        // Divider
        {
          visible: () => (
            EventModel.canExport(this.authUser) ||
            EventModel.canExportRelationships(this.authUser)
          ) && (
            (
              EventModel.canBulkDelete(this.authUser) ||
              EventModel.canBulkRestore(this.authUser)
            ) &&
            this.selectedOutbreakIsActive
          )
        },

        // bulk delete
        {
          label: {
            get: () => 'LNG_PAGE_LIST_EVENTS_GROUP_ACTION_DELETE_SELECTED_EVENTS'
          },
          cssClasses: () => 'gd-list-table-selection-header-button-warning',
          tooltip: (selected: string[]) => selected.length > 0 && !this.tableV2Component.processedSelectedResults.allNotDeleted ?
            this.i18nService.instant('LNG_PAGE_LIST_EVENTS_GROUP_ACTION_DELETE_SELECTED_EVENTS_DESCRIPTION') :
            undefined,
          action: {
            click: (selected: string[]) => {
              // ask for confirmation
              this.dialogV2Service
                .showConfirmDialog({
                  config: {
                    title: {
                      get: () => 'LNG_PAGE_ACTION_DELETE'
                    },
                    message: {
                      get: () => 'LNG_DIALOG_CONFIRM_DELETE_MULTIPLE_EVENTS'
                    }
                  }
                })
                .subscribe((response) => {
                  // canceled ?
                  if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                    // finished
                    return;
                  }

                  // show loading
                  const loading = this.dialogV2Service.showLoadingDialog();
                  loading.message({
                    message: 'LNG_PAGE_LIST_EVENTS_ACTION_DELETE_SELECTED_EVENTS_WAIT_MESSAGE',
                    messageData: {
                      no: '1',
                      total: selected.length.toLocaleString('en'),
                      date: '—'
                    }
                  });

                  // delete - we can't use bulk here since deleting events triggers many hooks
                  let startTime: Moment;
                  const selectedShallowClone: string[] = [...selected];
                  const nextDelete = () => {
                    // finished ?
                    if (selectedShallowClone.length < 1) {
                      this.toastV2Service.success('LNG_PAGE_LIST_EVENTS_ACTION_DELETE_SELECTED_EVENTS_SUCCESS_MESSAGE');
                      loading.close();
                      this.needsRefreshList(true);
                      return;
                    }

                    // delete
                    this.eventDataService
                      .deleteEvent(
                        this.selectedOutbreak.id,
                        selectedShallowClone.shift()
                      )
                      .pipe(
                        catchError((err) => {
                          // hide loading
                          loading.close();

                          // error
                          this.toastV2Service.error(err);
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // determine estimated end time
                        let estimatedEndDate: Moment;

                        // initialize start time if necessary
                        if (!startTime) {
                          startTime = moment();
                        }

                        // determine estimated time
                        const processed: number = selected.length - selectedShallowClone.length;
                        const total: number = selected.length;
                        if (processed > 0) {
                          const processedSoFarTimeMs: number = moment().diff(startTime);
                          const requiredTimeForAllMs: number = processedSoFarTimeMs * total / processed;
                          const remainingTimeMs = requiredTimeForAllMs - processedSoFarTimeMs;
                          estimatedEndDate = moment().add(remainingTimeMs, 'ms');
                        }

                        // update progress
                        loading.message({
                          message: 'LNG_PAGE_LIST_EVENTS_ACTION_DELETE_SELECTED_EVENTS_WAIT_MESSAGE',
                          messageData: {
                            no: processed.toLocaleString('en'),
                            total: total.toLocaleString('en'),
                            date: estimatedEndDate ? estimatedEndDate.format(Constants.DEFAULT_DATE_TIME_DISPLAY_FORMAT) : '—'
                          }
                        });

                        // next
                        nextDelete();
                      });
                  };

                  // start delete
                  nextDelete();
                });
            }
          },
          visible: (): boolean => {
            return EventModel.canBulkDelete(this.authUser) &&
              this.selectedOutbreakIsActive;
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1 ||
              !this.tableV2Component.processedSelectedResults.allNotDeleted;
          }
        },

        // bulk restore
        {
          label: {
            get: () => 'LNG_PAGE_LIST_EVENTS_GROUP_ACTION_RESTORE_SELECTED_EVENTS'
          },
          cssClasses: () => 'gd-list-table-selection-header-button-warning',
          tooltip: (selected: string[]) => selected.length > 0 && !this.tableV2Component.processedSelectedResults.allDeleted ?
            this.i18nService.instant('LNG_PAGE_LIST_EVENTS_GROUP_ACTION_RESTORE_SELECTED_EVENTS_DESCRIPTION') :
            undefined,
          action: {
            click: (selected: string[]) => {
              // ask for confirmation
              this.dialogV2Service
                .showConfirmDialog({
                  config: {
                    title: {
                      get: () => 'LNG_PAGE_ACTION_RESTORE'
                    },
                    message: {
                      get: () => 'LNG_DIALOG_CONFIRM_RESTORE_MULTIPLE_EVENTS'
                    }
                  }
                })
                .subscribe((response) => {
                  // canceled ?
                  if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                    // finished
                    return;
                  }

                  // show loading
                  const loading = this.dialogV2Service.showLoadingDialog();
                  loading.message({
                    message: 'LNG_PAGE_LIST_EVENTS_ACTION_RESTORE_SELECTED_EVENTS_WAIT_MESSAGE',
                    messageData: {
                      no: '1',
                      total: selected.length.toLocaleString('en'),
                      date: '—'
                    }
                  });

                  // restore - we can't use bulk here since restoring events triggers many hooks
                  let startTime: Moment;
                  const selectedShallowClone: string[] = [...selected];
                  const nextRestore = () => {
                    // finished ?
                    if (selectedShallowClone.length < 1) {
                      this.toastV2Service.success('LNG_PAGE_LIST_EVENTS_ACTION_RESTORE_SELECTED_EVENTS_SUCCESS_MESSAGE');
                      loading.close();
                      this.needsRefreshList(true);
                      return;
                    }

                    // restore
                    this.eventDataService
                      .restoreEvent(
                        this.selectedOutbreak.id,
                        selectedShallowClone.shift()
                      )
                      .pipe(
                        catchError((err) => {
                          // hide loading
                          loading.close();

                          // error
                          this.toastV2Service.error(err);
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // determine estimated end time
                        let estimatedEndDate: Moment;

                        // initialize start time if necessary
                        if (!startTime) {
                          startTime = moment();
                        }

                        // determine estimated time
                        const processed: number = selected.length - selectedShallowClone.length;
                        const total: number = selected.length;
                        if (processed > 0) {
                          const processedSoFarTimeMs: number = moment().diff(startTime);
                          const requiredTimeForAllMs: number = processedSoFarTimeMs * total / processed;
                          const remainingTimeMs = requiredTimeForAllMs - processedSoFarTimeMs;
                          estimatedEndDate = moment().add(remainingTimeMs, 'ms');
                        }

                        // update progress
                        loading.message({
                          message: 'LNG_PAGE_LIST_EVENTS_ACTION_RESTORE_SELECTED_EVENTS_WAIT_MESSAGE',
                          messageData: {
                            no: processed.toLocaleString('en'),
                            total: total.toLocaleString('en'),
                            date: estimatedEndDate ? estimatedEndDate.format(Constants.DEFAULT_DATE_TIME_DISPLAY_FORMAT) : '—'
                          }
                        });

                        // next
                        nextRestore();
                      });
                  };

                  // start restore
                  nextRestore();
                });
            }
          },
          visible: (): boolean => {
            return EventModel.canBulkRestore(this.authUser) &&
              this.selectedOutbreakIsActive;
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1 ||
              !this.tableV2Component.processedSelectedResults.allDeleted;
          }
        }
      ]
    };
  }

  /**
   * Initialize add action
   */
  protected initializeAddAction(): void {
    this.addAction = {
      type: V2ActionType.ICON_LABEL,
      label: 'LNG_COMMON_BUTTON_ADD',
      icon: 'add_circle_outline',
      action: {
        link: (): string[] => ['/events', 'create']
      },
      visible: (): boolean => {
        return EventModel.canCreate(this.authUser) &&
          this.selectedOutbreakIsActive;
      }
    };
  }

  /**
   * Initialize grouped data
   */
  protected initializeGroupedData(): void {}

  /**
   * Export event data
   */
  private exportEvents(qb: RequestQueryBuilder): void {
    this.dialogV2Service
      .showExportDataAfterLoadingData({
        title: {
          get: () => 'LNG_PAGE_LIST_EVENTS_EXPORT_TITLE'
        },
        load: (finished) => {
          // retrieve the list of export fields groups for model
          this.outbreakDataService
            .getExportFieldsGroups(ExportFieldsGroupModelNameEnum.EVENT)
            .pipe(
              // handle errors
              catchError((err) => {
                // show error
                this.toastV2Service.error(err);

                // send error further
                return throwError(err);
              }),

              // should be the last pipe
              takeUntil(this.destroyed$)
            )
            .subscribe((fieldsGroupList) => {
              // set groups
              const eventFieldGroups: ILabelValuePairModel[] = fieldsGroupList.options.map((item) => ({
                label: item.name,
                value: item.name
              }));

              // group restrictions
              const eventFieldGroupsRequires: IV2ExportDataConfigGroupsRequired = fieldsGroupList.toRequiredList();

              // show export
              finished({
                title: {
                  get: () => 'LNG_PAGE_LIST_EVENTS_EXPORT_TITLE'
                },
                export: {
                  url: `/outbreaks/${this.selectedOutbreak.id}/events/export`,
                  async: true,
                  method: ExportDataMethod.POST,
                  fileName: `${this.i18nService.instant('LNG_PAGE_LIST_EVENTS_TITLE')} - ${moment().format('YYYY-MM-DD HH:mm')}`,
                  queryBuilder: qb,
                  allow: {
                    types: [
                      ExportDataExtension.CSV,
                      ExportDataExtension.XLS,
                      ExportDataExtension.XLSX,
                      ExportDataExtension.JSON,
                      ExportDataExtension.ODS,
                      ExportDataExtension.PDF
                    ],
                    encrypt: true,
                    anonymize: {
                      fields: this.eventFields
                    },
                    groups: {
                      fields: eventFieldGroups,
                      required: eventFieldGroupsRequires
                    },
                    fields: {
                      options: this.eventFields
                    },
                    dbColumns: true,
                    dbValues: true,
                    jsonReplaceUndefinedWithNull: true,
                    questionnaireVariables: true
                  }
                }
              });
            });
        }
      });
  }

  /**
   * Export event relationships
   */
  private exportEventRelationships(qb: RequestQueryBuilder): void {
    this.dialogV2Service
      .showExportDataAfterLoadingData({
        title: {
          get: () => 'LNG_PAGE_LIST_EVENTS_EXPORT_RELATIONSHIPS_TITLE'
        },
        load: (finished) => {
          // retrieve the list of export fields groups for model
          this.outbreakDataService
            .getExportFieldsGroups(ExportFieldsGroupModelNameEnum.RELATIONSHIP)
            .pipe(
              // handle errors
              catchError((err) => {
                // show error
                this.toastV2Service.error(err);

                // send error further
                return throwError(err);
              }),

              // should be the last pipe
              takeUntil(this.destroyed$)
            )
            .subscribe((fieldsGroupList) => {
              // set groups
              const relationshipFieldGroups: ILabelValuePairModel[] = fieldsGroupList.options.map((item) => ({
                label: item.name,
                value: item.name
              }));

              // group restrictions
              const relationshipFieldGroupsRequires: IV2ExportDataConfigGroupsRequired = fieldsGroupList.toRequiredList();

              // show export
              finished({
                title: {
                  get: () => 'LNG_PAGE_LIST_EVENTS_EXPORT_RELATIONSHIPS_TITLE'
                },
                export: {
                  url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
                  async: true,
                  method: ExportDataMethod.POST,
                  fileName: `${this.i18nService.instant('LNG_PAGE_LIST_EVENTS_EXPORT_RELATIONSHIP_FILE_NAME')} - ${moment().format('YYYY-MM-DD')}`,
                  queryBuilder: qb,
                  allow: {
                    types: [
                      ExportDataExtension.CSV,
                      ExportDataExtension.XLS,
                      ExportDataExtension.XLSX,
                      ExportDataExtension.JSON,
                      ExportDataExtension.ODS,
                      ExportDataExtension.PDF
                    ],
                    encrypt: true,
                    anonymize: {
                      fields: this.relationshipFields
                    },
                    groups: {
                      fields: relationshipFieldGroups,
                      required: relationshipFieldGroupsRequires
                    },
                    fields: {
                      options: this.relationshipFields
                    },
                    dbColumns: true,
                    dbValues: true,
                    jsonReplaceUndefinedWithNull: true
                  }
                }
              });
            });
        }
      });
  }

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs(): void {
    // determine if events page should be linkable
    let eventsAction: IV2BreadcrumbAction = null;

    // if we have an applied filter then we need to add breadcrumb
    if (
      this.appliedListFilter === ApplyListFilter.EVENTS_WITHOUT_RELATIONSHIPS
    ) {
      // since we need to send user to the same page we need to do some hacks...
      const redirect = this.redirectService.linkAndQueryParams(['/events']);
      eventsAction = {
        link: redirect.link(),
        linkQueryParams: redirect.linkQueryParams()
      };
    }

    // set breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser)
            ? ['/dashboard']
            : ['/account/my-profile']
        }
      },
      {
        label: 'LNG_PAGE_LIST_EVENTS_TITLE',
        action: eventsAction
      }
    ];

    // if we have an applied filter then we need to add breadcrumb
    if (
      this.appliedListFilter === ApplyListFilter.EVENTS_WITHOUT_RELATIONSHIPS
    ) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_DASHBOARD_EVENTS_WITHOUT_RELATIONSHIPS',
        action: null
      });
    }
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [
      'id',
      'visualId',
      'name',
      'date',
      'eventCategory',
      'endDate',
      'description',
      'address',
      'dateOfReporting',
      'isDateOfReportingApproximate',
      'responsibleUserId',
      'questionnaireAnswers',
      'numberOfContacts',
      'numberOfExposures',
      'deleted',
      'deletedAt',
      'createdBy',
      'createdAt',
      'updatedBy',
      'updatedAt'
    ];
  }

  /**
   * Re(load) the Events list, based on the applied filter, sort criterias
   */
  refreshList(triggeredByPageChange: boolean) {
    // retrieve created user & modified user information
    this.queryBuilder.include('createdByUser', true);
    this.queryBuilder.include('updatedByUser', true);

    // retrieve responsible user information
    this.queryBuilder.include('responsibleUser', true);

    // refresh badges list with applied filter
    if (!triggeredByPageChange) {
      this.initializeGroupedData();
    }

    // retrieve the list of Events
    this.records$ = this.eventDataService
      .getEventsList(this.selectedOutbreak.id, this.queryBuilder)
      .pipe(
        switchMap((data) => {
          // determine locations that we need to retrieve
          const locationsIdsMap: {
            [locationId: string]: true
          } = {};
          data.forEach((item) => {
            // nothing to add ?
            if (!item.address?.locationId) {
              return;
            }

            // add location to list
            locationsIdsMap[item.address.locationId] = true;
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
                  item.address.location = item.address.locationId && locationsMap[item.address.locationId]
                    ? locationsMap[item.address.locationId]
                    : item.address.location;
                });

                // finished
                return data;
              })
            );
        })
      )
      .pipe(
        // process data
        map((events: EventModel[]) => {
          return EntityModel.determineAlertness<EventModel>(
            this.selectedOutbreak.eventInvestigationTemplate,
            events
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
    countQueryBuilder.clearFields();

    // apply has more limit
    if (this.applyHasMoreLimit) {
      countQueryBuilder.flag('applyHasMoreLimit', true);
    }

    // count
    this.eventDataService
      .getEventsCount(this.selectedOutbreak.id, countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      )
      .subscribe((response) => {
        this.pageCount = response;
      });
  }
}
