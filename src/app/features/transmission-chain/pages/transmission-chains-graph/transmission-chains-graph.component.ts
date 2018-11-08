import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Constants } from '../../../../core/models/constants';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ActivatedRoute } from '@angular/router';
import { EntityType } from '../../../../core/models/entity-type';
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
        private entityDataService: EntityDataService,
        private outbreakDataService: OutbreakDataService,
        private formHelper: FormHelperService,
        private relationshipDataService: RelationshipDataService
    ) {}

    ngOnInit() {
        // get authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.route.queryParams
            .subscribe((params: {personId: string, selectedEntityType: EntityType, sizeOfChainsFilter: number}) => {
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
            });
    }
}
