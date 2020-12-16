import { CaseModel } from './case.model';
import { ContactModel } from './contact.model';
import { EventModel } from './event.model';
import { EntityModel } from './entity-and-relationship.model';
import { EntityType } from './entity-type';
import { RelationshipPersonModel } from './relationship-person.model';

describe('EntityModel', () => {
    it(`should generate link to the view page of a Case, Contact or Event`, () => {
        // case
        const myCaseModel = new CaseModel({id: 'case-uid'});
        const myCaseObject = {id: 'case-uid', type: EntityType.CASE};
        const myCasePerson = new RelationshipPersonModel(myCaseObject);
        const caseViewPageLink = '/cases/case-uid/view';
        // contact
        const myContactModel = new ContactModel({id: 'contact-uid'});
        const myContactObject = {id: 'contact-uid', type: EntityType.CONTACT};
        const myContactPerson = new RelationshipPersonModel(myContactObject);
        const contactViewPageLink = '/contacts/contact-uid/view';
        // event
        const myEventModel = new EventModel({id: 'event-uid'});
        const myEventObject = {id: 'event-uid', type: EntityType.EVENT};
        const myEventPerson = new RelationshipPersonModel(myEventObject);
        const eventViewPageLink = '/events/event-uid/view';

        // case
        expect(EntityModel.getPersonLink(myCaseModel)).toEqual(caseViewPageLink);
        expect(EntityModel.getPersonLink(myCasePerson)).toEqual(caseViewPageLink);
        expect(EntityModel.getPersonLink(myCaseObject)).toEqual(caseViewPageLink);
        // contact
        expect(EntityModel.getPersonLink(myContactModel)).toEqual(contactViewPageLink);
        expect(EntityModel.getPersonLink(myContactPerson)).toEqual(contactViewPageLink);
        expect(EntityModel.getPersonLink(myContactObject)).toEqual(contactViewPageLink);
        // event
        expect(EntityModel.getPersonLink(myEventModel)).toEqual(eventViewPageLink);
        expect(EntityModel.getPersonLink(myEventPerson)).toEqual(eventViewPageLink);
        expect(EntityModel.getPersonLink(myEventObject)).toEqual(eventViewPageLink);
    });

    it(`should generate age string for a person`, () => {
        const yearsLabel = 'years';
        const monthsLabel = 'months';

        const yearsAge = {years: 3};
        const yearsEmptyMonthsAge = {years: 4, months: 0};
        const monthsAge = {months: 7};
        const monthsEmptyYearsAge = {years: 0, months: 6};
        const yearsMonthsAge = {years: 2, months: 5};
        const zeroAge = {years: 0, months: 0};
        const emptyAge = {};
        const nullAge = null;

        expect(EntityModel.getAgeString(yearsAge, yearsLabel, monthsLabel)).toEqual(`3 ${yearsLabel}`);
        expect(EntityModel.getAgeString(yearsEmptyMonthsAge, yearsLabel, monthsLabel)).toEqual(`4 ${yearsLabel}`);
        expect(EntityModel.getAgeString(monthsAge, yearsLabel, monthsLabel)).toEqual(`7 ${monthsLabel}`);
        expect(EntityModel.getAgeString(monthsEmptyYearsAge, yearsLabel, monthsLabel)).toEqual(`6 ${monthsLabel}`);
        expect(EntityModel.getAgeString(yearsMonthsAge, yearsLabel, monthsLabel)).toEqual(`5 ${monthsLabel}`);
        expect(EntityModel.getAgeString(zeroAge, yearsLabel, monthsLabel)).toEqual('');
        expect(EntityModel.getAgeString(emptyAge, yearsLabel, monthsLabel)).toEqual('');
        expect(EntityModel.getAgeString(nullAge, yearsLabel, monthsLabel)).toEqual('');
    });
});
