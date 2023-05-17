import { Component, OnDestroy } from '@angular/core';
import { of, throwError } from 'rxjs';
import { UserModel } from '../../../../core/models/user.model';
import { CaseModel } from '../../../../core/models/case.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ApplyListFilter, Constants } from '../../../../core/models/constants';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ActivatedRoute, Params } from '@angular/router';
import { EntityType } from '../../../../core/models/entity-type';
import * as _ from 'lodash';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { EntityHelperService } from '../../../../core/services/helper/entity-helper.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { AddressModel } from '../../../../core/models/address.model';
import { ExportFieldsGroupModelNameEnum } from '../../../../core/models/export-fields-group.model';
import { IV2Column, IV2ColumnPinned, IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { IV2GroupedData } from '../../../../shared/components-v2/app-list-table-v2/models/grouped-data.model';
import { IV2BreadcrumbAction } from '../../../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { ExportButtonKey, ExportDataExtension, ExportDataMethod, IV2ExportDataConfigGroupsRequired } from '../../../../core/services/helper/models/dialog-v2.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { LocationModel } from '../../../../core/models/location.model';
import { IV2FilterBoolean, IV2FilterMultipleSelect, V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import * as moment from 'moment';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';
import { Location } from '@angular/common';

export interface IsolatedContact {
  id: string,
  firstName: string,
  middleName: string,
  lastName: string
}

@Component({
  selector: 'app-cases-list',
  templateUrl: './cases-list.component.html'
})
export class CasesListComponent extends ListComponent<CaseModel> implements OnDestroy {
  // case fields
  private caseFields: ILabelValuePairModel[] = [
    { label: 'LNG_CASE_FIELD_LABEL_ID', value: 'id' },
    { label: 'LNG_CASE_FIELD_LABEL_FIRST_NAME', value: 'firstName' },
    { label: 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME', value: 'middleName' },
    { label: 'LNG_CASE_FIELD_LABEL_LAST_NAME', value: 'lastName' },
    { label: 'LNG_CASE_FIELD_LABEL_GENDER', value: 'gender' },
    { label: 'LNG_CASE_FIELD_LABEL_OCCUPATION', value: 'occupation' },
    { label: 'LNG_CASE_FIELD_LABEL_DOB', value: 'dob' },
    { label: 'LNG_CASE_FIELD_LABEL_AGE', value: 'age' },
    { label: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL', value: 'riskLevel' },
    { label: 'LNG_CASE_FIELD_LABEL_RISK_REASON', value: 'riskReason' },
    { label: 'LNG_CASE_FIELD_LABEL_DOCUMENTS', value: 'documents' },
    { label: 'LNG_CASE_FIELD_LABEL_ADDRESSES', value: 'addresses' },
    { label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION', value: 'classification' },
    { label: 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION', value: 'dateOfInfection' },
    { label: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET', value: 'dateOfOnset' },
    { label: 'LNG_CASE_FIELD_LABEL_IS_DATE_OF_ONSET_APPROXIMATE', value: 'isDateOfOnsetApproximate' },
    { label: 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME', value: 'dateOfOutcome' },
    { label: 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE', value: 'dateBecomeCase' },
    { label: 'LNG_CASE_FIELD_LABEL_HOSPITALIZATION_ISOLATION_DETAILS', value: 'dateRanges' },
    { label: 'LNG_CASE_FIELD_LABEL_QUESTIONNAIRE_ANSWERS', value: 'questionnaireAnswers' },
    { label: 'LNG_CASE_FIELD_LABEL_TYPE', value: 'type' },
    { label: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING', value: 'dateOfReporting' },
    { label: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE', value: 'isDateOfReportingApproximate' },
    { label: 'LNG_CASE_FIELD_LABEL_TRANSFER_REFUSED', value: 'transferRefused' },
    { label: 'LNG_CASE_FIELD_LABEL_DEATH_LOCATION_ID', value: 'deathLocationId' },
    { label: 'LNG_CASE_FIELD_LABEL_VISUAL_ID', value: 'visualId' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', value: 'createdAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', value: 'createdBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', value: 'updatedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', value: 'updatedBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED', value: 'deleted' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', value: 'deletedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', value: 'createdOn' },
    { label: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT', value: 'wasContact' },
    { label: 'LNG_CONTACT_FIELD_LABEL_WAS_CASE', value: 'wasCase' },
    { label: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT_OF_CONTACT', value: 'wasContactOfContact' },
    { label: 'LNG_CASE_FIELD_LABEL_INVESTIGATION_STATUS', value: 'investigationStatus' },
    { label: 'LNG_CASE_FIELD_LABEL_DATE_INVESTIGATION_COMPLETED', value: 'dateInvestigationCompleted' },
    { label: 'LNG_CASE_FIELD_LABEL_OUTCOME_ID', value: 'outcomeId' },
    { label: 'LNG_CASE_FIELD_LABEL_SAFE_BURIAL', value: 'safeBurial' },
    { label: 'LNG_CASE_FIELD_LABEL_DATE_OF_BURIAL', value: 'dateOfBurial' },
    { label: 'LNG_CASE_FIELD_LABEL_NUMBER_OF_EXPOSURES', value: 'numberOfExposures' },
    { label: 'LNG_CASE_FIELD_LABEL_NUMBER_OF_CONTACTS', value: 'numberOfContacts' },
    { label: 'LNG_CASE_FIELD_LABEL_BURIAL_LOCATION_ID', value: 'burialLocationId' },
    { label: 'LNG_CASE_FIELD_LABEL_BURIAL_PLACE_NAME', value: 'burialPlaceName' },
    { label: 'LNG_CASE_FIELD_LABEL_VACCINES_RECEIVED', value: 'vaccinesReceived' },
    { label: 'LNG_CASE_FIELD_LABEL_PREGNANCY_STATUS', value: 'pregnancyStatus' },
    { label: 'LNG_CASE_FIELD_LABEL_RESPONSIBLE_USER_ID', value: 'responsibleUser' }
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

  // used to filter cases
  notACaseFilter: boolean | '' = false;

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private activatedRoute: ActivatedRoute,
    private caseDataService: CaseDataService,
    private locationDataService: LocationDataService,
    private toastV2Service: ToastV2Service,
    private outbreakDataService: OutbreakDataService,
    private dialogV2Service: DialogV2Service,
    private i18nService: I18nService,
    private entityHelperService: EntityHelperService,
    private redirectService: RedirectService,
    private clusterDataService: ClusterDataService,
    private referenceDataHelperService: ReferenceDataHelperService,
    protected location: Location
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
        // View Case
        {
          type: V2ActionType.ICON,
          icon: 'visibility',
          iconTooltip: 'LNG_PAGE_LIST_CASES_ACTION_VIEW_CASE',
          action: {
            link: (data: CaseModel): string[] => {
              return ['/cases', data.id, 'view'];
            }
          },
          visible: (item: CaseModel): boolean => {
            return !item.deleted &&
              CaseModel.canView(this.authUser);
          }
        },

        // Modify Case
        {
          type: V2ActionType.ICON,
          icon: 'edit',
          iconTooltip: 'LNG_PAGE_LIST_CASES_ACTION_MODIFY_CASE',
          action: {
            link: (item: CaseModel): string[] => {
              return ['/cases', item.id, 'modify'];
            }
          },
          visible: (item: CaseModel): boolean => {
            return !item.deleted &&
              this.selectedOutbreakIsActive &&
              CaseModel.canModify(this.authUser);
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
                get: () => 'LNG_PAGE_LIST_CASES_ACTION_DELETE_CASE'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: CaseModel): void => {
                  // data
                  const message: {
                    get: string,
                    data?: {
                      name: string,
                      numberOfContacts: string
                    }
                  } = {
                    get: ''
                  };

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
                        get: () => message.get,
                        data: () => message.data
                      }
                    },
                    yesLabel: 'LNG_DIALOG_CONFIRM_BUTTON_OK',
                    initialized: (handler) => {
                      // display loading
                      handler.loading.show();

                      // determine if case has exposed contacts
                      this.caseDataService
                        .getExposedContactsForCase(this.selectedOutbreak.id, item.id)
                        .pipe(
                          catchError((err) => {
                            // show error
                            this.toastV2Service.error(err);

                            // hide loading
                            handler.loading.hide();

                            // send error down the road
                            return throwError(err);
                          })
                        )
                        .subscribe((exposedContacts: { count: number }) => {
                          // set message data
                          message.data = {
                            name: item.name,
                            numberOfContacts: exposedContacts?.count.toLocaleString('en')
                          };

                          // determine message label
                          message.get = !exposedContacts?.count ?
                            'LNG_DIALOG_CONFIRM_DELETE_CASE' :
                            'LNG_DIALOG_CONFIRM_DELETE_CASE_WITH_EXPOSED_CONTACTS';

                          // hide loading
                          handler.loading.hide();
                        });
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
                    this.caseDataService
                      .deleteCase(
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
                        this.toastV2Service.success('LNG_PAGE_LIST_CASES_ACTION_DELETE_SUCCESS_MESSAGE');

                        // hide loading
                        loading.close();

                        // reload data
                        this.needsRefreshList(true);
                      });
                  });
                }
              },
              visible: (item: CaseModel): boolean => {
                return !item.deleted &&
                  this.selectedOutbreakIsActive &&
                  CaseModel.canDelete(this.authUser);
              }
            },

            // Divider
            {
              visible: (item: CaseModel): boolean => {
                // visible only if at least one of the first two items is visible
                return !item.deleted &&
                  this.selectedOutbreakIsActive &&
                  CaseModel.canDelete(this.authUser);
              }
            },

            // Convert Case To Contact
            {
              label: {
                get: () => 'LNG_PAGE_LIST_CASES_ACTION_CONVERT_TO_CONTACT'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: CaseModel): void => {
                  // show confirm dialog to confirm the action
                  this.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_CONVERT',
                        data: () => ({
                          name: item.name,
                          type: this.i18nService.instant(EntityType.CONTACT)
                        })
                      },
                      message: {
                        get: () => 'LNG_DIALOG_CONFIRM_CONVERT_CASE_TO_CONTACT',
                        data: () => item as any
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

                    // determine if case has isolated contacts
                    this.caseDataService
                      .getExposedContactsForCase(this.selectedOutbreak.id, item.id)
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
                      .subscribe((isolatedContacts: { count: number, contacts: IsolatedContact[] }) => {
                        // create a convert method
                        const convertCase = () => {
                          this.caseDataService
                            .convertToContact(
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
                              this.toastV2Service.success('LNG_PAGE_LIST_CASES_ACTION_CONVERT_TO_CONTACT_SUCCESS_MESSAGE');

                              // hide loading
                              loading.close();

                              // reload data
                              this.needsRefreshList(true);

                            });
                        };

                        // show isolated contacts ?
                        if (isolatedContacts?.count) {
                          // get the isolated contacts
                          const contactLinks: string = isolatedContacts.contacts
                            .map((entity) => {
                              // create contact full name
                              const fullName = [entity.firstName, entity.middleName, entity.lastName]
                                .filter(Boolean)
                                .join(' ');

                              // check rights
                              if (!ContactModel.canView(this.authUser)) {
                                return `${fullName} (${this.i18nService.instant(EntityType.CONTACT)})`;
                              }

                              // create url
                              const url = `contacts/${entity.id}/view`;

                              // finished
                              return `<a class="gd-alert-link" href="${this.location.prepareExternalUrl(url)}"><span>${fullName}</span></a>`;
                            })
                            .join(', ');

                          // show isolated contacts
                          this.dialogV2Service.showConfirmDialog({
                            config: {
                              title: {
                                get: () => 'LNG_COMMON_LABEL_CONVERT',
                                data: () => ({
                                  name: item.name,
                                  type: this.i18nService.instant(EntityType.CONTACT)
                                })
                              },
                              message: {
                                get: () => 'LNG_PAGE_LIST_CASES_ACTION_ISOLATED_CONTACTS',
                                data: () => ({
                                  contacts: contactLinks
                                })
                              }
                            },
                            yesLabel: 'LNG_DIALOG_CONFIRM_BUTTON_OK'
                          }).subscribe((dialogResponse) => {
                            // canceled ?
                            if (dialogResponse.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                              // hide loading
                              loading.close();

                              // finished
                              return;
                            }

                            // convert case
                            convertCase();
                          });
                        } else {
                          // convert case
                          convertCase();
                        }
                      });
                  });
                }
              },
              visible: (item: CaseModel): boolean => {
                return !item.deleted &&
                  this.selectedOutbreakIsActive &&
                  CaseModel.canConvertToContact(this.authUser);
              }
            },

            // Divider
            {
              visible: (item: CaseModel): boolean => {
                // visible only if at least one of the first two items is visible
                return !item.deleted &&
                  this.selectedOutbreakIsActive &&
                  CaseModel.canConvertToContact(this.authUser);
              }
            },

            // Add Contact to Case
            {
              label: {
                get: () => 'LNG_PAGE_ACTION_ADD_CONTACT'
              },
              action: {
                link: (): string[] => {
                  return ['/contacts', 'create'];
                },
                linkQueryParams: (item: CaseModel): Params => {
                  return {
                    entityType: EntityType.CASE,
                    entityId: item.id
                  };
                }
              },
              visible: (item: CaseModel): boolean => {
                return !item.deleted &&
                  this.selectedOutbreakIsActive &&
                  ContactModel.canCreate(this.authUser) &&
                  CaseModel.canCreateContact(this.authUser);
              }
            },

            // Bulk add contacts to case
            {
              label: {
                get: () => 'LNG_PAGE_ACTION_BULK_ADD_CONTACTS'
              },
              action: {
                link: (): string[] => {
                  return ['/contacts', 'create-bulk'];
                },
                linkQueryParams: (item: CaseModel): Params => {
                  return {
                    entityType: EntityType.CASE,
                    entityId: item.id
                  };
                }
              },
              visible: (item: CaseModel): boolean => {
                return !item.deleted &&
                  this.selectedOutbreakIsActive &&
                  ContactModel.canBulkCreate(this.authUser) &&
                  CaseModel.canBulkCreateContact(this.authUser);
              }
            },

            // Divider
            {
              visible: (item: CaseModel): boolean => {
                // visible only if at least one of the previous two items is visible
                return !item.deleted &&
                  this.selectedOutbreakIsActive &&
                  (
                    (
                      ContactModel.canCreate(this.authUser) &&
                      CaseModel.canCreateContact(this.authUser)
                    ) || (
                      ContactModel.canBulkCreate(this.authUser) &&
                      CaseModel.canBulkCreateContact(this.authUser)
                    )
                  );
              }
            },

            // See case contacts..
            {
              label: {
                get: () => 'LNG_PAGE_ACTION_SEE_EXPOSURES_FROM'
              },
              action: {
                link: (item: CaseModel): string[] => {
                  return ['/relationships', EntityType.CASE, item.id, 'contacts'];
                }
              },
              visible: (item: CaseModel): boolean => {
                return !item.deleted &&
                  RelationshipModel.canList(this.authUser) &&
                  CaseModel.canListRelationshipContacts(this.authUser);
              }
            },

            // See case exposures
            {
              label: {
                get: () => 'LNG_PAGE_ACTION_SEE_EXPOSURES_TO'
              },
              action: {
                link: (item: CaseModel): string[] => {
                  return ['/relationships', EntityType.CASE, item.id, 'exposures'];
                }
              },
              visible: (item: CaseModel): boolean => {
                return !item.deleted &&
                  RelationshipModel.canList(this.authUser) &&
                  CaseModel.canListRelationshipExposures(this.authUser);
              }
            },

            // Divider
            {
              visible: (item: CaseModel): boolean => {
                // visible only if at least one of the previous two items is visible
                return !item.deleted &&
                  RelationshipModel.canList(this.authUser) &&
                  (
                    CaseModel.canListRelationshipContacts(this.authUser) ||
                    CaseModel.canListRelationshipExposures(this.authUser)
                  );
              }
            },

            // See records detected by the system as duplicates but they were marked as not duplicates
            {
              label: {
                get: () => 'LNG_PAGE_LIST_CASES_ACTION_SEE_RECORDS_NOT_DUPLICATES'
              },
              action: {
                link: (item: CaseModel): string[] => {
                  return ['/duplicated-records/cases', item.id, 'marked-not-duplicates'];
                }
              },
              visible: (item: CaseModel): boolean => {
                return !item.deleted;
              }
            },

            // See case lab results
            {
              label: {
                get: () => 'LNG_PAGE_LIST_CASES_ACTION_SEE_LAB_RESULTS'
              },
              action: {
                link: (item: CaseModel): string[] => {
                  return ['/lab-results', 'cases', item.id];
                }
              },
              visible: (item: CaseModel): boolean => {
                return !item.deleted &&
                  LabResultModel.canList(this.authUser) &&
                  CaseModel.canListLabResult(this.authUser);
              }
            },

            // See contacts follow-us belonging to this case
            {
              label: {
                get: () => 'LNG_PAGE_LIST_CASES_ACTION_VIEW_FOLLOW_UPS'
              },
              action: {
                link: (item: CaseModel): string[] => {
                  return ['/contacts', 'case-related-follow-ups', item.id];
                }
              },
              visible: (item: CaseModel): boolean => {
                return !item.deleted &&
                  FollowUpModel.canList(this.authUser);
              }
            },

            // Divider
            {
              visible: (item: CaseModel): boolean => {
                // visible only if at least one of the previous two items is visible
                return !item.deleted && (
                  LabResultModel.canList(this.authUser) ||
                  FollowUpModel.canList(this.authUser)
                );
              }
            },

            // View Case movement map
            {
              label: {
                get: () => 'LNG_PAGE_LIST_CASES_ACTION_VIEW_MOVEMENT'
              },
              action: {
                link: (item: CaseModel): string[] => {
                  return ['/cases', item.id, 'movement'];
                }
              },
              visible: (item: CaseModel): boolean => {
                return !item.deleted &&
                  CaseModel.canViewMovementMap(this.authUser);
              }
            },

            // View case chronology timeline
            {
              label: {
                get: () => 'LNG_PAGE_LIST_CASES_ACTION_VIEW_CHRONOLOGY'
              },
              action: {
                link: (item: CaseModel): string[] => {
                  return ['/cases', item.id, 'chronology'];
                }
              },
              visible: (item: CaseModel): boolean => {
                return !item.deleted &&
                  CaseModel.canViewChronologyChart(this.authUser);
              }
            },

            // Divider
            {
              visible: (item: CaseModel): boolean => {
                return !item.deleted && (
                  CaseModel.canViewMovementMap(this.authUser) ||
                  CaseModel.canViewChronologyChart(this.authUser)
                );
              }
            },

            // Download case investigation form
            {
              label: {
                get: () => 'LNG_PAGE_LIST_CASES_ACTION_EXPORT_CASE_INVESTIGATION_FORM'
              },
              action: {
                click: (item: CaseModel) => {
                  // export
                  this.dialogV2Service.showExportData({
                    title: {
                      get: () => 'LNG_PAGE_LIST_CASES_EXPORT_CASE_INVESTIGATION_FORM_TITLE'
                    },
                    initialized: (handler) => {
                      handler.buttons.click(ExportButtonKey.EXPORT);
                    },
                    export: {
                      url: `outbreaks/${this.selectedOutbreak.id}/cases/${item.id}/export-empty-case-investigation`,
                      async: false,
                      method: ExportDataMethod.GET,
                      fileName: `${this.i18nService.instant('LNG_PAGE_LIST_CASES_TITLE')} - ${moment().format('YYYY-MM-DD')}`,
                      allow: {
                        types: [
                          ExportDataExtension.ZIP
                        ]
                      }
                    }
                  });
                }
              },
              visible: (item: CaseModel): boolean => {
                return !item.deleted &&
                  CaseModel.canExportInvestigationForm(this.authUser);
              }
            },

            // Restore a deleted case
            {
              label: {
                get: () => 'LNG_PAGE_LIST_CASES_ACTION_RESTORE_CASE'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: CaseModel) => {
                  // show confirm dialog to confirm the action
                  this.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_RESTORE',
                        data: () => item as any
                      },
                      message: {
                        get: () => 'LNG_DIALOG_CONFIRM_RESTORE_CASE',
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
                    this.caseDataService
                      .restoreCase(
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
                        this.toastV2Service.success('LNG_PAGE_LIST_CASES_ACTION_RESTORE_SUCCESS_MESSAGE');

                        // hide loading
                        loading.close();

                        // reload data
                        this.needsRefreshList(true);
                      });
                  });
                }
              },
              visible: (item: CaseModel): boolean => {
                return item.deleted &&
                  this.selectedOutbreakIsActive &&
                  CaseModel.canRestore(this.authUser);
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

    // default table columns
    this.tableColumns = [
      {
        field: 'lastName',
        label: 'LNG_CASE_FIELD_LABEL_LAST_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'firstName',
        label: 'LNG_CASE_FIELD_LABEL_FIRST_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'middleName',
        label: 'LNG_CASE_FIELD_LABEL_MIDDLE_NAME',
        notVisible: true,
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'visualId',
        label: 'LNG_CASE_FIELD_LABEL_VISUAL_ID',
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
          // classification
          {
            title: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
            items: this.referenceDataHelperService.filterPerOutbreak(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).list
            ).map((item) => {
              return {
                form: {
                  type: IV2ColumnStatusFormType.CIRCLE,
                  color: item.getColorCode()
                },
                label: item.id,
                order: item.order
              };
            })
          },

          // outcome
          {
            title: 'LNG_CASE_FIELD_LABEL_OUTCOME',
            items: this.referenceDataHelperService.filterPerOutbreak(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.outcome as IResolverV2ResponseModel<ReferenceDataEntryModel>).list
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
          },

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
        forms: (_column, data: CaseModel): V2ColumnStatusForm[] => CaseModel.getStatusForms({
          item: data,
          i18nService: this.i18nService,
          classification: this.activatedRoute.snapshot.data.classification,
          outcome: this.activatedRoute.snapshot.data.outcome
        })
      },
      {
        field: 'classification',
        label: 'LNG_CASE_FIELD_LABEL_CLASSIFICATION',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: this.referenceDataHelperService.filterPerOutbreakOptions(
            this.selectedOutbreak,
            (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            undefined
          ),
          search: (column: IV2Column) => {
            // create condition
            const values: string[] = (column.filter as IV2FilterMultipleSelect).value;
            const condition = {
              classification: {
                inq: values
              }
            };

            // remove existing filter
            this.queryBuilder.filter.removeExactCondition(condition);

            // add new filter
            if (values) {
              // filter
              this.queryBuilder.filter.bySelect(
                'classification',
                values,
                false,
                null
              );

              // refresh list
              this.needsRefreshList();
            }
          }
        }
      },
      {
        field: 'investigationStatus',
        label: 'LNG_CASE_FIELD_LABEL_INVESTIGATION_STATUS',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.investigationStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          includeNoValue: true
        }
      },
      {
        field: 'dateInvestigationCompleted',
        label: 'LNG_CASE_FIELD_LABEL_DATE_INVESTIGATION_COMPLETED',
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
        field: 'outcomeId',
        label: 'LNG_CASE_FIELD_LABEL_OUTCOME',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: this.referenceDataHelperService.filterPerOutbreakOptions(
            this.selectedOutbreak,
            (this.activatedRoute.snapshot.data.outcome as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            undefined
          ),
          includeNoValue: true
        }
      },
      {
        field: 'dateOfOutcome',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME',
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
        field: 'deathLocationId',
        label: 'LNG_CASE_FIELD_LABEL_DEATH_LOCATION_ID',
        format: {
          type: 'deathLocation.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_LOCATION,
          useOutbreakLocations: true,
          field: 'deathLocationId.parentLocationIdFilter'
        },
        link: (data) => {
          return data.deathLocation?.name && LocationModel.canView(this.authUser) ?
            `/locations/${data.deathLocation.id}/view` :
            undefined;
        }
      },
      {
        field: 'age',
        label: 'LNG_CASE_FIELD_LABEL_AGE',
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
        label: 'LNG_CASE_FIELD_LABEL_GENDER',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'riskLevel',
        label: 'LNG_CASE_FIELD_LABEL_RISK_LEVEL',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: this.referenceDataHelperService.filterPerOutbreakOptions(
            this.selectedOutbreak,
            (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            undefined
          )
        }
      },
      {
        field: 'riskReason',
        label: 'LNG_CASE_FIELD_LABEL_RISK_REASON',
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'occupation',
        label: 'LNG_CASE_FIELD_LABEL_OCCUPATION',
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
        field: 'phoneNumber',
        label: 'LNG_CASE_FIELD_LABEL_PHONE_NUMBER',
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
        label: 'LNG_CASE_FIELD_LABEL_ADDRESS_LOCATION',
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
        field: 'addresses.emailAddress',
        label: 'LNG_CASE_FIELD_LABEL_EMAIL',
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
        field: 'addresses.addressLine1',
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS',
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
        },
        sortable: true
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
        field: 'dateOfOnset',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET',
        format: {
          type: V2ColumnFormat.DATE
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
      },
      {
        field: 'dateOfReporting',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_REPORTING',
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
        field: 'dateOfBurial',
        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_BURIAL',
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
        field: 'burialLocationId',
        label: 'LNG_CASE_FIELD_LABEL_BURIAL_LOCATION_ID',
        format: {
          type: 'burialLocation.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_LOCATION,
          useOutbreakLocations: true,
          field: 'burialLocationId.parentLocationIdFilter'
        },
        link: (data) => {
          return data.burialLocation?.name && LocationModel.canView(this.authUser) ?
            `/locations/${data.burialLocation.id}/view` :
            undefined;
        }
      },
      {
        field: 'burialPlaceName',
        label: 'LNG_CASE_FIELD_LABEL_BURIAL_PLACE_NAME',
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'notACase',
        label: 'LNG_CASE_FIELD_LABEL_NOT_A_CASE',
        notVisible: true,
        format: {
          type: V2ColumnFormat.BOOLEAN,
          value: (data) => {
            return data.classification === Constants.CASE_CLASSIFICATION.NOT_A_CASE;
          }
        },
        filter: {
          type: V2FilterType.BOOLEAN,
          value: this.notACaseFilter,
          defaultValue: this.notACaseFilter,
          search: (column) => {
            // update not a case
            this.notACaseFilter = (column.filter as IV2FilterBoolean).value;

            // refresh
            this.needsRefreshList();
          }
        }
      },
      {
        field: 'wasContact',
        label: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT',
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
        field: 'wasContactOfContact',
        label: 'LNG_CASE_FIELD_LABEL_WAS_CONTACT_OF_CONTACT',
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
        label: 'LNG_CASE_FIELD_LABEL_RESPONSIBLE_USER_ID',
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
      }
    ];

    // number of contacts & exposures columns should be visible only on pages where we have relationships
    // for cases without relationships we don't need these columns
    if (this.appliedListFilter !== Constants.APPLY_LIST_FILTER.CASES_WITHOUT_RELATIONSHIPS) {
      this.tableColumns.push(
        {
          field: 'numberOfContacts',
          label: 'LNG_CASE_FIELD_LABEL_NUMBER_OF_CONTACTS',
          format: {
            type: V2ColumnFormat.BUTTON
          },
          filter: {
            type: V2FilterType.NUMBER_RANGE,
            min: 0
          },
          sortable: true,
          cssCellClass: 'gd-cell-button',
          buttonLabel: (item) => (item.numberOfContacts || '').toLocaleString('en'),
          color: 'text',
          click: (item) => {
            // if we do not have contacts return
            if (item.numberOfContacts < 1) {
              return;
            }

            // display dialog
            this.entityHelperService.contacts(
              this.selectedOutbreak,
              item
            );
          },
          disabled: (data) => !RelationshipModel.canList(this.authUser) || !data.canListRelationshipContacts(this.authUser)
        },
        {
          field: 'numberOfExposures',
          label: 'LNG_CASE_FIELD_LABEL_NUMBER_OF_EXPOSURES',
          format: {
            type: V2ColumnFormat.BUTTON
          },
          filter: {
            type: V2FilterType.NUMBER_RANGE,
            min: 0
          },
          sortable: true,
          cssCellClass: 'gd-cell-button',
          buttonLabel: (item) => (item.numberOfExposures || '').toLocaleString('en'),
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
        }
      );
    }

    // rest of columns :)
    this.tableColumns.push(
      {
        field: 'deleted',
        label: 'LNG_CASE_FIELD_LABEL_DELETED',
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
        field: 'createdBy',
        label: 'LNG_CASE_FIELD_LABEL_CREATED_BY',
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
        label: 'LNG_CASE_FIELD_LABEL_CREATED_AT',
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
        label: 'LNG_CASE_FIELD_LABEL_UPDATED_BY',
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
        label: 'LNG_CASE_FIELD_LABEL_UPDATED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
      }
    );
  }

  /**
   * Initialize process data
   */
  protected initializeProcessSelectedData(): void {}

  /**
   * Initialize table infos
   */
  protected initializeTableInfos(): void {
    // additional page information
    this.infos = [
      'LNG_PAGE_LIST_CASES_NOT_A_CASE_INFO_LABEL'
    ];
  }

  /**
   * Initialize advanced filters
   */
  protected initializeTableAdvancedFilters(): void {
    this.advancedFilters = CaseModel.generateAdvancedFilters({
      authUser: this.authUser,
      caseInvestigationTemplate: () => this.selectedOutbreak.caseInvestigationTemplate,
      options: {
        gender: (this.activatedRoute.snapshot.data.gender as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        occupation: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.occupation as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        risk: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.risk as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        classification: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        outcome: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.outcome as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        clusterLoad: (finished) => {
          this.clusterDataService
            .getResolveList(
              this.selectedOutbreak.id
            )
            .pipe(
              // handle error
              catchError((err) => {
                // show error
                this.toastV2Service.error(err);

                // not found
                finished(null);

                // send error down the road
                return throwError(err);
              }),

              // should be the last pipe
              takeUntil(this.destroyed$)
            )
            .subscribe((data) => {
              finished(data);
            });
        },
        pregnancy: (this.activatedRoute.snapshot.data.pregnancy as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        vaccine: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.vaccine as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        vaccineStatus: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.vaccineStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
        investigationStatus: (this.activatedRoute.snapshot.data.investigationStatus as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
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
        return CaseModel.canListPersonsWithoutRelationships(this.authUser) ||
          CaseModel.canListOnsetBeforePrimaryReport(this.authUser) ||
          CaseModel.canListLongPeriodBetweenOnsetDatesReport(this.authUser) ||
          CaseModel.canExport(this.authUser) ||
          CaseModel.canImport(this.authUser) ||
          CaseModel.canExportInvestigationForm(this.authUser) ||
          CaseModel.canExportRelationships(this.authUser);
      },
      menuOptions: [
        // No relationships
        {
          label: {
            get: () => 'LNG_PAGE_LIST_CASES_ACTION_NO_RELATIONSHIPS_BUTTON'
          },
          action: this.redirectService.linkAndQueryParams(
            ['/cases'],
            {
              applyListFilter: Constants.APPLY_LIST_FILTER.CASES_WITHOUT_RELATIONSHIPS
            }
          ),
          visible: (): boolean => {
            return CaseModel.canListPersonsWithoutRelationships(this.authUser) &&
              this.appliedListFilter !== Constants.APPLY_LIST_FILTER.CASES_WITHOUT_RELATIONSHIPS;
          }
        },

        // Divider
        {
          visible: (): boolean => {
            return CaseModel.canListPersonsWithoutRelationships(this.authUser) &&
              this.appliedListFilter !== Constants.APPLY_LIST_FILTER.CASES_WITHOUT_RELATIONSHIPS;
          }
        },

        // Onset report
        {
          label: {
            get: () => 'LNG_PAGE_LIST_CASES_ONSET_REPORT_BUTTON'
          },
          action: {
            link: () => ['/relationships/date-onset']
          },
          visible: (): boolean => {
            return CaseModel.canListOnsetBeforePrimaryReport(this.authUser);
          }
        },

        // Cases long period report
        {
          label: {
            get: () => 'LNG_PAGE_LIST_CASES_LONG_PERIOD_REPORT_BUTTON'
          },
          action: {
            link: () => ['/relationships/long-period']
          },
          visible: (): boolean => {
            return CaseModel.canListLongPeriodBetweenOnsetDatesReport(this.authUser);
          }
        },

        // Divider
        {
          visible: (): boolean => {
            return CaseModel.canListOnsetBeforePrimaryReport(this.authUser) ||
              CaseModel.canListLongPeriodBetweenOnsetDatesReport(this.authUser);
          }
        },

        // Export cases
        {
          label: {
            get: () => 'LNG_PAGE_LIST_CASES_EXPORT_BUTTON'
          },
          action: {
            click: () => {
              this.exportCases(this.queryBuilder);
            }
          },
          visible: (): boolean => {
            return CaseModel.canExport(this.authUser);
          }
        },

        // Import cases
        {
          label: {
            get: () => 'LNG_PAGE_LIST_CASES_IMPORT_BUTTON'
          },
          action: {
            link: () => ['/import-export-data', 'case-data', 'import']
          },
          visible: (): boolean => {
            return this.selectedOutbreakIsActive &&
              CaseModel.canImport(this.authUser);
          }
        },

        // Divider
        {
          visible: (): boolean => {
            return CaseModel.canExport(this.authUser) ||
              CaseModel.canImport(this.authUser);
          }
        },

        // Empty case investigation form
        {
          label: {
            get: () => 'LNG_PAGE_LIST_CASES_ACTION_EXPORT_EMPTY_CASE_INVESTIGATION_FORMS'
          },
          action: {
            click: () => {
              this.dialogV2Service.showExportData({
                title: {
                  get: () => 'LNG_PAGE_LIST_CASES_EXPORT_EMPTY_CASE_INVESTIGATION_FORMS_TITLE'
                },
                export: {
                  url: `outbreaks/${this.selectedOutbreak.id}/cases/export-investigation-template`,
                  async: false,
                  method: ExportDataMethod.GET,
                  fileName: `${this.i18nService.instant('LNG_PAGE_LIST_CASES_TITLE')} - ${moment().format('YYYY-MM-DD')}`,
                  allow: {
                    types: [
                      ExportDataExtension.ZIP
                    ]
                  },
                  inputs: {
                    append: [
                      {
                        type: V2SideDialogConfigInputType.NUMBER,
                        placeholder: 'LNG_PAGE_LIST_CASES_EXPORT_EMPTY_CASE_INVESTIGATION_FORMS_FIELD_COPIES',
                        name: 'copies',
                        value: 5,
                        validators: {
                          required: () => true
                        }
                      }
                    ]
                  }
                }
              });
            }
          },
          visible: (): boolean => {
            return CaseModel.canExportEmptyInvestigationForms(this.authUser);
          }
        },

        // Export relationships
        {
          label: {
            get: () => 'LNG_PAGE_LIST_CASES_ACTION_EXPORT_CASES_RELATIONSHIPS'
          },
          action: {
            click: () => {
              // construct filter by case query builder
              const qb = new RequestQueryBuilder();

              // retrieve only relationships that have at least one persons as desired type
              qb.filter.byEquality(
                'persons.type',
                EntityType.CASE
              );

              // merge out query builder
              const personsQb = qb.addChildQueryBuilder('person');
              personsQb.merge(this.queryBuilder);

              // remove pagination
              personsQb.paginator.clear();

              // attach condition only if not empty
              if (!personsQb.filter.isEmpty()) {
                // filter only cases
                personsQb.filter.byEquality(
                  'type',
                  EntityType.CASE
                );
              }

              // export case relationships
              this.exportCaseRelationships(qb);
            }
          },
          visible: (): boolean => {
            return CaseModel.canExportRelationships(this.authUser);
          }
        },

        // Import relationships
        {
          label: {
            get: () => 'LNG_PAGE_LIST_CASES_ACTION_IMPORT_CASES_RELATIONSHIPS'
          },
          action: {
            link: () => ['/import-export-data', 'relationships', 'import'],
            linkQueryParams: (): Params => {
              return {
                from: Constants.APP_PAGE.CASES.value
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
      visible: () => CaseModel.canExport(this.authUser) ||
        CaseModel.canExportDossier(this.authUser) ||
        CaseModel.canExportRelationships(this.authUser),
      actions: [
        {
          label: {
            get: () => 'LNG_PAGE_LIST_CASES_GROUP_ACTION_EXPORT_SELECTED_CASES'
          },
          action: {
            click: (selected: string[]) => {
              // construct query builder
              const qb = new RequestQueryBuilder();
              qb.filter.bySelect(
                'id',
                selected,
                true,
                null
              );

              // allow deleted records
              qb.includeDeleted();

              // keep sort order
              if (!this.queryBuilder.sort.isEmpty()) {
                qb.sort.criterias = {
                  ...this.queryBuilder.sort.criterias
                };
              }

              // export
              this.exportCases(qb);
            }
          },
          visible: (): boolean => {
            return CaseModel.canExport(this.authUser);
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
          }
        }, {
          label: {
            get: () => 'LNG_PAGE_LIST_CASES_GROUP_ACTION_EXPORT_SELECTED_CASES_DOSSIER'
          },
          action: {
            click: (selected: string[]) => {
              // remove id from list
              const anonymizeFields = this.caseFields.filter((item) => {
                return item.value !== 'id';
              });

              // export dossier
              this.dialogV2Service.showExportData({
                title: {
                  get: () => 'LNG_PAGE_LIST_CASES_GROUP_ACTION_EXPORT_SELECTED_CASES_DOSSIER_DIALOG_TITLE'
                },
                export: {
                  url: `outbreaks/${this.selectedOutbreak.id}/cases/dossier`,
                  async: false,
                  method: ExportDataMethod.POST,
                  fileName: `${this.i18nService.instant('LNG_PAGE_LIST_CASES_TITLE')} - ${moment().format('YYYY-MM-DD HH:mm')}`,
                  extraFormData: {
                    append: {
                      cases: selected
                    }
                  },
                  allow: {
                    types: [
                      ExportDataExtension.ZIP
                    ],
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
            return CaseModel.canExportDossier(this.authUser);
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
          }
        }, {
          label: {
            get: () => 'LNG_PAGE_LIST_CASES_GROUP_ACTION_EXPORT_SELECTED_CASES_RELATIONSHIPS'
          },
          action: {
            click: (selected: string[]) => {
              // construct query builder
              const qb = new RequestQueryBuilder();
              const personsQb = qb.addChildQueryBuilder('person');

              // retrieve only relationships that have at least one persons as desired type
              qb.filter.byEquality(
                'persons.type',
                EntityType.CASE
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
                EntityType.CASE
              );

              // export case relationships
              this.exportCaseRelationships(qb);
            }
          },
          visible: (): boolean => {
            return CaseModel.canExportRelationships(this.authUser);
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
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
        link: (): string[] => ['/cases', 'create']
      },
      visible: (): boolean => {
        return CaseModel.canCreate(this.authUser) &&
          this.selectedOutbreakIsActive;
      }
    };
  }

  /**
   * Initialize grouped data
   */
  protected initializeGroupedData(): void {
    this.groupedData = {
      label: 'LNG_PAGE_LIST_CASES_ACTION_SHOW_GROUP_BY_CLASSIFICATION_PILLS',
      click: (
        item,
        group
      ) => {
        // no need to refresh group
        group.data.blockNextGet = true;

        // remove previous conditions
        this.queryBuilder.filter.removePathCondition('classification');
        this.queryBuilder.filter.removePathCondition('or.classification');

        // filter by group data
        if (!item) {
          this.queryBuilder.filter.byEquality(
            'classification',
            null
          );
        } else if (item.label === 'LNG_REFERENCE_DATA_CATEGORY_CASE_CLASSIFICATION_UNCLASSIFIED') {
          // clear
          this.queryBuilder.filter.byNotHavingValue('classification');
        } else {
          // search
          this.queryBuilder.filter.byEquality(
            'classification',
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

          // remove any classification filters so we see all options
          clonedQueryBuilder.filter.remove('classification');
          clonedQueryBuilder.filter.removePathCondition('or.classification');

          // load data
          return this.caseDataService
            .getCasesGroupedByClassification(
              this.selectedOutbreak.id,
              clonedQueryBuilder
            )
            .pipe(
              // should be the last pipe
              takeUntil(this.destroyed$)
            )
            .subscribe((countResponse) => {
              // group data
              const classification = this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>;
              let values: {
                label: string,
                value: number,
                color?: string,
                order?: any
              }[] = [];
              Object.keys(countResponse.classification || {}).forEach((classificationId) => {
                values.push({
                  label: classificationId,
                  value: countResponse.classification[classificationId].count,
                  color: classification.map[classificationId] ? classification.map[classificationId].getColorCode() : Constants.DEFAULT_COLOR_REF_DATA,
                  order: classification.map[classificationId]?.order !== undefined ?
                    classification.map[classificationId].order :
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
   * Export case data
   */
  private exportCases(qb: RequestQueryBuilder): void {
    this.dialogV2Service
      .showExportDataAfterLoadingData({
        title: {
          get: () => 'LNG_PAGE_LIST_CASES_EXPORT_TITLE'
        },
        load: (finished) => {
          // retrieve the list of export fields groups for model
          this.outbreakDataService
            .getExportFieldsGroups(ExportFieldsGroupModelNameEnum.CASE)
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
              const caseFieldGroups: ILabelValuePairModel[] = fieldsGroupList.options.map((item) => ({
                label: item.name,
                value: item.name
              }));

              // group restrictions
              const caseFieldGroupsRequires: IV2ExportDataConfigGroupsRequired = fieldsGroupList.toRequiredList();

              // show export
              finished({
                title: {
                  get: () => 'LNG_PAGE_LIST_CASES_EXPORT_TITLE'
                },
                export: {
                  url: `/outbreaks/${this.selectedOutbreak.id}/cases/export`,
                  async: true,
                  method: ExportDataMethod.POST,
                  fileName: `${this.i18nService.instant('LNG_PAGE_LIST_CASES_TITLE')} - ${moment().format('YYYY-MM-DD HH:mm')}`,
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
                      fields: this.caseFields
                    },
                    groups: {
                      fields: caseFieldGroups,
                      required: caseFieldGroupsRequires
                    },
                    fields: {
                      options: this.caseFields
                    },
                    dbColumns: true,
                    dbValues: true,
                    jsonReplaceUndefinedWithNull: true,
                    questionnaireVariables: true
                  },
                  inputs: {
                    append: [
                      {
                        type: V2SideDialogConfigInputType.CHECKBOX,
                        placeholder: 'LNG_PAGE_LIST_CASES_EXPORT_CONTACT_INFORMATION',
                        tooltip: 'LNG_PAGE_LIST_CASES_EXPORT_CONTACT_INFORMATION_DESCRIPTION',
                        name: 'includeContactFields',
                        checked: false
                      },
                      {
                        type: V2SideDialogConfigInputType.CHECKBOX,
                        placeholder: 'LNG_PAGE_LIST_CASES_EXPORT_CONTACT_OF_CONTACT_INFORMATION',
                        tooltip: 'LNG_PAGE_LIST_CASES_EXPORT_CONTACT_OF_CONTACT_INFORMATION_DESCRIPTION',
                        name: 'includeContactOfContactFields',
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
   * Export case relationships
   */
  private exportCaseRelationships(qb: RequestQueryBuilder): void {
    this.dialogV2Service
      .showExportDataAfterLoadingData({
        title: {
          get: () => 'LNG_PAGE_LIST_CASES_EXPORT_RELATIONSHIPS_TITLE'
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
                  get: () => 'LNG_PAGE_LIST_CASES_EXPORT_RELATIONSHIPS_TITLE'
                },
                export: {
                  url: `/outbreaks/${this.selectedOutbreak.id}/relationships/export`,
                  async: true,
                  method: ExportDataMethod.POST,
                  fileName: `${this.i18nService.instant('LNG_PAGE_LIST_CASES_EXPORT_RELATIONSHIP_FILE_NAME')} - ${moment().format('YYYY-MM-DD')}`,
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
   * Classification conditions
   */
  private addClassificationConditions() {
    // create classification condition
    const trueCondition = { classification: { eq: Constants.CASE_CLASSIFICATION.NOT_A_CASE } };
    const falseCondition = { classification: { neq: Constants.CASE_CLASSIFICATION.NOT_A_CASE } };

    // remove existing filter
    this.queryBuilder.filter.removeExactCondition(trueCondition);
    this.queryBuilder.filter.removeExactCondition(falseCondition);

    // check if we are searching by not a case classification
    let notACaseFilter = this.notACaseFilter;
    if (_.isEqual(
      this.queryBuilder.filter.get('classification'),
      {
        classification: Constants.CASE_CLASSIFICATION.NOT_A_CASE
      }
    )) {
      notACaseFilter = true;
    }

    // filter by classification
    if (notACaseFilter === true) {
      // show cases that are NOT classified as Not a Case
      this.queryBuilder.filter.where(trueCondition);
    } else if (notACaseFilter === false) {
      // show cases classified as Not a Case
      this.queryBuilder.filter.where(falseCondition);
    }
  }

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs(): void {
    // determine if cases page should be linkable
    let casesAction: IV2BreadcrumbAction = null;

    // if we have an applied filter then we need to add breadcrumb
    if (this.appliedListFilter === ApplyListFilter.CASES_WITHOUT_RELATIONSHIPS) {
      // since we need to send user to the same page we need to do some hacks...
      const redirect = this.redirectService.linkAndQueryParams(
        ['/cases']
      );
      casesAction = {
        link: redirect.link(),
        linkQueryParams: redirect.linkQueryParams()
      };
    }

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
        label: 'LNG_PAGE_LIST_CASES_TITLE',
        action: casesAction
      }
    ];

    // if we have an applied filter then we need to add breadcrumb
    if (this.appliedListFilter === ApplyListFilter.CASES_WITHOUT_RELATIONSHIPS) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_DASHBOARD_CASES_WITHOUT_RELATIONSHIPS',
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
      'lastName',
      'firstName',
      'middleName',
      'visualId',
      'classification',
      'riskLevel',
      'riskReason',
      'occupation',
      'investigationStatus',
      'dateInvestigationCompleted',
      'outcomeId',
      'dateOfOutcome',
      'deathLocationId',
      'age',
      'gender',
      'addresses',
      'dateOfOnset',
      'dateOfReporting',
      'dateOfBurial',
      'burialLocationId',
      'burialPlaceName',
      'wasContact',
      'wasContactOfContact',
      'responsibleUserId',
      'numberOfContacts',
      'numberOfExposures',
      'questionnaireAnswers',
      'deleted',
      'createdBy',
      'createdAt',
      'updatedBy',
      'updatedAt'
    ];
  }

  /**
   * Re(load) the Cases list, based on the applied filter, sort criterias
   */
  refreshList(triggeredByPageChange: boolean) {
    // classification conditions - not really necessary since refreshListCount is always called before this one
    this.addClassificationConditions();

    // retrieve created user & modified user information
    this.queryBuilder.include('createdByUser', true);
    this.queryBuilder.include('updatedByUser', true);

    // retrieve responsible user information
    this.queryBuilder.include('responsibleUser', true);

    // refresh badges list with applied filter
    if (!triggeredByPageChange) {
      this.initializeGroupedData();
    }

    // retrieve the list of Cases
    this.records$ = this.caseDataService
      .getCasesList(this.selectedOutbreak.id, this.queryBuilder)
      .pipe(
        switchMap((data) => {
          // determine locations that we need to retrieve
          const locationsIdsMap: {
            [locationId: string]: true
          } = {};
          data.forEach((item) => {
            // addresses
            (item.addresses || []).forEach((address) => {
              // nothing to add ?
              if (!address?.locationId) {
                return;
              }

              // add location to list
              locationsIdsMap[address.locationId] = true;
            });

            // death location
            if (item.deathLocationId) {
              locationsIdsMap[item.deathLocationId] = true;
            }

            // burial location
            if (item.burialLocationId) {
              locationsIdsMap[item.burialLocationId] = true;
            }
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
                  // addresses
                  (item.addresses || []).forEach((address) => {
                    address.location = address.locationId && locationsMap[address.locationId] ?
                      locationsMap[address.locationId] :
                      address.location;
                  });

                  // death location
                  item.deathLocation = item.deathLocationId && locationsMap[item.deathLocationId] ?
                    locationsMap[item.deathLocationId] :
                    item.deathLocation;

                  // burial location
                  item.burialLocation = item.burialLocationId && locationsMap[item.burialLocationId] ?
                    locationsMap[item.burialLocationId] :
                    item.burialLocation;
                });

                // finished
                return data;
              })
            );
        })
      )
      .pipe(
        // process data
        map((cases: CaseModel[]) => {
          return EntityModel.determineAlertness<CaseModel>(
            this.selectedOutbreak.caseInvestigationTemplate,
            cases
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

    // classification conditions
    this.addClassificationConditions();

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
    this.caseDataService
      .getCasesCount(this.selectedOutbreak.id, countQueryBuilder)
      .pipe(
        // error
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
