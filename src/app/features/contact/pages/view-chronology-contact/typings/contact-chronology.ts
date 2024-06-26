import { ContactModel, IFollowUpHistory } from '../../../../../core/models/contact.model';
import { FollowUpModel } from '../../../../../core/models/follow-up.model';
import { ChronologyItem } from '../../../../../shared/components/chronology/typings/chronology-item';
import * as _ from 'lodash';
import { Constants } from '../../../../../core/models/constants';
import { RelationshipModel } from '../../../../../core/models/entity-and-relationship.model';
import { CaseModel } from '../../../../../core/models/case.model';
import { EventModel } from '../../../../../core/models/event.model';
import { I18nService } from '../../../../../core/services/helper/i18n.service';
import { LabResultModel } from '../../../../../core/models/lab-result.model';

export class ContactChronology {
  static getChronologyEntries(
    i18nService: I18nService,
    contactData: ContactModel,
    followUps: FollowUpModel[],
    relationshipsData?: RelationshipModel[],
    labResults?: LabResultModel[]
  ): ChronologyItem[] {
    const chronologyEntries: ChronologyItem [] = [];
    const sourcePersons = [];

    // create function that return all source persons for every relationship
    const getSourcePersons = (_contactDataId: string,
      relationships: RelationshipModel[]) => {
      _.forEach(relationships, (relationship) => {
        _.forEach(relationship.people, (people) => {
          if (people.model.id === relationship.sourcePerson.id) {
            sourcePersons.push(people.model);
          }
        });
      });
      return sourcePersons;
    };

    // retrieve source persons
    if (!_.isEmpty(relationshipsData)) {
      getSourcePersons(contactData.id, relationshipsData);
    }

    // displaying the exposure dates for each relationship
    if (
      !_.isEmpty(sourcePersons) &&
            !_.isEmpty(relationshipsData)
    ) {
      const sourcePersonsMap: {
        [id: string]: CaseModel | ContactModel | EventModel
      } = _.transform(
        sourcePersons,
        (a, m) => {
          a[m.id] = m;
        },
        {}
      );

      relationshipsData.forEach((relationship) => {
        if (relationship.sourcePerson.id !== contactData.id) {
          const sourcePerson = sourcePersonsMap[relationship.sourcePerson.id];

          // create chronology entries with exposure dates
          chronologyEntries.push(new ChronologyItem({
            date: relationship.contactDate,
            label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_EXPOSURE',
            translateData: { exposureName: sourcePerson ? sourcePerson.name : '' }
          }));
        }
      });
    }

    // build chronology items from followUp
    _.forEach(followUps, (followUp: FollowUpModel) => {
      if (!_.isEmpty(followUp.date)) {
        chronologyEntries.push(new ChronologyItem({
          date: followUp.date,
          label: followUp.statusId,
          type: Constants.CHRONOLOGY_ITEM_TYPE.FOLLOW_UP
        }));
      }
    });

    // isolation dates
    if (!_.isEmpty(labResults)) {
      _.forEach(labResults, (labResult) => {
        if (!_.isEmpty(labResult.dateOfResult)) {
          chronologyEntries.push(new ChronologyItem({
            date: labResult.dateOfResult,
            label: 'LNG_PAGE_VIEW_CHRONOLOGY_CONTACT_LABEL_LAB_RESULT_DATE'
          }));
        }
      });
    }

    // followup history
    if (!_.isEmpty(contactData.followUpHistory)) {
      _.each(
        contactData.followUpHistory, (
          followUpHistory: IFollowUpHistory
        ) => {
          const translateData = {
            status: followUpHistory.status ?
              i18nService.instant(followUpHistory.status) :
              '—'
          };
          if (!_.isEmpty(followUpHistory.startDate)) {
            chronologyEntries.push(new ChronologyItem({
              date: followUpHistory.startDate,
              label: 'LNG_PAGE_VIEW_CHRONOLOGY_CONTACT_LABEL_FOLLOW_UP_HISTORY_START_DATE',
              translateData: translateData
            }));
          }
          if (!_.isEmpty(followUpHistory.endDate)) {
            chronologyEntries.push(new ChronologyItem({
              date: followUpHistory.endDate,
              label: 'LNG_PAGE_VIEW_CHRONOLOGY_CONTACT_LABEL_FOLLOW_UP_HISTORY_END_DATE',
              translateData: translateData
            }));
          }
        });
    }

    // date of onset
    if (!_.isEmpty(contactData.dateOfReporting)) {
      chronologyEntries.push(new ChronologyItem({
        date: contactData.dateOfReporting,
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING'
      }));
    }

    // date become contact
    if (!_.isEmpty(contactData.dateBecomeContact)) {
      chronologyEntries.push(new ChronologyItem({
        date: contactData.dateBecomeContact,
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_BECOME_CONTACT'
      }));
    }

    // follow-up start date
    if (!_.isEmpty(contactData.followUp.startDate)) {
      chronologyEntries.push(new ChronologyItem({
        date: contactData.followUp.startDate,
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_START_OF_FOLLOWUP'
      }));
    }

    // follow-up end date
    if (!_.isEmpty(contactData.followUp.endDate)) {
      chronologyEntries.push(new ChronologyItem({
        date: contactData.followUp.endDate,
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_END_OF_FOLLOWUP'
      }));
    }

    if (!_.isEmpty(contactData.dateOfLastContact)) {
      chronologyEntries.push(new ChronologyItem({
        date: contactData.dateOfLastContact,
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT'
      }));
    }

    return chronologyEntries;
  }
}
