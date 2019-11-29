import { Injectable } from '@angular/core';
import { CaseModel } from '../../models/case.model';
import { ContactModel } from '../../models/contact.model';
import { EventModel } from '../../models/event.model';
import { EntityModel } from '../../models/entity-and-relationship.model';
import {
    DialogButton, DialogComponent, DialogConfiguration, DialogField,
    DialogFieldType
} from '../../../shared/components/dialog/dialog.component';
import { DialogService } from './dialog.service';
import { ViewCotNodeDialogComponent } from '../../../shared/components/view-cot-node-dialog/view-cot-node-dialog.component';
import { MatDialogRef } from '@angular/material';
import * as _ from 'lodash';
import { ViewCotEdgeDialogComponent } from '../../../shared/components/view-cot-edge-dialog/view-cot-edge-dialog.component';
import { LoadingDialogModel } from '../../../shared/components/loading-dialog/loading-dialog.component';
import { RelationshipDataService } from '../data/relationship.data.service';
import { SnackbarService } from './snackbar.service';
import { throwError } from 'rxjs/index';
import { catchError } from 'rxjs/internal/operators';

@Injectable()
export class EntityHelperService {

    constructor(
        private dialogService: DialogService,
        private relationshipDataService: RelationshipDataService,
        private snackbarService: SnackbarService) {

    }

    /**
     * Display contacts
     * @param {string} selectedOutbreakId
     * @param {CaseModel | ContactModel | EventModel} entity
     */
    displayContacts(selectedOutbreakId: string, entity: CaseModel | ContactModel | EventModel) {
        // display loading
        const loadingDialog: LoadingDialogModel = this.dialogService.showLoadingDialog();
        this.relationshipDataService
            .getEntityContacts(
                selectedOutbreakId,
                entity.type,
                entity.id,
            )
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    // hide loading
                    loadingDialog.close();
                    return throwError(err);
                })
            )
            .subscribe((relationshipsData: EntityModel[]) => {
                // hide loading
                loadingDialog.close();

                // display popup
                this.displayEntitiesAndRelationships('fromContacts', entity, relationshipsData);
            });
    }

    /**
     * Displa exposures
     * @param {string} selectedOtbreakId
     * @param {CaseModel | ContactModel | EventModel} entity
     */
    displayExposures(selectedOtbreakId: string, entity: CaseModel | ContactModel | EventModel) {
        const loadingDialog: LoadingDialogModel = this.dialogService.showLoadingDialog();

        this.relationshipDataService
            .getEntityExposures(
                selectedOtbreakId,
                entity.type,
                entity.id
            )
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    // hide loading
                    loadingDialog.close();
                    return throwError(err);
                })
            )
            .subscribe((relationshipsData: EntityModel[]) => {
                // hide loading
                loadingDialog.close();

                // display popup
                this.displayEntitiesAndRelationships('fromExposures', entity, relationshipsData);
            });
    }

    /**
     * Display dialog with entities and related relationships
     */
    displayEntitiesAndRelationships(from: string, entity: CaseModel | ContactModel | EventModel, relationshipsData: EntityModel[]) {
        if (!_.isEmpty(relationshipsData)) {
            // split relationships data into entities and relationships
            // entities collection
            const entities = [];
            // add section title for entities
            entities.push(new DialogField({
                name: '_',
                fieldType: DialogFieldType.SECTION_TITLE,
                placeholder: 'LNG_PAGE_LIST_CASES_DIALOG_ENTITY_SECTION_TITLE'
            }));
            // relationships collection
            const relationships = [];
            // add section title for relationships
            relationships.push(new DialogField({
                name: '_',
                fieldType: DialogFieldType.SECTION_TITLE,
                placeholder: 'LNG_PAGE_LIST_CASES_DIALOG_ENTITY_RELATIONSHIPS_TITLE'
            }));

            // add entities and relationships
            relationshipsData.forEach((relationshipData) => {
                // add entities to the list
                entities.push(new DialogField({
                    name: '_',
                    fieldType: DialogFieldType.ACTION,
                    placeholder: relationshipData.model.name,
                    actionData: relationshipData.model,
                    actionCallback: (item) => {
                        // show entity information
                        this.dialogService.showCustomDialog(
                            ViewCotNodeDialogComponent,
                            {
                                ...ViewCotNodeDialogComponent.DEFAULT_CONFIG,
                                ...{
                                    data: {
                                        entity: item
                                    }
                                }
                            }
                        );
                    }
                }));

                // construct relationship label for dialog
                let relationshipLabel: string = '';
                if (from === 'fromContacts') {
                    relationshipLabel = `${entity.name} - ${relationshipData.model.name}`;
                }

                if (from === 'fromExposures') {
                    relationshipLabel = ` ${relationshipData.model.name} - ${entity.name}`;
                }

                // add related entities into relationship people to display relationship dialog
                relationshipData.relationship.people = [
                    new EntityModel(entity),
                    new EntityModel(relationshipData.model)
                ];

                // add relationships to the list
                relationships.push(new DialogField({
                    name: '_',
                    fieldType: DialogFieldType.ACTION,
                    placeholder: relationshipLabel,
                    actionData: relationshipData.relationship,
                    actionCallback: (item) => {
                        // show entity information
                        this.dialogService.showCustomDialog(
                            ViewCotEdgeDialogComponent,
                            {
                                ...ViewCotEdgeDialogComponent.DEFAULT_CONFIG,
                                ...{
                                    data: {
                                        relationship: item
                                    }
                                }
                            }
                        );
                    }
                }));
            // });
        });

        // display dialog to choose item from list
        this.dialogService
            .showInput(new DialogConfiguration({
                message: from === 'fromContacts' ? 'LNG_DIALOG_GENERAL_DIALOG_TITLE_GROUP_CONTACTS_DIALOG_TITLE' : 'LNG_DIALOG_GENERAL_DIALOG_TITLE_GROUP_EXPOSURES_DIALOG_TITLE',
                buttons: [
                    new DialogButton({
                        label: 'LNG_COMMON_BUTTON_CLOSE',
                        clickCallback: (dialogHandler: MatDialogRef<DialogComponent>) => {
                            dialogHandler.close();
                        }
                    })
                ],
                fieldsList: [
                    ...entities,
                    ...relationships
                ]
            }))
            .subscribe();
        }
    }
}
