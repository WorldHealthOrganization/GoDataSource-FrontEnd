import { Injectable } from '@angular/core';
import { CaseModel } from '../../models/case.model';
import { ContactModel } from '../../models/contact.model';
import { EventModel } from '../../models/event.model';
import { EntityModel } from '../../models/entity-and-relationship.model';

@Injectable()
export class EntityHelperService {

    constructor() {

    }

    /**
     * Display dialog with entities and related relationships
     */
    displayEntitiesAndRelationships(from: string, entity: CaseModel | ContactModel | EventModel, relationshipsData: EntityModel[]) {
        // console.log(`aaaa`);
        console.log(entity);
        console.log(relationshipsData);
        //     // split relationships data into entities and relationships
        //     const entities = [];
        //     const relationships: EntityType[] = [];
        //
        //     // add models
        //     relationshipsData.forEach((relationshipData) => {
        //         entities.push(relationshipData.model);
        //     });
        //     // add relationships
        //     relationshipsData.forEach((relationshipData) => {
        //         console.log(relationshipData);
        //         // create object to pass to the dialog
        //         relationships.push({
        //             relatedEntity: relationshipData.model,
        //             relationshipData: relationshipData.model.relationship});
        //     });
        //
        //     // create  list of entities and relationships
        //     const fieldsList: DialogField[] = [];
        //
        //     if (!_.isEmpty(entities)) {
        //         // add section title if we have entities
        //         fieldsList.push(new DialogField({
        //             name: '_',
        //             fieldType: DialogFieldType.SECTION_TITLE,
        //             placeholder: 'LNG_PAGE_LIST_CASES_DIALOG_ENTITY_SECTION_TITLE'
        //         }));
        //
        //         // add entities to the list
        //         entities.forEach((itemModel: CaseModel | ContactModel | EventModel) => {
        //             fieldsList.push(new DialogField({
        //                 name: '',
        //                 fieldType: DialogFieldType.ACTION,
        //                 placeholder: itemModel.name,
        //                 actionData: itemModel,
        //                 actionCallback: (item) => {
        //                     // show entity information
        //                     this.dialogService.showCustomDialog(
        //                         ViewCotNodeDialogComponent,
        //                         {
        //                             ...ViewCotNodeDialogComponent.DEFAULT_CONFIG,
        //                             ...{
        //                                 data: {
        //                                     entity: item
        //                                 }
        //                             }
        //                         }
        //                     );
        //                 }
        //             }));
        //         });
        //     }
        //
        //     if (!_.isEmpty(relationships)) {
        //         // add section title if we have relationships
        //         fieldsList.push(new DialogField({
        //             name: '_',
        //             fieldType: DialogFieldType.SECTION_TITLE,
        //             placeholder: 'LNG_PAGE_LIST_CASES_DIALOG_ENTITY_RELATIONSHIPS_TITLE'
        //         }));
        //
        //         // add relationships to the list
        //         relationships.forEach((relationshipModel: EntityModel) => {
        //             // construct relationship label for dialog
        //             let relationshipLabel: string = '';
        //             if (from === 'fromContacts') {
        //                 relationshipLabel = `${entity.name} - ${relationshipModel.model.name}`;
        //             }
        //
        //             if (from === 'fromExposures') {
        //                 relationshipLabel = ` ${relationshipModel.relatedEntity.name} - ${entity.name}`;
        //             }
        //
        //             // add related entities into relationship people to display relationship dialog
        //             relationshipModel.relationshipData.people = [
        //                 new EntityModel(entity),
        //                 new EntityModel(relationshipModel.relatedEntity)
        //             ];
        //
        //             // add relationships to the list
        //             fieldsList.push(new DialogField({
        //                 name: '',
        //                 fieldType: DialogFieldType.ACTION,
        //                 placeholder: relationshipLabel,
        //                 actionData: relationshipModel.relationshipData,
        //                 actionCallback: (item: RelationshipModel) => {
        //                     // show entity information
        //                     this.dialogService.showCustomDialog(
        //                         ViewCotEdgeDialogComponent,
        //                         {
        //                             ...ViewCotEdgeDialogComponent.DEFAULT_CONFIG,
        //                             ...{
        //                                 data: {
        //                                     relationship: item
        //                                 }
        //                             }
        //                         }
        //                     );
        //                 }
        //             }));
        //         });
        //     }
        //
        //     // display dialog if filed list is not empty
        //     if (!_.isEmpty(fieldsList)) {
        //         // display dialog to choose item from list
        //         this.dialogService
        //             .showInput(new DialogConfiguration({
        //                 message: 'LNG_PAGE_LIST_CASES_GROUP_DIALOG_TITLE',
        //                 buttons: [
        //                     new DialogButton({
        //                         label: 'LNG_COMMON_BUTTON_CLOSE',
        //                         clickCallback: (dialogHandler: MatDialogRef<DialogComponent>) => {
        //                             dialogHandler.close();
        //                         }
        //                     })
        //                 ],
        //                 fieldsList: fieldsList
        //             }))
        //             .subscribe();
        //     }
    }
}
