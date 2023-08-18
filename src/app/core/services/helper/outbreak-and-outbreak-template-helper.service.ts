import { Injectable } from '@angular/core';
import { IVisibleMandatoryDataGroup } from '../../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';
import { CaseModel } from '../../models/case.model';
import { EventModel } from '../../models/event.model';
import { ContactModel } from '../../models/contact.model';
import { ContactOfContactModel } from '../../models/contact-of-contact.model';
import { FollowUpModel } from '../../models/follow-up.model';
import { LabResultModel } from '../../models/lab-result.model';
import { RelationshipModel } from '../../models/entity-and-relationship.model';
import { CreateViewModifyHelperService } from './create-view-modify-helper.service';
import { EntityCaseHelperService } from './entity-case-helper.service';
import { EntityEventHelperService } from './entity-event-helper.service';
import { EntityContactHelperService } from './entity-contact-helper.service';
import { EntityContactOfContactHelperService } from './entity-contact-of-contact-helper.service';
import { EntityFollowUpHelperService } from './entity-follow-up-helper.service';
import { EntityLabResultHelperService } from './entity-lab-result-helper.service';
import { EntityHelperService } from './entity-helper.service';
import { OutbreakModel } from '../../models/outbreak.model';
import { OutbreakTemplateModel } from '../../models/outbreak-template.model';

@Injectable({
  providedIn: 'root'
})
export class OutbreakAndOutbreakTemplateHelperService {
  /**
   * Constructor
   */
  constructor(
    private createViewModifyHelperService: CreateViewModifyHelperService,
    private entityCaseHelperService: EntityCaseHelperService,
    private entityEventHelperService: EntityEventHelperService,
    private entityContactHelperService: EntityContactHelperService,
    private entityContactOfContactHelperService: EntityContactOfContactHelperService,
    private entityFollowUpHelperService: EntityFollowUpHelperService,
    private entityLabResultHelperService: EntityLabResultHelperService,
    private entityHelperService: EntityHelperService
  ) {}

  /**
   * Generate visible and mandatory fields
   */
  generateVisibleMandatoryOptions(): IVisibleMandatoryDataGroup[] {
    return [
      // cases
      {
        id: 'cases',
        label: 'LNG_PAGE_LIST_CASES_TITLE',
        children: this.createViewModifyHelperService.tabsToGroupTabs([
          this.entityCaseHelperService.generateTabsPersonal({
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
          this.entityCaseHelperService.generateTabsEpidemiology({
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
        id: 'events',
        label: 'LNG_PAGE_LIST_EVENTS_TITLE',
        children: this.createViewModifyHelperService.tabsToGroupTabs([
          this.entityEventHelperService.generateTabsDetails({
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
        id: 'contacts',
        label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
        children: this.createViewModifyHelperService.tabsToGroupTabs([
          this.entityContactHelperService.generateTabsPersonal({
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
          this.entityContactHelperService.generateTabsEpidemiology({
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
        id: 'contacts-of-contacts',
        label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
        children: this.createViewModifyHelperService.tabsToGroupTabs([
          this.entityContactOfContactHelperService.generateTabsPersonal({
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
          this.entityContactOfContactHelperService.generateTabsEpidemiology({
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
        id: 'follow-ups',
        label: 'LNG_OUTBREAK_FIELD_LABEL_FOLLOW_UP',
        children: this.createViewModifyHelperService.tabsToGroupTabs([
          this.entityFollowUpHelperService.generateTabsPersonal({
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
        id: 'lab-results',
        label: 'LNG_PAGE_LIST_LAB_RESULTS_TITLE',
        children: this.createViewModifyHelperService.tabsToGroupTabs([
          this.entityLabResultHelperService.generateTabsDetails({
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
        id: 'relationships',
        label: 'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_TITLE',
        children: this.createViewModifyHelperService.tabsToGroupTabs([
          this.entityHelperService.generateTabsDetails({
            entityId: 'LNG_COMMON_MODEL_FIELD_LABEL_ID',
            title: 'LNG_COMMON_LABEL_DETAILS',
            name: (property) => property,
            itemData: new RelationshipModel(),
            createCopySuffixButtons: () => [],
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
  mergeDefaultVisibleMandatoryFields(_item: OutbreakModel | OutbreakTemplateModel): void {
    // console.log(item);
  }
}
