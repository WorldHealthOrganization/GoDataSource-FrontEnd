import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Constants } from '../../../../core/models/constants';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ActivatedRoute } from '@angular/router';
import { EntityType } from '../../../../core/models/entity-type';
import { TransmissionChainsDashletComponent } from '../../components/transmission-chains-dashlet/transmission-chains-dashlet.component';
import { ImportExportDataService } from '../../../../core/services/data/import-export.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswer, DialogAnswerButton, LoadingDialogModel, ViewCotEdgeDialogComponent, ViewCotNodeDialogComponent } from '../../../../shared/components';
import { DialogConfiguration, DialogField } from '../../../../shared/components/dialog/dialog.component';
import { GraphNodeModel } from '../../../../core/models/graph-node.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { NgForm } from '@angular/forms';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { RelationshipModel } from '../../../../core/models/relationship.model';
import { SelectedNodes } from '../../classes/selected-nodes';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';

import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import * as FileSaver from 'file-saver';
import { DomService } from '../../../../core/services/helper/dom.service';
import { GraphEdgeModel } from '../../../../core/models/graph-edge.model';
import * as _ from 'lodash';

enum NodeAction {
    MODIFY_PERSON = 'modify-person',
    CREATE_CONTACT = 'create-contact',
    MODIFY_EDGE = 'modify-edge'
}

@Component({
    selector: 'app-transmission-chains-graph',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './transmission-chains-graph.component.html',
    styleUrls: ['./transmission-chains-graph.component.less']
})
export class TransmissionChainsGraphComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_TITLE', null, true)
    ];

    @ViewChild(TransmissionChainsDashletComponent) cotDashletChild;

    // authenticated user
    authUser: UserModel;
    // selected outbreak
    selectedOutbreak: OutbreakModel;
    // filter used for size of chains
    sizeOfChainsFilter: number = null;
    // person Id - to filter the chain
    personId: string = null;
    // type of the selected person . event
    selectedEntityType: EntityType = null;

    // nodes selected from graph
    selectedNodes: SelectedNodes = new SelectedNodes();
    // selected relationship
    selectedRelationship: RelationshipModel;
    // action to do on the selected node
    currentNodeAction: NodeAction = null;

    // Edit or View mode?
    editMode: boolean = false;
    // new relationship model
    newRelationship = new RelationshipModel();
    // new contact model
    newContact = new ContactModel();

    // provide constants to template
    Constants = Constants;
    EntityType = EntityType;
    NodeAction = NodeAction;

    constructor(
        private authDataService: AuthDataService,
        protected snackbarService: SnackbarService,
        protected route: ActivatedRoute,
        private importExportDataService: ImportExportDataService,
        private i18nService: I18nService,
        private dialogService: DialogService = null,
        private entityDataService: EntityDataService,
        private outbreakDataService: OutbreakDataService,
        private formHelper: FormHelperService,
        private relationshipDataService: RelationshipDataService,
        private contactDataService: ContactDataService,
        private domService: DomService
    ) {}

    ngOnInit() {
        // authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.route.queryParams
            .subscribe((params: { personId: string, selectedEntityType: EntityType, sizeOfChainsFilter: number }) => {
                // check if person id was sent in url
                if (params.personId && params.selectedEntityType) {
                    this.personId = params.personId;
                    this.selectedEntityType = params.selectedEntityType;
                }
                // check if the size of chains was sent in url
                if (params.sizeOfChainsFilter) {
                    this.sizeOfChainsFilter = params.sizeOfChainsFilter;
                }
            });

        // subscribe to the Selected Outbreak Subject stream
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;
            });
    }

    hasCaseReadAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_CASE);
    }

    hasCaseWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
    }

    hasEventWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_EVENT);
    }

    hasContactWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CONTACT);
    }

    canModifySelectedNode(): boolean {
        return (
            this.selectedNodes.nodes[0].type === EntityType.CASE &&
            this.hasCaseWriteAccess()
        ) || (
            this.selectedNodes.nodes[0].type === EntityType.EVENT &&
            this.hasEventWriteAccess()
        ) || (
            this.selectedNodes.nodes[0].type === EntityType.CONTACT &&
            this.hasContactWriteAccess()
        );
    }

    /**
     * Determine export button text depends on what type transmission chain is
     * @returns {string|string}
     */
    get buttonText() {
        return this.cotDashletChild.cytoscapeChild.transmissionChainViewType !== Constants.TRANSMISSION_CHAIN_VIEW_TYPES.GEOSPATIAL_MAP.value ?
            'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_EXPORT' :
            'LNG_PAGE_TRANSMISSION_CHAINS_GEO_MAP_EXPORT';
    }
    /**
     *Export visualized map/graph seen in page
     */
    exportVisualizedMapOrGraph() {
        if (this.cotDashletChild.cytoscapeChild.transmissionChainViewType !== Constants.TRANSMISSION_CHAIN_VIEW_TYPES.GEOSPATIAL_MAP.value) {
            this.exportChainsOfTransmission();
        } else {
            this.exportGeospatialMap();
        }
    }

    /**
     * Export chains of transmission as pdf
     */
    exportChainsOfTransmission() {
        // open dialog to choose the split factor
        this.dialogService.showInput(
            new DialogConfiguration({
                message: 'LNG_DIALOG_CONFIRM_EXPORT_CHAINS_OF_TRANSMISSION',
                yesLabel: 'LNG_DIALOG_CONFIRM_BUTTON_YES',
                required: true,
                fieldsList: [new DialogField({
                    name: 'splitFactor',
                    placeholder: 'LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_EXPORT_SPLIT_FACTOR',
                    required: true,
                    type: 'number',
                    value: 1,
                    min: 1,
                    max: 15
                })],
            }), true)
            .subscribe((answer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    const loadingDialog = this.dialogService.showLoadingDialog();
                    // get the chosen split factor
                    const splitFactor = answer.inputValue.value.splitFactor;
                    // get the base64 png
                    const pngBase64 = this.cotDashletChild.getPng64(splitFactor).replace('data:image/png;base64,', '');
                    // call the api for the pdf
                    this.importExportDataService.exportImageToPdf({image: pngBase64, responseType: 'blob', splitFactor: Number(splitFactor)})
                        .subscribe((blob) => {
                            const fileName = this.i18nService.instant('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_TITLE');
                            FileSaver.saveAs(
                                blob,
                                `${fileName}.pdf`
                            );
                            loadingDialog.close();
                        });
                }
            });
    }

    /**
     * Export geospatial map
     */
    exportGeospatialMap() {
        const loadingDialog = this.dialogService.showLoadingDialog();
        if (this.cotDashletChild.cytoscapeChild.worldMap) {
            this.cotDashletChild.cytoscapeChild.worldMap
                .printToBlob()
                .subscribe((blob) => {
                    const fileName = this.i18nService.instant('LNG_PAGE_TRANSMISSION_CHAINS_GEO_MAP_TITLE');
                    FileSaver.saveAs(
                        blob,
                        `${fileName}.png`
                    );
                    loadingDialog.close();
                });
        } else {
            loadingDialog.close();
        }
    }

    /**
     * Switch between View and Edit mode (when clicking nodes)
     * @param editMode
     */
    onEditModeChange(editMode: boolean) {
        this.editMode = editMode;

        if (!editMode) {
            // reset selected nodes
            this.resetNodes();
        }
    }

    onNodeTap(entity: GraphNodeModel) {
        // retrieve entity info
        const loadingDialog: LoadingDialogModel = this.dialogService.showLoadingDialog();
        this.entityDataService
            .getEntity(entity.type, this.selectedOutbreak.id, entity.id)
            .catch((err) => {
                this.snackbarService.showApiError(err);
                loadingDialog.close();
                return ErrorObservable.create(err);
            })
            .subscribe((entityData: CaseModel | EventModel | ContactModel) => {
                // hide loading dialog
                loadingDialog.close();

                if (this.editMode) {
                    this.selectedRelationship = undefined;
                    // add node to selected persons list
                    this.selectedNodes.addNode(entityData);

                    // focus boxes
                    setTimeout(() => {
                        this.domService.scrollItemIntoView(
                            '.selected-node-details'
                        );
                    });
                } else {
                    // show node information
                    this.dialogService.showCustomDialog(
                        ViewCotNodeDialogComponent,
                        {
                            ...ViewCotNodeDialogComponent.DEFAULT_CONFIG,
                            ...{
                                data: {
                                    entity: entityData
                                }
                            }
                        }
                    );
                }
            });
    }

    onEdgeTap(relationship: GraphEdgeModel) {
        // retrieve relationship info
        const loadingDialog: LoadingDialogModel = this.dialogService.showLoadingDialog();
        this.relationshipDataService
            .getEntityRelationship(this.selectedOutbreak.id, relationship.sourceType, relationship.source, relationship.id)
            .catch((err) => {
                this.snackbarService.showError(err.message);
                loadingDialog.close();
                return ErrorObservable.create(err);
            })
            .subscribe((relationshipData) => {
                // hide loading dialog
                loadingDialog.close();

                if (this.editMode) {
                    this.resetNodes();

                    this.selectedRelationship = relationshipData;

                    // focus box
                    setTimeout(() => {
                        this.domService.scrollItemIntoView(
                            '.selected-relationship-details'
                        );
                    });
                } else {
                    // show edge information
                    this.dialogService.showCustomDialog(
                        ViewCotEdgeDialogComponent,
                        {
                            ...ViewCotEdgeDialogComponent.DEFAULT_CONFIG,
                            ...{
                                data: {
                                    relationship: relationshipData
                                }
                            }
                        }
                    );
                }
            });
    }

    removeSelectedNode(index) {
        this.selectedNodes.removeNodeAtIndex(index);
    }

    removeRelationship() {
        this.selectedRelationship = undefined;
    }

    swapSelectedNodes() {
        this.selectedNodes.swapNodes();
    }

    resetNodes() {
        this.selectedNodes = new SelectedNodes();
    }

    modifySelectedPerson(person: (CaseModel | ContactModel | EventModel)) {
        // remove other selected node(s) (if any)
        this.selectedNodes.keepNode(person);

        this.resetFormModels();

        this.currentNodeAction = NodeAction.MODIFY_PERSON;
    }

    modifySelectedRelationship() {
        this.currentNodeAction = NodeAction.MODIFY_EDGE;
    }

    createContactForSelectedPerson(person: (CaseModel | ContactModel | EventModel)) {
        // remove other selected node(s) (if any)
        this.selectedNodes.keepNode(person);

        this.resetFormModels();

        this.currentNodeAction = NodeAction.CREATE_CONTACT;
    }

    deleteSelectedPerson(person: (CaseModel | ContactModel | EventModel)) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_CASE', {name: person.name})
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete person
                    this.entityDataService
                        .deleteEntity(person.type, this.selectedOutbreak.id, person.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_DELETE_PERSON_SUCCESS_MESSAGE');

                            // refresh graph
                            this.cotDashletChild.refreshChain();

                            // reset form
                            this.resetFormModels();

                            // reset selected nodes
                            this.resetNodes();
                        });
                }
            });
    }

    resetFormModels() {
        // reset Contact model
        this.newContact = new ContactModel();

        // reset Relationship model
        this.newRelationship = new RelationshipModel();
    }

    /**
     * Create a new Relationship between 2 selected nodes
     * @param form
     */
    createRelationship(form: NgForm) {
        // get forms fields
        const fields = this.formHelper.getFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // get source and target persons
        const sourcePerson = this.selectedNodes.sourceNode;
        const targetPerson = this.selectedNodes.targetNode;

        // prepare relationship data
        const relationshipData = fields.relationship;
        relationshipData.persons = [{
            id: targetPerson.id
        }];

        this.relationshipDataService
            .createRelationship(
                this.selectedOutbreak.id,
                sourcePerson.type,
                sourcePerson.id,
                relationshipData
            )
            .catch((err) => {
                this.snackbarService.showApiError(err);

                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_CREATE_RELATIONSHIP_SUCCESS_MESSAGE');

                // refresh graph
                this.cotDashletChild.refreshChain();

                // reset form
                this.resetFormModels();

                // reset selected nodes
                this.resetNodes();

                // reset node action
                this.currentNodeAction = null;
            });
    }

    /**
     * Create a new Contact for a selected node (Case or Event)
     * @param form
     */
    createContact(form: NgForm) {
        // get forms fields
        const fields = this.formHelper.getFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // contact fields
        const contactFields = fields.contact;
        // relationship fields
        const relationshipFields = fields.relationship;
        // get source person
        const sourcePerson = this.selectedNodes.sourceNode;

        // add the new Contact
        this.contactDataService
            .createContact(this.selectedOutbreak.id, contactFields)
            .switchMap((contactData: ContactModel) => {
                relationshipFields.persons = [{
                    id: contactData.id
                }];

                // create the relationship between the source person and the new contact
                return this.relationshipDataService
                    .createRelationship(
                        this.selectedOutbreak.id,
                        sourcePerson.type,
                        sourcePerson.id,
                        relationshipFields
                    )
                    .catch((err) => {
                        // display error message
                        this.snackbarService.showApiError(err);

                        // rollback - remove contact
                        this.contactDataService
                            .deleteContact(this.selectedOutbreak.id, contactData.id)
                            .subscribe();

                        // finished
                        return ErrorObservable.create(err);
                    });
            })
            .catch((err) => {
                this.snackbarService.showApiError(err);

                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_CREATE_CONTACT_SUCCESS_MESSAGE');

                // refresh graph
                this.cotDashletChild.refreshChain();

                // reset form
                this.resetFormModels();

                // reset selected nodes
                this.resetNodes();

                // reset node action
                this.currentNodeAction = null;
            });
    }

    /**
     * Create a new Contact for a selected node (Case or Event)
     * @param form
     */
    modifyPerson(form: NgForm) {
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // get forms fields
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // get person being modified
        const person: (CaseModel | ContactModel | EventModel) = this.selectedNodes.nodes[0];

        // modify person
        this.entityDataService
            .modifyEntity(person.type, this.selectedOutbreak.id, person.id, dirtyFields)
            .catch((err) => {
                this.snackbarService.showApiError(err);

                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_MODIFY_PERSON_SUCCESS_MESSAGE');

                // refresh graph
                this.cotDashletChild.refreshChain();

                // reset form
                this.resetFormModels();

                // reset selected nodes
                this.resetNodes();

                // reset node action
                this.currentNodeAction = null;
            });
    }

    /**
     * Modify a selected relationship relationship
     * @param {NgForm} form
     */
    modifyRelationship(form: NgForm) {
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // get forms fields
        const dirtyFields: any = this.formHelper.getDirtyFields(form);
        // create source person
        const sourcePerson = _.find(this.selectedRelationship.persons, person => person.source === true);
        this.relationshipDataService
            .modifyRelationship(
                this.selectedOutbreak.id,
                sourcePerson.type,
                sourcePerson.id,
                this.selectedRelationship.id,
                dirtyFields.relationship
            )
            .catch((err) => {
                this.snackbarService.showApiError(err);

                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_ACTION_MODIFY_RELATIONSHIP_SUCCESS_MESSAGE');

                // refresh graph
                this.cotDashletChild.refreshChain();

                // reset selected relationship
                this.selectedRelationship = undefined;

                // reset form
                this.resetFormModels();

                // reset selected nodes
                this.resetNodes();

                // reset node action
                this.currentNodeAction = null;
            });
    }

    /**
     * Delete selected relationship
     */
    deleteSelectedRelationship() {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_RELATIONSHIP_CHAIN_OF_TRANSMISSION')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    const sourcePerson = _.find(this.selectedRelationship.persons, person => person.source === true);
                    // delete relationship
                    this.relationshipDataService
                        .deleteRelationship(this.selectedOutbreak.id, sourcePerson.type, sourcePerson.id, this.selectedRelationship.id)
                        .catch((err) => {
                            this.snackbarService.showApiError(err);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_ACTION_DELETE_RELATIONSHIP_SUCCESS_MESSAGE');

                            // refresh graph
                            this.cotDashletChild.refreshChain();

                            // reset selected relationship
                            this.selectedRelationship = undefined;

                            // reset form
                            this.resetFormModels();

                            // reset selected nodes
                            this.resetNodes();

                            // reset node action
                            this.currentNodeAction = null;
                        });
                }
            });
    }
}
