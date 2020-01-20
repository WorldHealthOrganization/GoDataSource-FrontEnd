import { Injectable } from '@angular/core';
import { CaseModel } from '../../models/case.model';
import { ContactModel } from '../../models/contact.model';
import { EventModel } from '../../models/event.model';
import { EntityModel, RelationshipModel } from '../../models/entity-and-relationship.model';
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
import { AuthDataService } from '../data/auth.data.service';
import { UserModel } from '../../models/user.model';

export enum SentFromColumn {
    CONTACTS = 'fromContacts',
    EXPOSURES = 'fromExposures'
}

@Injectable()
export class EntityHelperService {
    /**
     * Constructor
     */
    constructor(
        private dialogService: DialogService,
        private relationshipDataService: RelationshipDataService,
        private snackbarService: SnackbarService,
        private authDataService: AuthDataService
    ) {}

    /**
     * Display contacts
     * @param {string} selectedOutbreakId
     * @param {CaseModel | ContactModel | EventModel} entity
     */
    displayContacts(
        selectedOutbreakId: string,
        entity: CaseModel | ContactModel | EventModel
    ) {
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
                    // show error
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
                this.displayEntitiesAndRelationships(
                    SentFromColumn.CONTACTS,
                    entity,
                    relationshipsData
                );
            });
    }

    /**
     * Display exposures
     * @param {string} selectedOutbreakId
     * @param {CaseModel | ContactModel | EventModel} entity
     */
    displayExposures(
        selectedOutbreakId: string,
        entity: CaseModel | ContactModel | EventModel
    ) {
        // display loading
        const loadingDialog: LoadingDialogModel = this.dialogService.showLoadingDialog();
        this.relationshipDataService
            .getEntityExposures(
                selectedOutbreakId,
                entity.type,
                entity.id
            )
            .pipe(
                catchError((err) => {
                    // show error
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
                this.displayEntitiesAndRelationships(
                    SentFromColumn.EXPOSURES,
                    entity,
                    relationshipsData
                );
            });
    }

    /**
     * Display dialog with entities and related relationships
     */
    displayEntitiesAndRelationships(
        from: SentFromColumn,
        entity: CaseModel | ContactModel | EventModel,
        relationshipsData: EntityModel[]
    ) {
        if (!_.isEmpty(relationshipsData)) {
            // split relationships data into entities and relationships
            // entities collection
            const entities: DialogField[] = [];

            // add links to list relationship page only if we're alloed to view that page
            const authUser: UserModel = this.authDataService.getAuthenticatedUser();
            if (
                RelationshipModel.canList(authUser) && (
                    from === SentFromColumn.CONTACTS ?
                        entity.canListRelationshipContacts(authUser) :
                        entity.canListRelationshipExposures(authUser)
                )
            ) {
                entities.push(
                    // add link to full resource
                    new DialogField({
                        name: 'link',
                        fieldType: DialogFieldType.LINK,
                        routerLink: [
                            from === SentFromColumn.CONTACTS ?
                                `/relationships/${entity.type}/${entity.id}/contacts` :
                                `/relationships/${entity.type}/${entity.id}/exposures`
                        ],
                        placeholder: from === SentFromColumn.CONTACTS ?
                            'LNG_DIALOG_GENERAL_DIALOG_LINK_FULL_LIST_CONTACTS' :
                            'LNG_DIALOG_GENERAL_DIALOG_LINK_FULL_LIST_EXPOSURES',
                        linkTarget: '_blank'
                    }),

                    // add section title for entities
                    new DialogField({
                        name: '_',
                        fieldType: DialogFieldType.SECTION_TITLE,
                        placeholder: 'LNG_PAGE_LIST_CASES_DIALOG_ENTITY_SECTION_TITLE'
                    })
                );
            }

            // relationships collection
            const relationships: DialogField[] = [
                // add section title for relationships
                new DialogField({
                    name: '_',
                    fieldType: DialogFieldType.SECTION_TITLE,
                    placeholder: 'LNG_PAGE_LIST_CASES_DIALOG_ENTITY_RELATIONSHIPS_TITLE'
                })
            ];

            // add entities and relationships
            relationshipsData.forEach((relationshipData) => {
                // add entities to the list
                entities.push(new DialogField({
                    name: '_',
                    fieldType: DialogFieldType.ACTION,
                    placeholder: relationshipData.model.name,
                    actionData: relationshipData.model,
                    actionCallback: relationshipData.model.canView(authUser) ? ((item) => {
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
                    }) : null
                }));

                // construct relationship label for dialog
                let relationshipLabel: string = '';
                switch (from) {
                    case SentFromColumn.CONTACTS:
                        relationshipLabel = `${entity.name} - ${relationshipData.model.name}`;
                        break;
                    case SentFromColumn.EXPOSURES:
                        relationshipLabel = `${entity.name} - ${relationshipData.model.name}`;
                        break;
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
                    actionCallback: relationshipData.relationship.canView(authUser) ? ((item) => {
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
                    }) : null
                }));
        });

        // display dialog to choose item from list
        this.dialogService
            .showInput(new DialogConfiguration({
                message: from === 'fromContacts' ?
                    'LNG_DIALOG_GENERAL_DIALOG_TITLE_GROUP_CONTACTS_DIALOG_TITLE' :
                    'LNG_DIALOG_GENERAL_DIALOG_TITLE_GROUP_EXPOSURES_DIALOG_TITLE',
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
