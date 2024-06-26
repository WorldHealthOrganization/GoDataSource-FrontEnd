import { ChronologyItem } from '../../../../../shared/components/chronology/typings/chronology-item';
import { RelationshipModel } from '../../../../../core/models/entity-and-relationship.model';
import * as _ from 'lodash';
import { CaseModel } from '../../../../../core/models/case.model';
import { ContactModel } from '../../../../../core/models/contact.model';
import { EventModel } from '../../../../../core/models/event.model';
import { ContactOfContactModel } from '../../../../../core/models/contact-of-contact.model';
import { FollowUpModel } from '../../../../../core/models/follow-up.model';
import { LabResultModel } from '../../../../../core/models/lab-result.model';
import { Constants } from '../../../../../core/models/constants';

export class ContactOfContactChronology {
  static getChronologyEntries(
    contactOfContactData: ContactOfContactModel,
    relationshipsData: RelationshipModel[],
    followUps: FollowUpModel[],
    labResults: LabResultModel[]
  ): ChronologyItem[] {
    const chronologyEntries: ChronologyItem[] = [];
    const sourcePersons = [];

    // create function that return all source persons for every relationship
    const getSourcePersons = (_contactOfContactId: string,
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
      getSourcePersons(contactOfContactData.id, relationshipsData);
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
        if (relationship.sourcePerson.id !== contactOfContactData.id) {
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

    // date of onset
    if (!_.isEmpty(contactOfContactData.dateOfReporting)) {
      chronologyEntries.push(new ChronologyItem({
        date: contactOfContactData.dateOfReporting,
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_REPORTING'
      }));
    }

    // date become contact
    if (!_.isEmpty(contactOfContactData.dateBecomeContact)) {
      chronologyEntries.push(new ChronologyItem({
        date: contactOfContactData.dateBecomeContact,
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_BECOME_CONTACT'
      }));
    }

    // date of last contact
    if (!_.isEmpty(contactOfContactData.dateOfLastContact)) {
      chronologyEntries.push(new ChronologyItem({
        date: contactOfContactData.dateOfLastContact,
        label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT'
      }));
    }

    // isolation dates
    _.forEach(labResults, (labResult) => {
      if (!_.isEmpty(labResult.dateOfResult)) {
        chronologyEntries.push(new ChronologyItem({
          date: labResult.dateOfResult,
          label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_LAB_RESULT_DATE'
        }));
      }
    });

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

    return chronologyEntries;
  }
}
