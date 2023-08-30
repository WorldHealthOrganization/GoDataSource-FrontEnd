import { Injectable } from '@angular/core';
import { IVisibleMandatoryDataGroup } from '../../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';
import { CaseModel } from '../../models/case.model';
import { EventModel } from '../../models/event.model';
import { ContactModel } from '../../models/contact.model';
import { ContactOfContactModel } from '../../models/contact-of-contact.model';
import { FollowUpModel } from '../../models/follow-up.model';
import { LabResultModel } from '../../models/lab-result.model';
import { RelationshipModel } from '../../models/entity-and-relationship.model';
import { OutbreakModel } from '../../models/outbreak.model';
import { OutbreakTemplateModel } from '../../models/outbreak-template.model';
import { ICreateViewModifyV2TabInputValidatorRequired } from '../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { ILabelValuePairModel } from '../../../shared/forms-v2/core/label-value-pair.model';
import { UserModel } from '../../models/user.model';
import { AuthDataService } from '../data/auth.data.service';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { PersonAndRelatedHelperService } from './person-and-related-helper.service';

@Injectable({
  providedIn: 'root'
})
export class OutbreakAndOutbreakTemplateHelperService {
  // data
  private _authUser: UserModel;

  /**
   * Constructor
   */
  constructor(
    private authDataService: AuthDataService,
    private personAndRelatedHelperService: PersonAndRelatedHelperService
  ) {
    // get the authenticated user
    this._authUser = this.authDataService.getAuthenticatedUser();
  }

  /**
   * Generate visible and mandatory fields
   */
  generateVisibleMandatoryOptions(): IVisibleMandatoryDataGroup[] {
    return [
      // cases
      {
        id: this.personAndRelatedHelperService.case.visibleMandatoryKey,
        label: 'LNG_PAGE_LIST_CASES_TITLE',
        children: this.personAndRelatedHelperService.createViewModify.tabsToGroupTabs([
          this.personAndRelatedHelperService.case.generateTabsPersonal(undefined, {
            selectedOutbreak: new OutbreakModel(),
            isCreate: true,
            itemData: new CaseModel(),
            checkForPersonExistence: () => {},
            caseVisualIDMask: undefined,
            options: {
              gender: [],
              pregnancy: [],
              occupation: [],
              user: [],
              documentType: [],
              addressType: []
            }
          }),
          this.personAndRelatedHelperService.case.generateTabsEpidemiology(undefined, {
            selectedOutbreak: new OutbreakModel(),
            isCreate: true,
            itemData: new CaseModel(),
            checkForOnsetAfterReporting: () => {},
            checkForOnsetAfterHospitalizationStartDate: () => {},
            options: {
              classification: [],
              investigationStatus: [],
              outcome: [],
              risk: [],
              vaccine: [],
              vaccineStatus: [],
              dateRangeType: [],
              dateRangeCenter: []
            }
          })
        ])
      },

      // events
      {
        id: this.personAndRelatedHelperService.event.visibleMandatoryKey,
        label: 'LNG_PAGE_LIST_EVENTS_TITLE',
        children: this.personAndRelatedHelperService.createViewModify.tabsToGroupTabs([
          this.personAndRelatedHelperService.event.generateTabsDetails(undefined, {
            selectedOutbreak: new OutbreakModel(),
            isCreate: true,
            itemData: new EventModel(),
            eventVisualIDMask: undefined,
            options: {
              user: [],
              eventCategory: [],
              addressType: []
            }
          })
        ])
      },

      // contacts
      {
        id: this.personAndRelatedHelperService.contact.visibleMandatoryKey,
        label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
        children: this.personAndRelatedHelperService.createViewModify.tabsToGroupTabs([
          this.personAndRelatedHelperService.contact.generateTabsPersonal(undefined, {
            selectedOutbreak: new OutbreakModel(),
            isCreate: true,
            itemData: new ContactModel(),
            checkForPersonExistence: () => {},
            detectChanges: () => {},
            contactVisualIDMask: undefined,
            parentEntity: undefined,
            options: {
              gender: [],
              pregnancy: [],
              occupation: [],
              user: [],
              documentType: [],
              addressType: []
            }
          }),
          this.personAndRelatedHelperService.contact.generateTabsEpidemiology(undefined, {
            isCreate: true,
            itemData: new ContactModel(),
            options: {
              outcome: [],
              risk: [],
              team: [],
              followUpStatus: [],
              vaccine: [],
              vaccineStatus: []
            }
          })
        ])
      },

      // contact of contacts
      {
        id: this.personAndRelatedHelperService.contactOfContact.visibleMandatoryKey,
        label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
        children: this.personAndRelatedHelperService.createViewModify.tabsToGroupTabs([
          this.personAndRelatedHelperService.contactOfContact.generateTabsPersonal(undefined, {
            selectedOutbreak: new OutbreakModel(),
            isCreate: true,
            itemData: new ContactOfContactModel(),
            checkForPersonExistence: () => {},
            detectChanges: () => {},
            cocVisualIDMask: undefined,
            parentEntity: undefined,
            options: {
              gender: [],
              pregnancy: [],
              occupation: [],
              user: [],
              documentType: [],
              addressType: []
            }
          }),
          this.personAndRelatedHelperService.contactOfContact.generateTabsEpidemiology(undefined, {
            isCreate: true,
            itemData: new ContactOfContactModel(),
            options: {
              risk: [],
              vaccine: [],
              vaccineStatus: []
            }
          })
        ])
      },

      // follow-ups
      {
        id: this.personAndRelatedHelperService.followUp.visibleMandatoryKey,
        label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOW_UP',
        children: this.personAndRelatedHelperService.createViewModify.tabsToGroupTabs([
          this.personAndRelatedHelperService.followUp.generateTabsPersonal(undefined, {
            isCreate: true,
            isModify: false,
            itemData: new FollowUpModel(),
            entityData: undefined,
            options: {
              dailyFollowUpStatus: [],
              user: [],
              team: [],
              addressType: []
            }
          })
        ])
      },

      // lab results
      {
        id: this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
        label: 'LNG_PAGE_LIST_LAB_RESULTS_TITLE',
        children: this.personAndRelatedHelperService.createViewModify.tabsToGroupTabs([
          this.personAndRelatedHelperService.labResult.generateTabsDetails(undefined, {
            isCreate: true,
            itemData: new LabResultModel(),
            options: {
              labName: [],
              labSampleType: [],
              labTestType: [],
              labTestResult: [],
              labResultProgress: [],
              labSequenceLaboratory: [],
              labSequenceResult: []
            }
          })
        ])
      },

      // relationships
      {
        id: this.personAndRelatedHelperService.relationship.visibleMandatoryKey,
        label: 'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_TITLE',
        children: this.personAndRelatedHelperService.createViewModify.tabsToGroupTabs([
          this.personAndRelatedHelperService.relationship.generateTabsDetails(undefined, {
            entityId: 'LNG_COMMON_MODEL_FIELD_LABEL_ID',
            tabName: 'details',
            tabLabel: 'LNG_COMMON_LABEL_DETAILS',
            tabVisible: () => true,
            inputName: (property) => property,
            itemData: new RelationshipModel(),
            createCopySuffixButtons: () => undefined,
            checkForLastContactBeforeCaseOnSet: () => {},
            options: {
              certaintyLevel: [],
              exposureType: [],
              exposureFrequency: [],
              exposureDuration: [],
              contextOfTransmission: [],
              cluster: []
            }
          })
        ])
      }
    ];
  }

  /**
   * Merge missing visible / mandatory fields
   */
  mergeDefaultVisibleMandatoryFields(item: OutbreakModel | OutbreakTemplateModel): void {
    // nothing to do ?
    if (!item) {
      return;
    }

    // nothing initialized ?
    if (!item.visibleAndMandatoryFields) {
      item.visibleAndMandatoryFields = {};
    }

    // determine groups and fields that we need to initialize
    const options: IVisibleMandatoryDataGroup[] = this.generateVisibleMandatoryOptions();
    options.forEach((group) => {
      // this group exists already ?
      if (
        item.visibleAndMandatoryFields[group.id] &&
        Object.keys(item.visibleAndMandatoryFields[group.id]).length > 0
      ) {
        // set default missing fields that could've been changed in future versions
        group.children.forEach((tab) => {
          tab.children.forEach((section) => {
            section.children.forEach((field) => {
              // field not visible by default
              if (
                !field.visibleMandatoryConf?.visible ||
                item.visibleAndMandatoryFields[group.id][field.id]?.visible
              ) {
                return;
              }

              // make field visible if necessary
              item.visibleAndMandatoryFields[group.id][field.id] = {
                visible: true,
                // if method exists is enough, no need to execute, otherwise some might not return required because we sent an empty model when we generate groups, and some required might depend on db data
                mandatory: !!(field.definition as ICreateViewModifyV2TabInputValidatorRequired).validators?.required || !!field.visibleMandatoryConf?.required
              };
            });
          });
        });

        // finished
        return;
      }

      // add all fields
      item.visibleAndMandatoryFields[group.id] = {};

      // go through fields
      group.children.forEach((tab) => {
        tab.children.forEach((section) => {
          section.children.forEach((field) => {
            item.visibleAndMandatoryFields[group.id][field.id] = {
              visible: true,
              // if method exists is enough, no need to execute, otherwise some might not return required because we sent an empty model when we generate groups, and some required might depend on db data
              mandatory: !!(field.definition as ICreateViewModifyV2TabInputValidatorRequired).validators?.required || !!field.visibleMandatoryConf?.required
            };
          });
        });
      });
    });
  }

  /**
   * Advanced filters - Outbreak
   */
  generateOutbreakAdvancedFilters(data: {
    options: {
      disease: ILabelValuePairModel[],
      country: ILabelValuePairModel[],
      geographicalLevel: ILabelValuePairModel[],
      followUpGenerationTeamAssignmentAlgorithm: ILabelValuePairModel[],
      yesNoAll: ILabelValuePairModel[],
      yesNo: ILabelValuePairModel[],
      user: ILabelValuePairModel[]
    }
  }): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilter[] = [
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'name',
        label: 'LNG_OUTBREAK_FIELD_LABEL_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'disease',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DISEASE',
        options: data.options.disease,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'checkLastContactDateAgainstDateOnSet',
        label: 'LNG_OUTBREAK_FIELD_LABEL_CHECK_LAST_CONTACT_DATE_AGAINST_DATE_OF_ONSET',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'disableModifyingLegacyQuestionnaire',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DISABLE_MODIFYING_LEGACY_QUESTIONNAIRE',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'countries.id',
        label: 'LNG_OUTBREAK_FIELD_LABEL_COUNTRIES',
        options: data.options.country,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'reportingGeographicalLevelId',
        label: 'LNG_OUTBREAK_FIELD_LABEL_LOCATION_GEOGRAPHICAL_LEVEL',
        options: data.options.geographicalLevel,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'startDate',
        label: 'LNG_OUTBREAK_FIELD_LABEL_START_DATE',
        sortable: true,
        havingNotHavingApplyMongo: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'endDate',
        label: 'LNG_OUTBREAK_FIELD_LABEL_END_DATE',
        sortable: true,
        havingNotHavingApplyMongo: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'generateFollowUpsTeamAssignmentAlgorithm',
        label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM',
        options: data.options.followUpGenerationTeamAssignmentAlgorithm,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'generateFollowUpsOverwriteExisting',
        label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_OVERWRITE_EXISTING',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'generateFollowUpsKeepTeamAssignment',
        label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_KEEP_TEAM_ASSIGNMENT',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'isContactLabResultsActive',
        label: 'LNG_OUTBREAK_FIELD_LABEL_IS_CONTACT_LAB_RESULTS_ACTIVE',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'isDateOfOnsetRequired',
        label: 'LNG_OUTBREAK_FIELD_LABEL_IS_CASE_DATE_OF_ONSET_REQUIRED',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'generateFollowUpsDateOfLastContact',
        label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_DATE_OF_LAST_CONTACT',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'generateFollowUpsWhenCreatingContacts',
        label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_GENERATION_WHEN_CREATING_CONTACTS',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.LOCATION_MULTIPLE,
        field: 'locationIds',
        label: 'LNG_OUTBREAK_FIELD_LABEL_LOCATIONS'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'description',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DESCRIPTION',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'eventIdMask',
        label: 'LNG_OUTBREAK_FIELD_LABEL_EVENT_ID_MASK',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'caseIdMask',
        label: 'LNG_OUTBREAK_FIELD_LABEL_CASE_ID_MASK',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'contactIdMask',
        label: 'LNG_OUTBREAK_FIELD_LABEL_CONTACT_ID_MASK',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'contactOfContactIdMask',
        label: 'LNG_OUTBREAK_FIELD_LABEL_CONTACT_OF_CONTACT_ID_MASK',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'applyGeographicRestrictions',
        label: 'LNG_OUTBREAK_FIELD_LABEL_APPLY_GEOGRAPHIC_RESTRICTIONS',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'isContactsOfContactsActive',
        label: 'LNG_OUTBREAK_FIELD_LABEL_IS_CONTACT_OF_CONTACT_ACTIVE',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'periodOfFollowup',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DURATION_FOLLOWUP_DAYS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'frequencyOfFollowUpPerDay',
        label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOWUP_FRECQUENCY_PER_DAY',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'intervalOfFollowUp',
        label: 'LNG_OUTBREAK_FIELD_LABEL_INTERVAL_OF_FOLLOW_UPS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'noDaysAmongContacts',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DAYS_AMONG_KNOWN_CONTACTS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'noDaysInChains',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DAYS_IN_KNOWN_TRANSMISSION_CHAINS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'noDaysNotSeen',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DAYS_NOT_SEEN',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'noLessContacts',
        label: 'LNG_OUTBREAK_FIELD_LABEL_LESS_THAN_X_CONTACTS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'longPeriodsBetweenCaseOnset',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DAYS_LONG_PERIODS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'noDaysNewContacts',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DAYS_NEW_CONTACT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.DELETED,
        field: 'deleted',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DELETED',
        yesNoAllOptions: data.options.yesNoAll,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'createdAt',
        label: 'LNG_OUTBREAK_FIELD_LABEL_CREATED_AT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'updatedAt',
        label: 'LNG_OUTBREAK_FIELD_LABEL_UPDATED_AT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.DELETED_AT,
        field: 'deletedAt',
        label: 'LNG_OUTBREAK_FIELD_LABEL_DELETED_AT',
        sortable: true
      }
    ];

    // allowed to filter by user ?
    if (UserModel.canListForFilters(this._authUser)) {
      advancedFilters.push({
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'createdBy',
        label: 'LNG_OUTBREAK_FIELD_LABEL_CREATED_BY',
        options: data.options.user,
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'updatedBy',
        label: 'LNG_OUTBREAK_FIELD_LABEL_UPDATED_BY',
        options: data.options.user,
        sortable: true
      });
    }

    // finished
    return advancedFilters;
  }

  /**
   * Advanced filters - Outbreak Template
   */
  generateOutbreakTemplateAdvancedFilters(data: {
    options: {
      disease: ILabelValuePairModel[],
      followUpGenerationTeamAssignmentAlgorithm: ILabelValuePairModel[],
      yesNo: ILabelValuePairModel[],
      user: ILabelValuePairModel[]
    }
  }): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilter[] = [
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'name',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'description',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DESCRIPTION',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'disease',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DISEASE',
        options: data.options.disease,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'checkLastContactDateAgainstDateOnSet',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_CHECK_LAST_CONTACT_DATE_AGAINST_DATE_OF_ONSET',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'disableModifyingLegacyQuestionnaire',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DISABLE_MODIFYING_LEGACY_QUESTIONNAIRE',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'generateFollowUpsTeamAssignmentAlgorithm',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_TEAM_ASSIGNMENT_ALGORITHM',
        options: data.options.followUpGenerationTeamAssignmentAlgorithm,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'generateFollowUpsOverwriteExisting',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_OVERWRITE_EXISTING',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'generateFollowUpsKeepTeamAssignment',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_KEEP_TEAM_ASSIGNMENT',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'generateFollowUpsDateOfLastContact',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_DATE_OF_LAST_CONTACT',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'generateFollowUpsWhenCreatingContacts',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_GENERATION_WHEN_CREATING_CONTACTS',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'applyGeographicRestrictions',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_APPLY_GEOGRAPHIC_RESTRICTIONS',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'isContactLabResultsActive',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_IS_CONTACT_LAB_RESULTS_ACTIVE',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'isDateOfOnsetRequired',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_IS_CASE_DATE_OF_ONSET_REQUIRED',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'isContactsOfContactsActive',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_IS_CONTACT_OF_CONTACT_ACTIVE',
        options: data.options.yesNo,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'periodOfFollowup',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DURATION_FOLLOWUP_DAYS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'frequencyOfFollowUpPerDay',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_FOLLOWUP_FRECQUENCY_PER_DAY',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'intervalOfFollowUp',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_INTERVAL_OF_FOLLOW_UPS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'noDaysAmongContacts',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DAYS_AMONG_KNOWN_CONTACTS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'noDaysInChains',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DAYS_IN_KNOWN_TRANSMISSION_CHAINS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'noDaysNotSeen',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DAYS_NOT_SEEN',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'noLessContacts',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_LESS_THAN_X_CONTACTS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'longPeriodsBetweenCaseOnset',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DAYS_LONG_PERIODS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'noDaysNewContacts',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_DAYS_NEW_CONTACT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'createdAt',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_CREATED_AT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'updatedAt',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_UPDATED_AT',
        sortable: true
      }
    ];

    // allowed to filter by user ?
    if (UserModel.canListForFilters(this._authUser)) {
      advancedFilters.push({
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'createdBy',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_CREATED_BY',
        options: data.options.user,
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'updatedBy',
        label: 'LNG_OUTBREAK_TEMPLATE_FIELD_LABEL_UPDATED_BY',
        options: data.options.user,
        sortable: true
      });
    }

    // finished
    return advancedFilters;
  }
}
