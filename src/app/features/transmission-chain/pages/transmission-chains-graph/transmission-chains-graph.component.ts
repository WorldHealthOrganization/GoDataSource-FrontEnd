import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Constants } from '../../../../core/models/constants';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ActivatedRoute } from '@angular/router';
import { EntityType } from '../../../../core/models/entity-type';
import { TransmissionChainsDashletComponent } from '../../components/transmission-chains-dashlet/transmission-chains-dashlet.component';
import { ImportExportDataService } from '../../../../core/services/data/import-export.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton } from '../../../../shared/components';
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
import { Observable } from 'rxjs/Observable';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { RelationshipModel } from '../../../../core/models/relationship.model';

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
    // used for export
    @ViewChild('buttonDownloadFile') private buttonDownloadFile: ElementRef;

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
    selectedNodes: (CaseModel|ContactModel|EventModel)[] = [];

    // new relationship model
    newRelationship = new RelationshipModel();

    // provide constants to template
    Constants = Constants;
    EntityType = EntityType;

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
        private relationshipDataService: RelationshipDataService
    ) {}

    ngOnInit() {
        // get authenticated user
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

    /**
     * Check if the user has read access to cases
     * @returns {boolean}
     */
    hasReadCasePermissions(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_CASE);
    }

    /**
     * Check if the user has read report permission
     * @returns {boolean}
     */
    hasReadReportPermissions(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_REPORT);
    }

    /**
     * export chains of transmission as pdf
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
                    value: '1'
                })],
            }), true)
            .subscribe((answer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // get the chosen split factor
                    const splitFactor = answer.inputValue.value.splitFactor;
                    // get the base64 png
                    const pngBase64 = this.cotDashletChild.getPng64(splitFactor).replace('data:image/png;base64,', '');
                    // call the api for the pdf
                    this.importExportDataService.exportImageToPdf({image: pngBase64, responseType: 'blob', splitFactor: Number(splitFactor)})
                        .subscribe((blob) => {
                            const urlT = window.URL.createObjectURL(blob);
                            const link = this.buttonDownloadFile.nativeElement;
                            const fileName = this.i18nService.instant('LNG_PAGE_GRAPH_CHAINS_OF_TRANSMISSION_TITLE');
                            link.href = urlT;
                            link.download = `${fileName}.pdf`;
                            link.click();
                            window.URL.revokeObjectURL(urlT);
                        });
                }
            });
    }

    onNodeTap(entity: GraphNodeModel) {
        // retrieve entity info
        this.entityDataService
            .getEntity(entity.type, this.selectedOutbreak.id, entity.id)
            .catch((err) => {
                // show error message
                this.snackbarService.showApiError(err);
                return ErrorObservable.create(err);
            })
            .subscribe((entityData: CaseModel | EventModel | ContactModel) => {
                // add node to selected persons list
                if (this.selectedNodes.length === 2) {
                    // replace the second node
                    this.selectedNodes[1] = entityData;
                } else {
                    // add node to the list
                    this.selectedNodes.push(entityData);
                }
            });
    }

    removeSelectedNode(index) {
        this.selectedNodes.splice(index, 1);
    }

    createRelationship(form: NgForm) {
        // get forms fields
        const fields = this.formHelper.getFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // get source and target persons
        const sourcePerson = this.selectedNodes[0];
        const targetPerson = this.selectedNodes[1];

        // prepare relationship data
        const relationshipData = fields['relationship'];
        relationshipData.persons.push({
            id: targetPerson.id
        });

        this.relationshipDataService
            .createRelationship(
                this.selectedOutbreak.id,
                this.selectedNodes[0].type,
                this.selectedNodes[0].id,
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

                // reset selected nodes
                this.selectedNodes = [];
            });
    }
}
