import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import * as _ from 'lodash';
import { of, throwError } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { AddressModel } from '../../../../core/models/address.model';
import { Constants } from '../../../../core/models/constants';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityType } from '../../../../core/models/entity-type';
import { ExportFieldsGroupModelNameEnum } from '../../../../core/models/export-fields-group.model';
import { LocationModel } from '../../../../core/models/location.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { UserModel } from '../../../../core/models/user.model';
import { ContactsOfContactsDataService } from '../../../../core/services/data/contacts-of-contacts.data.service';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ExportDataExtension, ExportDataMethod, IV2ExportDataConfigGroupsRequired } from '../../../../core/services/helper/models/dialog-v2.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2ColumnPinned, IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { IV2GroupedData } from '../../../../shared/components-v2/app-list-table-v2/models/grouped-data.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import * as moment from 'moment';
import { IV2SideDialogConfigInputCheckbox, IV2SideDialogConfigInputMultiDropdown, V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { BulkCacheHelperService } from '../../../../core/services/helper/bulk-cache-helper.service';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { EventModel } from '../../../../core/models/event.model';
import { CaseModel } from '../../../../core/models/case.model';
import { Moment } from 'moment';
import { DocumentModel } from '../../../../core/models/document.model';
import { VaccineModel } from '../../../../core/models/vaccine.model';

@Component({
  selector: 'app-contacts-of-contacts-list',
  templateUrl: './contacts-of-contacts-list.component.html'
})
export class ContactsOfContactsListComponent extends ListComponent<ContactOfContactModel> implements OnDestroy {
  // constants
  private static readonly RELATIONSHIP_DATA: string = 'relationship';

  // contact of contacts fields
  private contactsOfContactsFields: ILabelValuePairModel[] = [
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME', value: 'firstName' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RELATIONSHIP', value: ContactsOfContactsListComponent.RELATIONSHIP_DATA },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_MIDDLE_NAME', value: 'middleName' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME', value: 'lastName' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER', value: 'gender' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION', value: 'occupation' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE', value: 'age' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOB', value: 'dob' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOCUMENTS', value: 'documents' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING', value: 'dateOfReporting' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT', value: 'dateOfLastContact' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL', value: 'riskLevel' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON', value: 'riskReason' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OUTCOME_ID', value: 'outcomeId' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_OUTCOME', value: 'dateOfOutcome' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID', value: 'visualId' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_TYPE', value: 'type' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_NUMBER_OF_CONTACTS', value: 'numberOfContacts' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES', value: 'numberOfExposures' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESSES', value: 'addresses' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_IS_DATE_OF_REPORTING_APPROXIMATE', value: 'isDateOfReportingApproximate' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_SAFE_BURIAL', value: 'safeBurial' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_BURIAL', value: 'dateOfBurial' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VACCINES_RECEIVED', value: 'vaccinesReceived' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PREGNANCY_STATUS', value: 'pregnancyStatus' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID', value: 'responsibleUser' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', value: 'createdAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', value: 'createdBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', value: 'updatedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', value: 'updatedBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED', value: 'deleted' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', value: 'deletedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', value: 'createdOn' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_WAS_CASE', value: 'wasCase' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_WAS_CONTACT', value: 'wasContact' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_BECOME_CONTACT_OF_CONTACT', value: 'dateBecomeContactOfContact' },
    { label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ID', value: 'id' }
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
    private contactsOfContactsDataService: ContactsOfContactsDataService,
    private toastV2Service: ToastV2Service,
    private outbreakDataService: OutbreakDataService,
    private i18nService: I18nService,
    private locationDataService: LocationDataService,
    private dialogV2Service: DialogV2Service,
    private activatedRoute: ActivatedRoute,
    private entityHelperService: EntityHelperService,
    private router: Router,
    private bulkCacheHelperService: BulkCacheHelperService,
    private referenceDataHelperService: ReferenceDataHelperService,
    private relationshipDataService: RelationshipDataService
  ) {
    super(
      listHelperService, {
        initializeTableColumnsAfterSelectedOutbreakChanged: true,
        initializeTableAdvancedFiltersAfterSelectedOutbreakChanged: true
      }
    );
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
        // View Contact of contact
        {
          type: V2ActionType.ICON,
          icon: 'visibility',
          iconTooltip: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_VIEW_CONTACT_OF_CONTACT',
          action: {
            link: (data: ContactOfContactModel): string[] => {
              return ['/contacts-of-contacts', data.id, 'view'];
            }
          },
          visible: (item: ContactOfContactModel): boolean => {
            return !item.deleted &&
              ContactOfContactModel.canView(this.authUser);
          }
        },

        // Modify Contact of contact
        {
          type: V2ActionType.ICON,
          icon: 'edit',
          iconTooltip: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_MODIFY_CONTACT_OF_CONTACT',
          action: {
            link: (item: ContactOfContactModel): string[] => {
              return ['/contacts-of-contacts', item.id, 'modify'];
            }
          },
          visible: (item: ContactOfContactModel): boolean => {
            return !item.deleted &&
              this.selectedOutbreakIsActive &&
              ContactOfContactModel.canModify(this.authUser);
          }
        },

        // Other actions
        {
          type: V2ActionType.MENU,
          icon: 'more_horiz',
          menuOptions: [
            // Delete Contact of contact
            {
              label: {
                get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_DELETE_CONTACT_OF_CONTACT'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: ContactOfContactModel): void => {
                  // determine what we need to delete
                  this.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_DELETE',
                        data: () => ({
                          name: item.name
                        })
                      },
                      message: {
                        get: () => 'LNG_DIALOG_CONFIRM_DELETE_CONTACT_OF_CONTACT',
                        data: () => ({ name: item.name })
                      }
                    },
                    yesLabel: 'LNG_DIALOG_CONFIRM_BUTTON_OK'
                  }).subscribe((response) => {
                    // canceled ?
                    if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                      // finished
                      return;
                    }

                    // show loading
                    const loading = this.dialogV2Service.showLoadingDialog();

                    // delete Contact of contact
                    this.contactsOfContactsDataService
                      .deleteContactOfContact(
                        this.selectedOutbreak.id,
                        item.id
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
                        this.toastV2Service.success('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_DELETE_SUCCESS_MESSAGE');

                        // hide loading
                        loading.close();

                        // reload data
                        this.needsRefreshList(true);
                      });
                  });
                }
              },
              visible: (item: ContactOfContactModel): boolean => {
                return !item.deleted &&
                  this.selectedOutbreakIsActive &&
                  ContactOfContactModel.canDelete(this.authUser);
              }
            },

            // Divider
            {
              visible: (item: ContactOfContactModel): boolean => {
                // visible only if at least one of the first two items is visible
                return !item.deleted &&
                  this.selectedOutbreakIsActive &&
                  ContactOfContactModel.canDelete(this.authUser);
              }
            },

            // Convert Contact of Contact to Contact
            {
              label: {
                get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_CONVERT_TO_CONTACT'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: ContactOfContactModel): void => {
                  // show confirm dialog to confirm the action
                  this.dialogV2Service
                    .showConfirmDialog({
                      config: {
                        title: {
                          get: () => 'LNG_COMMON_LABEL_CONVERT',
                          data: () => ({
                            name: item.name,
                            type: this.i18nService.instant(EntityType.CONTACT)
                          })
                        },
                        message: {
                          get: () => 'LNG_DIALOG_CONFIRM_CONVERT_CONTACT_OF_CONTACT_TO_CONTACT',
                          data: () => item as any
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

                      // check if there is at least one legacy exposure (case/event)
                      const qb = new RequestQueryBuilder();
                      qb.filter.where({
                        type: {
                          'inq': [EntityType.CASE, EntityType.EVENT]
                        }
                      });
                      qb.limit(1);
                      this.relationshipDataService
                        .getEntityExposures(
                          this.selectedOutbreak.id,
                          item.type,
                          item.id,
                          qb
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
                        .subscribe((exposedContacts: EntityModel[]) => {
                          // if there is no case/event as exposure, redirect to add exposures
                          if (!exposedContacts?.length) {
                            // hide loading
                            loading.close();

                            // redirect
                            this.router.navigate(
                              [`/relationships/${item.type}/${item.id}/exposures/add`]
                            );
                            return;
                          } else {
                            // convert
                            this.contactsOfContactsDataService
                              .convertContactOfContactToContact(this.selectedOutbreak.id, item.id)
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
                                this.toastV2Service.success('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_CONVERT_TO_CONTACT_SUCCESS_MESSAGE');

                                // hide loading
                                loading.close();

                                // reload data
                                this.needsRefreshList(true);
                              });
                          }
                        });
                    });
                }
              },
              visible: (item: ContactOfContactModel): boolean => {
                return !item.deleted &&
                  this.selectedOutbreakIsActive &&
                  ContactOfContactModel.canConvertToContact(this.authUser) &&
                  (
                    EventModel.canList(this.authUser) ||
                    CaseModel.canList(this.authUser)
                  ) &&
                  ContactOfContactModel.canView(this.authUser);
              }
            },

            // Divider
            {
              visible: (item: ContactOfContactModel): boolean => {
                // visible only if at least one of the first two items is visible
                return !item.deleted &&
                  this.selectedOutbreakIsActive &&
                  ContactOfContactModel.canConvertToContact(this.authUser);
              }
            },

            // See  Contact of contact contacts
            {
              label: {
                get: () => 'LNG_PAGE_ACTION_SEE_EXPOSURES_FROM'
              },
              action: {
                link: (item: ContactOfContactModel): string[] => {
                  return ['/relationships', EntityType.CONTACT_OF_CONTACT, item.id, 'contacts'];
                }
              },
              visible: (item: ContactOfContactModel): boolean => {
                return !item.deleted &&
                  RelationshipModel.canList(this.authUser) &&
                  ContactOfContactModel.canListRelationshipContacts(this.authUser);
              }
            },

            // See Contact of contact exposures
            {
              label: {
                get: () => 'LNG_PAGE_ACTION_SEE_EXPOSURES_TO'
              },
              action: {
                link: (item: ContactOfContactModel): string[] => {
                  return ['/relationships', EntityType.CONTACT_OF_CONTACT, item.id, 'exposures'];
                }
              },
              visible: (item: ContactOfContactModel): boolean => {
                return !item.deleted &&
                  RelationshipModel.canList(this.authUser) &&
                  ContactOfContactModel.canListRelationshipExposures(this.authUser);
              }
            },

            // Divider
            {
              visible: (item: ContactOfContactModel): boolean => {
                // visible only if at least one of the previous two items is visible
                return !item.deleted &&
                  RelationshipModel.canList(this.authUser) &&
                  (
                    ContactOfContactModel.canListRelationshipContacts(this.authUser) ||
                    ContactOfContactModel.canListRelationshipExposures(this.authUser)
                  );
              }
            },

            // See records detected by the system as duplicates but they were marked as not duplicates
            {
              label: {
                get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_SEE_RECORDS_NOT_DUPLICATES'
              },
              action: {
                link: (item: ContactOfContactModel): string[] => {
                  return ['/duplicated-records/contacts-of-contacts', item.id, 'marked-not-duplicates'];
                }
              },
              visible: (item: ContactOfContactModel): boolean => {
                return !item.deleted;
              }
            },

            // View Contact of contact movement map
            {
              label: {
                get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_VIEW_MOVEMENT'
              },
              action: {
                link: (item: ContactOfContactModel): string[] => {
                  return ['/contacts-of-contacts', item.id, 'movement'];
                }
              },
              visible: (item: ContactOfContactModel): boolean => {
                return !item.deleted &&
                  ContactOfContactModel.canViewMovementMap(this.authUser);
              }
            },

            // View Contact of contact chronology timeline
            {
              label: {
                get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_VIEW_CHRONOLOGY'
              },
              action: {
                link: (item: ContactOfContactModel): string[] => {
                  return ['/contacts-of-contacts', item.id, 'chronology'];
                }
              },
              visible: (item: ContactOfContactModel): boolean => {
                return !item.deleted &&
                  ContactOfContactModel.canViewChronologyChart(this.authUser);
              }
            },

            // Restore a deleted Contact of contact
            {
              label: {
                get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_RESTORE_CONTACT_OF_CONTACTS'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: ContactOfContactModel) => {
                  // show confirm dialog to confirm the action
                  this.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_RESTORE',
                        data: () => item as any
                      },
                      message: {
                        get: () => 'LNG_DIALOG_CONFIRM_RESTORE_CONTACT_OF_CONTACT',
                        data: () => item as any
                      }
                    },
                    yesLabel: 'LNG_DIALOG_CONFIRM_BUTTON_OK'
                  }).subscribe((response) => {
                    // canceled ?
                    if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                      // finished
                      return;
                    }

                    // show loading
                    const loading = this.dialogV2Service.showLoadingDialog();

                    // convert
                    this.contactsOfContactsDataService
                      .restoreContactOfContact(
                        this.selectedOutbreak.id,
                        item.id
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
                        this.toastV2Service.success('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_RESTORE_SUCCESS_MESSAGE');

                        // hide loading
                        loading.close();

                        // reload data
                        this.needsRefreshList(true);
                      });
                  });
                }
              },
              visible: (item: ContactOfContactModel): boolean => {
                return item.deleted &&
                  this.selectedOutbreakIsActive &&
                  ContactOfContactModel.canRestore(this.authUser);
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
  protected initializeTableColumns() {
    // address model used to search by phone number, address line, postal code, city....
    const filterAddressModel: AddressModel = new AddressModel({
      geoLocationAccurate: ''
    });

    this.tableColumns = [
      {
        field: 'lastName',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_LAST_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'middleName',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_MIDDLE_NAME',
        notVisible: true,
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'firstName',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_FIRST_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'visualId',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VISUAL_ID',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
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
          // risk
          {
            title: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL',
            items: this.referenceDataHelperService.filterPerOutbreak(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).list
            ).map((item) => {
              return {
                form: {
                  type: IV2ColumnStatusFormType.TRIANGLE,
                  color: item.getColorCode()
                },
                label: item.id,
                order: item.order
              };
            })
          }
        ],
        forms: (_column, data: ContactOfContactModel): V2ColumnStatusForm[] => ContactOfContactModel.getStatusForms({
          item: data,
          i18nService: this.i18nService,
          risk: this.activatedRoute.snapshot.data.risk
        })
      },
      {
        field: 'pregnancyStatus',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PREGNANCY_STATUS',
        notVisible: true,
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.pregnancy as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          includeNoValue: true
        }
      },
      {
        field: 'occupation',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_OCCUPATION',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: this.referenceDataHelperService.filterPerOutbreakOptions(
            this.selectedOutbreak,
            (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            undefined
          )
        }
      },
      {
        field: 'location',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_ADDRESS_LOCATION',
        format: {
          type: 'mainAddress.location.name'
        },
        filter: {
          type: V2FilterType.ADDRESS_MULTIPLE_LOCATION,
          address: filterAddressModel,
          field: 'addresses',
          fieldIsArray: true
        },
        link: (data) => {
          return data.mainAddress?.location?.name && LocationModel.canView(this.authUser) ?
            `/locations/${data.mainAddress.location.id}/view` :
            undefined;
        }
      },
      {
        field: 'addresses.addressLine1',
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1',
        notVisible: true,
        format: {
          type: 'mainAddress.addressLine1'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'addressLine1',
          field: 'addresses',
          fieldIsArray: true
        }
      },
      {
        field: 'addresses.city',
        label: 'LNG_ADDRESS_FIELD_LABEL_CITY',
        notVisible: true,
        format: {
          type: 'mainAddress.city'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'city',
          field: 'addresses',
          fieldIsArray: true
        },
        sortable: true
      },
      {
        field: 'addresses.emailAddress',
        label: 'LNG_CONTACT_FIELD_LABEL_EMAIL',
        notVisible: true,
        format: {
          type: 'mainAddress.emailAddress'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'emailAddress',
          field: 'addresses',
          fieldIsArray: true
        },
        sortable: true
      },
      {
        field: 'addresses.geoLocation.lat',
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LAT',
        notVisible: true,
        format: {
          type: 'mainAddress.geoLocation.lat'
        }
      },
      {
        field: 'addresses.geoLocation.lng',
        label: 'LNG_ADDRESS_FIELD_LABEL_GEOLOCATION_LNG',
        notVisible: true,
        format: {
          type: 'mainAddress.geoLocation.lng'
        }
      },
      {
        field: 'addresses.postalCode',
        label: 'LNG_ADDRESS_FIELD_LABEL_POSTAL_CODE',
        notVisible: true,
        format: {
          type: 'mainAddress.postalCode'
        },
        filter: {
          type: V2FilterType.ADDRESS_FIELD,
          address: filterAddressModel,
          addressField: 'postalCode',
          field: 'addresses',
          fieldIsArray: true
        },
        sortable: true
      },
      {
        field: 'addresses.geoLocationAccurate',
        label: 'LNG_ADDRESS_FIELD_LABEL_MANUAL_COORDINATES',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN,
          field: 'mainAddress.geoLocationAccurate'
        },
        filter: {
          type: V2FilterType.ADDRESS_ACCURATE_GEO_LOCATION,
          address: filterAddressModel,
          field: 'addresses',
          fieldIsArray: true,
          options: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options,
          defaultValue: ''
        },
        sortable: true
      },
      {
        field: 'dob',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOB',
        format: {
          type: V2ColumnFormat.DATE
        },
        notVisible: true,
        sortable: true,
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'age',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_AGE',
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
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_GENDER',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'phoneNumber',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_PHONE_NUMBER',
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
        field: 'riskLevel',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_LEVEL',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: this.referenceDataHelperService.filterPerOutbreakOptions(
            this.selectedOutbreak,
            (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            undefined
          ),
          includeNoValue: true
        }
      },
      {
        field: 'riskReason',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RISK_REASON',
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'dateOfLastContact',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT',
        format: {
          type: V2ColumnFormat.DATE
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
      },
      {
        field: 'wasCase',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_WAS_CASE',
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
        field: 'wasContact',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_WAS_CONTACT',
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
        field: 'responsibleUserId',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_RESPONSIBLE_USER_ID',
        notVisible: true,
        format: {
          type: 'responsibleUser.name'
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
        field: 'numberOfContacts',
        label: 'LNG_CONTACT_FIELD_LABEL_NUMBER_OF_CONTACTS',
        format: {
          type: V2ColumnFormat.BUTTON
        },
        filter: {
          type: V2FilterType.NUMBER_RANGE,
          min: 0
        },
        sortable: true,
        notVisible: true,
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
        disabled: (data) =>
          !RelationshipModel.canList(this.authUser) ||
          !data.canListRelationshipContacts(this.authUser)
      },
      {
        field: 'numberOfExposures',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
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
          this.entityHelperService.exposures(
            this.selectedOutbreak,
            item
          );
        },
        disabled: (data) => !RelationshipModel.canList(this.authUser) || !data.canListRelationshipExposures(this.authUser)
      },
      {
        field: 'dateOfReporting',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING',
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
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
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
        field: 'documents',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DOCUMENTS',
        format: {
          type: (item: ContactOfContactModel): string => {
            // must format ?
            if (!item.uiDocuments) {
              item.uiDocuments = DocumentModel.arrayToString(
                this.i18nService,
                item.documents
              );
            }

            // finished
            return item.uiDocuments;
          }
        },
        notVisible: true
      },
      {
        field: 'vaccinesReceived',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_VACCINES_RECEIVED',
        format: {
          type: (item: ContactOfContactModel): string => {
            // must format ?
            if (!item.uiVaccines) {
              item.uiVaccines = VaccineModel.arrayToString(
                this.i18nService,
                item.vaccinesReceived
              );
            }

            // finished
            return item.uiVaccines;
          }
        },
        notVisible: true
      },
      {
        field: 'deleted',
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DELETED',
        notVisible: true,
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
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_DELETED_AT',
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
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_CREATED_BY',
        notVisible: true,
        format: {
          type: 'createdByUser.name'
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
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_CREATED_AT',
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
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_UPDATED_BY',
        notVisible: true,
        format: {
          type: 'updatedByUser.name'
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
        label: 'LNG_CONTACT_OF_CONTACT_FIELD_LABEL_UPDATED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
      }
    ];
  }

  /**
   * Initialize process data
   */
  protected initializeProcessSelectedData(): void {
    this.processSelectedData = [
      // all selected records were not deleted ?
      {
        key: 'allNotDeleted',
        shouldProcess: () => ContactOfContactModel.canBulkDelete(this.authUser) &&
          this.selectedOutbreakIsActive,
        process: (
          dataMap: {
            [id: string]: ContactOfContactModel
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
        shouldProcess: () => ContactOfContactModel.canBulkRestore(this.authUser) &&
          this.selectedOutbreakIsActive,
        process: (
          dataMap: {
            [id: string]: ContactOfContactModel
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
   * Initialize advanced filters
   */
  protected initializeTableAdvancedFilters(): void {
    this.advancedFilters = ContactOfContactModel.generateAdvancedFilters({
      authUser: this.authUser,
      options: {
        occupation: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
        yesNoAll: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        gender: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        pregnancy: (this.activatedRoute.snapshot.data.pregnancy as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        documentType: (this.activatedRoute.snapshot.data.documentType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        addressType: (this.activatedRoute.snapshot.data.addressType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        risk: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        vaccine: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.vaccine as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        vaccineStatus: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.vaccineStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        )
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
        return !this.appliedListFilter;
      },
      menuOptions: [
        // Export contacts of contact
        {
          label: {
            get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_BUTTON'
          },
          action: {
            click: () => {
              this.exportContactsOfContacts(this.queryBuilder);
            }
          },
          visible: (): boolean => {
            return ContactOfContactModel.canExport(this.authUser);
          }
        },

        // Import contacts of contact
        {
          label: {
            get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_IMPORT_BUTTON'
          },
          action: {
            link: () => ['/import-export-data', 'contact-of-contact-data', 'import']
          },
          visible: (): boolean => {
            return this.selectedOutbreakIsActive &&
              ContactOfContactModel.canImport(this.authUser);
          }
        },

        // Divider
        {
          visible: (): boolean => {
            return ContactOfContactModel.canExport(this.authUser) ||
            ContactOfContactModel.canImport(this.authUser);
          }
        },

        // Export relationships
        {
          label: {
            get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_EXPORT_CONTACTS_OF_CONTACTS_RELATIONSHIPS'
          },
          action: {
            click: () => {
              // construct filter by Contact of contact query builder
              const qb = new RequestQueryBuilder();

              // retrieve only relationships that have at least one persons as desired type
              qb.filter.byEquality(
                'persons.type',
                EntityType.CONTACT_OF_CONTACT
              );

              // merge out query builder
              const personsQb = qb.addChildQueryBuilder('person');
              personsQb.merge(this.queryBuilder);

              // remove pagination
              personsQb.paginator.clear();

              // attach condition only if not empty
              if (!personsQb.filter.isEmpty()) {
                // filter only Contacts of contacts
                personsQb.filter.byEquality(
                  'type',
                  EntityType.CONTACT_OF_CONTACT
                );
              }

              // export Contact of contact relationships
              this.exportContactsOfContactsRelationships(qb);
            }
          },
          visible: (): boolean => {
            return ContactOfContactModel.canExportRelationships(this.authUser);
          }
        },

        // Import relationships
        {
          label: {
            get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_IMPORT_CONTACTS_OF_CONTACTS_RELATIONSHIPS'
          },
          action: {
            link: () => ['/import-export-data', 'relationships', 'import'],
            linkQueryParams: (): Params => {
              return {
                from: Constants.APP_PAGE.CONTACTS_OF_CONTACTS.value
              };
            }
          },
          visible: (): boolean => {
            return OutbreakModel.canImportRelationship(this.authUser) &&
              this.selectedOutbreakIsActive;
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
      visible: () => ContactOfContactModel.canExport(this.authUser) ||
        ContactOfContactModel.canExportDossier(this.authUser) ||
        ContactOfContactModel.canExportRelationships(this.authUser) ||
        (
          ContactOfContactModel.canBulkModify(this.authUser) &&
          this.selectedOutbreakIsActive
        ) ||
        (
          ContactOfContactModel.canBulkDelete(this.authUser) &&
          this.selectedOutbreakIsActive
        ) ||
        (
          ContactOfContactModel.canBulkRestore(this.authUser) &&
          this.selectedOutbreakIsActive
        ),
      actions: [
        {
          label: {
            get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS_OF_CONTACTS'
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
              this.exportContactsOfContacts(qb);
            }
          },
          visible: (): boolean => {
            return ContactOfContactModel.canExport(this.authUser);
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
          }
        },
        {
          label: {
            get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS_OF_CONTACTS_DOSSIER'
          },
          action: {
            click: (selected: string[]) => {
              // remove id from list
              const anonymizeFields =
                this.contactsOfContactsFields.filter((item) => {
                  return item.value !== 'id';
                });

              // export dossier
              this.dialogV2Service.showExportData({
                title: {
                  get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS_OF_CONTACTS_DOSSIER_DIALOG_TITLE'
                },
                export: {
                  url: `outbreaks/${this.selectedOutbreak.id}/contacts-of-contacts/dossier`,
                  async: false,
                  method: ExportDataMethod.POST,
                  fileName: `${this.i18nService.instant(
                    'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE'
                  )} - ${moment().format('YYYY-MM-DD HH:mm')}`,
                  extraFormData: {
                    append: {
                      contactsOfContacts: selected
                    }
                  },
                  allow: {
                    types: [ExportDataExtension.ZIP],
                    anonymize: {
                      fields: anonymizeFields,
                      key: 'data'
                    }
                  }
                }
              });
            }
          },
          visible: (): boolean => {
            return ContactOfContactModel.canExportDossier(this.authUser);
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
          }
        },
        {
          label: {
            get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_EXPORT_SELECTED_CONTACTS_OF_CONTACTS_RELATIONSHIPS'
          },
          action: {
            click: (selected: string[]) => {
              // construct query builder
              const qb = new RequestQueryBuilder();
              const personsQb = qb.addChildQueryBuilder('person');

              // retrieve only relationships that have at least one persons as desired type
              qb.filter.byEquality('persons.type', EntityType.CONTACT_OF_CONTACT);

              // id
              personsQb.filter.bySelect('id', selected, true, null);

              // type
              personsQb.filter.byEquality('type', EntityType.CONTACT_OF_CONTACT);

              // export Contact of contact relationships
              this.exportContactsOfContactsRelationships(qb);
            }
          },
          visible: (): boolean => {
            return ContactOfContactModel.canExportRelationships(this.authUser);
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
          }
        },
        {
          label: {
            get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_MODIFY_CONTACTS_OF_CONTACTS'
          },
          action: {
            click: (selected: string[]) => {
              // set data into local storage since query url might be too long for hundreds of ids
              const cacheKey: string = this.bulkCacheHelperService.storeBulkSelected(selected);

              // redirect
              this.router.navigate(
                ['/contacts-of-contacts', 'modify-bulk'],
                {
                  queryParams: {
                    cacheKey
                  }
                }
              );
            }
          },
          visible: (): boolean => {
            return ContactOfContactModel.canBulkModify(this.authUser) &&
              this.selectedOutbreakIsActive;
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
          }
        },

        // Divider
        {
          visible: () => (
            ContactOfContactModel.canExport(this.authUser) ||
            ContactOfContactModel.canExportDossier(this.authUser) ||
            ContactOfContactModel.canExportRelationships(this.authUser) ||
            (
              ContactOfContactModel.canBulkModify(this.authUser) &&
              this.selectedOutbreakIsActive
            )
          ) && (
            (
              ContactOfContactModel.canBulkDelete(this.authUser) ||
              ContactOfContactModel.canBulkRestore(this.authUser)
            ) &&
            this.selectedOutbreakIsActive
          )
        },

        // bulk delete
        {
          label: {
            get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_DELETE_SELECTED_CONTACTS_OF_CONTACTS'
          },
          cssClasses: () => 'gd-list-table-selection-header-button-warning',
          tooltip: (selected: string[]) => selected.length > 0 && !this.tableV2Component.processedSelectedResults.allNotDeleted ?
            this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_DELETE_SELECTED_CONTACTS_OF_CONTACTS_DESCRIPTION') :
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
                      get: () => 'LNG_DIALOG_CONFIRM_DELETE_MULTIPLE_CONTACTS_OF_CONTACTS'
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
                    message: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_DELETE_SELECTED_CONTACTS_OF_CONTACTS_WAIT_MESSAGE',
                    messageData: {
                      no: '1',
                      total: selected.length.toLocaleString('en'),
                      date: '—'
                    }
                  });

                  // delete - we can't use bulk here since deleting contact of contacts triggers many hooks
                  let startTime: Moment;
                  const selectedShallowClone: string[] = [...selected];
                  const nextDelete = () => {
                    // finished ?
                    if (selectedShallowClone.length < 1) {
                      this.toastV2Service.success('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_DELETE_SELECTED_CONTACTS_OF_CONTACTS_SUCCESS_MESSAGE');
                      loading.close();
                      this.needsRefreshList(true);
                      return;
                    }

                    // delete
                    this.contactsOfContactsDataService
                      .deleteContactOfContact(
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
                          message: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_DELETE_SELECTED_CONTACTS_OF_CONTACTS_WAIT_MESSAGE',
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
            return ContactOfContactModel.canBulkDelete(this.authUser) &&
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
            get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_RESTORE_SELECTED_CONTACTS_OF_CONTACTS'
          },
          cssClasses: () => 'gd-list-table-selection-header-button-warning',
          tooltip: (selected: string[]) => selected.length > 0 && !this.tableV2Component.processedSelectedResults.allDeleted ?
            this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_GROUP_ACTION_RESTORE_SELECTED_CONTACTS_OF_CONTACTS_DESCRIPTION') :
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
                      get: () => 'LNG_DIALOG_CONFIRM_RESTORE_MULTIPLE_CONTACTS_OF_CONTACTS'
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
                    message: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_RESTORE_SELECTED_CONTACTS_OF_CONTACTS_WAIT_MESSAGE',
                    messageData: {
                      no: '1',
                      total: selected.length.toLocaleString('en'),
                      date: '—'
                    }
                  });

                  // restore - we can't use bulk here since restoring contact of contacts triggers many hooks
                  let startTime: Moment;
                  const selectedShallowClone: string[] = [...selected];
                  const nextRestore = () => {
                    // finished ?
                    if (selectedShallowClone.length < 1) {
                      this.toastV2Service.success('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_RESTORE_SELECTED_CONTACTS_OF_CONTACTS_SUCCESS_MESSAGE');
                      loading.close();
                      this.needsRefreshList(true);
                      return;
                    }

                    // restore
                    this.contactsOfContactsDataService
                      .restoreContactOfContact(
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
                          message: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_RESTORE_SELECTED_CONTACTS_OF_CONTACTS_WAIT_MESSAGE',
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
            return ContactOfContactModel.canBulkRestore(this.authUser) &&
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
   * - can add contact of contacts only through contacts
   */
  protected initializeAddAction(): void {}

  /**
   * Initialize grouped data
   */
  protected initializeGroupedData(): void {
    this.groupedData = {
      label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_ACTION_SHOW_GROUP_BY_RISK_PILLS',
      click: (
        item,
        group
      ) => {
        // no need to refresh group
        group.data.blockNextGet = true;

        // remove previous conditions
        this.queryBuilder.filter.removePathCondition('riskLevel');
        this.queryBuilder.filter.removePathCondition('or.riskLevel');

        // filter by group data
        if (!item) {
          this.queryBuilder.filter.byEquality(
            'riskLevel',
            null
          );
        } else if (item.label === 'LNG_REFERENCE_DATA_CATEGORY_RISK_LEVEL_UNCLASSIFIED') {
          // clear
          this.queryBuilder.filter.byNotHavingValue(
            'riskLevel',
            true
          );
        } else {
          // search
          this.queryBuilder.filter.byEquality(
            'riskLevel',
            item.label
          );
        }

        // refresh
        this.needsRefreshList();
      },
      data: {
        loading: false,
        values: [],
        get: (
          gData: IV2GroupedData,
          refreshUI: () => void
        ) => {
          // loading data
          gData.data.loading = true;

          // clone queryBuilder to clear it
          const clonedQueryBuilder = _.cloneDeep(this.queryBuilder);
          clonedQueryBuilder.paginator.clear();
          clonedQueryBuilder.sort.clear();
          clonedQueryBuilder.clearFields();

          // remove any riskLevel filters so we see all options
          clonedQueryBuilder.filter.remove('riskLevel');

          // load data
          return this.contactsOfContactsDataService
            .getContactsOfContactsGroupedByRiskLevel(
              this.selectedOutbreak.id,
              clonedQueryBuilder
            )
            .pipe(
              // should be the last pipe
              takeUntil(this.destroyed$)
            )
            .subscribe((countResponse) => {
              // group data
              const risk = this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>;

              let values: {
                label: string,
                value: number,
                color?: string,
                order?: any
              }[] = [];
              Object.keys(countResponse.riskLevels || {}).forEach((riskId) => {
                values.push({
                  label: riskId,
                  value: countResponse.riskLevels[riskId].count,
                  color: risk.map[riskId] ? risk.map[riskId].getColorCode() : Constants.DEFAULT_COLOR_REF_DATA,
                  order: risk.map[riskId]?.order !== undefined ?
                    risk.map[riskId].order :
                    Number.MAX_SAFE_INTEGER
                });
              });

              // sort values either by order or label natural order
              values = values.sort((item1, item2) => {
                // if same order, compare labels
                if (item1.order === item2.order) {
                  return this.i18nService.instant(item1.label).localeCompare(this.i18nService.instant(item2.label));
                }

                // format order
                let order1: number = Number.MAX_SAFE_INTEGER;
                try {
                  order1 = typeof item1.order === 'number' ? item1.order : parseInt(item1.order, 10);
                  order1 = isNaN(order1) ? Number.MAX_SAFE_INTEGER : order1;
                } catch (e) {}
                let order2: number = Number.MAX_SAFE_INTEGER;
                try {
                  order2 = typeof item2.order === 'number' ? item2.order : parseInt(item2.order, 10);
                  order2 = isNaN(order2) ? Number.MAX_SAFE_INTEGER : order2;
                } catch (e) {}

                // compare order
                return order1 - order2;
              });

              // set data
              gData.data.values = values.map((item) => {
                return {
                  label: item.label,
                  bgColor: item.color,
                  textColor: Constants.hexColorToTextColor(item.color),
                  value: item.value.toLocaleString('en')
                };
              });

              // finished loading data
              gData.data.loading = false;

              // refresh ui
              refreshUI();
            });
        }
      }
    };
  }

  /**
   * Export contacts of contacts data
   */
  private exportContactsOfContacts(qb: RequestQueryBuilder): void {
    this.dialogV2Service.showExportDataAfterLoadingData({
      title: {
        get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_TITLE'
      },
      load: (finished) => {
        // retrieve the list of export fields groups for model
        this.outbreakDataService
          .getExportFieldsGroups(ExportFieldsGroupModelNameEnum.CONTACT_OF_CONTACT)
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
            const contactsOfContactsFieldGroups: ILabelValuePairModel[] = fieldsGroupList.options.map((item) => ({
              label: item.name,
              value: item.name
            }));

            // group restrictions
            const contactsOfContactsFieldGroupsRequires: IV2ExportDataConfigGroupsRequired = fieldsGroupList.toRequiredList();

            // show export
            finished({
              title: {
                get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_TITLE'
              },
              export: {
                url: `/outbreaks/${this.selectedOutbreak.id}/contacts-of-contacts/export`,
                async: true,
                method: ExportDataMethod.POST,
                fileName: `${this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE')} - ${moment().format('YYYY-MM-DD HH:mm')}`,
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
                    fields: this.contactsOfContactsFields
                  },
                  groups: {
                    fields: contactsOfContactsFieldGroups,
                    required: contactsOfContactsFieldGroupsRequires,
                    change: (data, handler) => {
                      // do we need to de-select exposure person data ?
                      const includeExposurePersonDataCheckbox: IV2SideDialogConfigInputCheckbox = data.map.includePersonExposureFields as IV2SideDialogConfigInputCheckbox;
                      const allGroups: boolean = (data.map.fieldsGroupAll as IV2SideDialogConfigInputCheckbox)?.checked;
                      const fieldsGroupListDropdown: IV2SideDialogConfigInputMultiDropdown = data.map.fieldsGroupList as IV2SideDialogConfigInputMultiDropdown;
                      if (
                        includeExposurePersonDataCheckbox?.checked &&
                        !allGroups && (
                          !fieldsGroupListDropdown.values?.length ||
                          fieldsGroupListDropdown.values.indexOf(Constants.EXPORT_GROUP.RELATIONSHIPS_DATA) < 0
                        )
                      ) {
                        // de-select exposure person data
                        includeExposurePersonDataCheckbox.checked = false;
                        handler.detectChanges();
                      }
                    }
                  },
                  fields: {
                    options: this.contactsOfContactsFields,
                    change: (data, handler) => {
                      // do we need to de-select exposure person data ?
                      const includeExposurePersonDataCheckbox: IV2SideDialogConfigInputCheckbox = data.map.includePersonExposureFields as IV2SideDialogConfigInputCheckbox;
                      const allFields: boolean = (data.map.fieldsAll as IV2SideDialogConfigInputCheckbox)?.checked;
                      const fieldsListDropdown: IV2SideDialogConfigInputMultiDropdown = data.map.fieldsList as IV2SideDialogConfigInputMultiDropdown;
                      if (
                        includeExposurePersonDataCheckbox?.checked &&
                        !allFields && (
                          !fieldsListDropdown.values?.length ||
                          fieldsListDropdown.values.indexOf(ContactsOfContactsListComponent.RELATIONSHIP_DATA) < 0
                        )
                      ) {
                        // de-select exposure person data
                        includeExposurePersonDataCheckbox.checked = false;
                        handler.detectChanges();
                      }
                    }
                  },
                  dbColumns: true,
                  dbValues: true,
                  jsonReplaceUndefinedWithNull: true
                },
                inputs: {
                  append: [
                    {
                      type: V2SideDialogConfigInputType.CHECKBOX,
                      placeholder: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_CASE_INFORMATION',
                      tooltip: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_CASE_INFORMATION_DESCRIPTION',
                      name: 'includeCaseFields',
                      checked: false
                    }, {
                      type: V2SideDialogConfigInputType.CHECKBOX,
                      placeholder: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_CONTACT_INFORMATION',
                      tooltip: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_CONTACT_INFORMATION_DESCRIPTION',
                      name: 'includeContactFields',
                      checked: false
                    }, {
                      type: V2SideDialogConfigInputType.CHECKBOX,
                      placeholder: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_EXPOSURE_INFORMATION',
                      tooltip: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_EXPOSURE_INFORMATION_DESCRIPTION',
                      name: 'includePersonExposureFields',
                      checked: false,
                      change: (data, handler) => {
                        // check if we need to make adjustments
                        const includeExposurePersonData: boolean = (data.map.includePersonExposureFields as IV2SideDialogConfigInputCheckbox)?.checked;
                        if (includeExposurePersonData) {
                          // check groups & fields
                          const allGroups: boolean = (data.map.fieldsGroupAll as IV2SideDialogConfigInputCheckbox)?.checked;
                          const allFields: boolean = (data.map.fieldsAll as IV2SideDialogConfigInputCheckbox)?.checked;
                          if (!allGroups) {
                            // do we need to select relationship data ?
                            const fieldsGroupListDropdown: IV2SideDialogConfigInputMultiDropdown = data.map.fieldsGroupList as IV2SideDialogConfigInputMultiDropdown;
                            if (fieldsGroupListDropdown) {
                              // initialize if necessary
                              fieldsGroupListDropdown.values = fieldsGroupListDropdown.values || [];

                              // select relationship data since this is necessary
                              if (fieldsGroupListDropdown.values.indexOf(Constants.EXPORT_GROUP.RELATIONSHIPS_DATA) < 0) {
                                // select relationship data
                                fieldsGroupListDropdown.values.push(Constants.EXPORT_GROUP.RELATIONSHIPS_DATA);
                                fieldsGroupListDropdown.values = [...fieldsGroupListDropdown.values];
                                handler.detectChanges();
                              }
                            }
                          } else if (!allFields) {
                            // do we need to select relationship data ?
                            const fieldsListDropdown: IV2SideDialogConfigInputMultiDropdown = data.map.fieldsList as IV2SideDialogConfigInputMultiDropdown;
                            if (fieldsListDropdown) {
                              // initialize if necessary
                              fieldsListDropdown.values = fieldsListDropdown.values || [];

                              // select relationship data since this is necessary
                              if (fieldsListDropdown.values.indexOf(ContactsOfContactsListComponent.RELATIONSHIP_DATA) < 0) {
                                // select relationship data
                                fieldsListDropdown.values.push(ContactsOfContactsListComponent.RELATIONSHIP_DATA);
                                fieldsListDropdown.values = [...fieldsListDropdown.values];
                                handler.detectChanges();
                              }
                            }
                          }
                        }
                      }
                    }, {
                      type: V2SideDialogConfigInputType.CHECKBOX,
                      placeholder: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_RETRIEVE_OLDEST_EXPOSURE',
                      tooltip: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_RETRIEVE_OLDEST_EXPOSURE_DESCRIPTION',
                      name: 'retrieveOldestExposure',
                      checked: false
                    }
                  ]
                }
              }
            });
          });
      }
    });
  }

  /**
   * Export contacts of contacts relationships
   */
  private exportContactsOfContactsRelationships(qb: RequestQueryBuilder): void {
    this.dialogV2Service
      .showExportDataAfterLoadingData({
        title: {
          get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_RELATIONSHIPS_TITLE'
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
                  get: () => 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_RELATIONSHIPS_TITLE'
                },
                export: {
                  url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
                  async: true,
                  method: ExportDataMethod.POST,
                  fileName: `${this.i18nService.instant('LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_EXPORT_RELATIONSHIP_FILE_NAME')} - ${moment().format('YYYY-MM-DD')}`,
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
        label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
        action: null
      }
    ];
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [
      'id',
      'lastName',
      'middleName',
      'firstName',
      'visualId',
      'pregnancyStatus',
      'occupation',
      'addresses',
      'documents',
      'vaccinesReceived',
      'dob',
      'age',
      'gender',
      'riskLevel',
      'riskReason',
      'dateOfLastContact',
      'dateOfReporting',
      'isDateOfReportingApproximate',
      'wasCase',
      'wasContact',
      'responsibleUserId',
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
   * Re(load) the Contacts list
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

    // retrieve the list of Contacts
    this.records$ = this.contactsOfContactsDataService
      .getContactsOfContactsList(this.selectedOutbreak.id, this.queryBuilder)
      .pipe(
        switchMap((data) => {
          // determine locations that we need to retrieve
          const locationsIdsMap: {
            [locationId: string]: true
          } = {};
          data.forEach((item) => {
            (item.addresses || []).forEach((address) => {
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
                  (item.addresses || []).forEach((address) => {
                    address.location = address.locationId && locationsMap[address.locationId] ?
                      locationsMap[address.locationId] :
                      address.location;
                  });
                });

                // finished
                return data;
              })
            );
        })
      )
      .pipe(
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
    this.contactsOfContactsDataService.getContactsOfContactsCount(this.selectedOutbreak.id, countQueryBuilder).pipe(
      // error
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
