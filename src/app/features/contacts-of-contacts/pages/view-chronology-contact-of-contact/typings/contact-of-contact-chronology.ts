import {ChronologyItem} from '../../../../../shared/components/chronology/typings/chronology-item';
import {I18nService} from '../../../../../core/services/helper/i18n.service';
import {ContactOfContactModel} from '../../../../../core/models/contact-of-contact.model';
import {RelationshipModel} from '../../../../../core/models/entity-and-relationship.model';
import * as _ from 'lodash';
import {CaseModel} from '../../../../../core/models/case.model';
import {ContactModel} from '../../../../../core/models/contact.model';
import {EventModel} from '../../../../../core/models/event.model';

export class ContactOfContactChronology {
    static getChronologyEntries(
        i18nService: I18nService,
        contactOfContactData: ContactOfContactModel,
        relationshipsData?: RelationshipModel[],
    ): ChronologyItem[] {
        const chronologyEntries: ChronologyItem[] = [];
        const sourcePersons = [];

        // create function that return all source persons for every relationship
        const getSourcePersons = (contactOfContactId: string,
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
                        translateData: {exposureName: sourcePerson ? sourcePerson.name : ''}
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


        if (!_.isEmpty(contactOfContactData.dateOfLastContact)) {
            chronologyEntries.push(new ChronologyItem({
                date: contactOfContactData.dateOfLastContact,
                label: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_LAST_CONTACT'
            }));
        }

        return chronologyEntries;
    }
}
