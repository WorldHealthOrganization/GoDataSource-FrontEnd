import { ContactModel } from '../../../../../core/models/contact.model';
import { FollowUpModel } from '../../../../../core/models/follow-up.model';
import { ChronologyItem } from '../../../../../shared/components/chronology/typings/chronology-item';
import * as _ from 'lodash';

export class ContactChronology {
    static getChronologyEntries(contactData: ContactModel, followUps: FollowUpModel[]): ChronologyItem[] {
        const chronologyEntries: ChronologyItem [] = [];

        // build chronology items from followUp
        _.forEach(followUps, (followUp: FollowUpModel) => {
            if (!_.isEmpty(followUp.date)) {
                chronologyEntries.push(new ChronologyItem({
                    date: followUp.date,
                    label: followUp.statusId,
                    itemTypeFollowUp: true
                }));
            }
        });

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
