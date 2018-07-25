import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable } from 'rxjs/Observable';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { Constants } from '../../../../core/models/constants';
import { RequestFilterOperator, RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { EntityType } from '../../../../core/models/entity-type';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { NgForm } from '@angular/forms';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';

@Component({
    selector: 'app-available-entities-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './available-entities-list.component.html',
    styleUrls: ['./available-entities-list.component.less']
})
export class AvailableEntitiesListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [];

    // Entities Map for specific data
    entityMap = {
        [EntityType.CASE]: {
            'label': 'LNG_PAGE_LIST_CASES_TITLE',
            'link': '/cases'
        },
        [EntityType.CONTACT]: {
            'label': 'LNG_PAGE_LIST_CONTACTS_TITLE',
            'link': '/contacts'
        },
        [EntityType.EVENT]: {
            'label': 'LNG_PAGE_LIST_EVENTS_TITLE',
            'link': '/events'
        }
    };

    // selected outbreak ID
    outbreakId: string;
    // route params
    entityType: EntityType;
    entityId: string;
    // entities list relationships
    entitiesList$: Observable<(CaseModel|ContactModel|EventModel)[]>;

    genderList$: Observable<any[]>;

    // provide constants to template
    Constants = Constants;
    ReferenceDataCategory = ReferenceDataCategory;
    EntityType = EntityType;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private authDataService: AuthDataService,
        private entityDataService: EntityDataService,
        private relationshipDataService: RelationshipDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private genericDataService: GenericDataService,
        private formHelper: FormHelperService
    ) {
        super();
    }

    ngOnInit() {
        // reference data
        this.genderList$ = this.genericDataService.getGenderList().share();

        this.route.params.subscribe(params => {
            this.entityType = params.entityType;
            this.entityId = params.entityId;

            // exclude current Entity from the list
            this.queryBuilder.filter.where({
                id: {
                    'neq': this.entityId
                }
            });
            // retrieve only available entity types
            const availableTypes: EntityType[] = this.genericDataService.getAvailableRelatedEntityTypes(this.entityType);
            this.queryBuilder.filter.where({
                type: {
                    'inq': availableTypes
                }
            });

            // add new breadcrumb: Entity List page
            this.breadcrumbs.push(
                new BreadcrumbItemModel(this.entityMap[this.entityType].label, this.entityMap[this.entityType].link),
            );

            // get selected outbreak
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    this.outbreakId = selectedOutbreak.id;

                    this.refreshList();

                    // get entity data
                    this.entityDataService
                        .getEntity(this.entityType, this.outbreakId, this.entityId)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            // Entity not found; navigate back to Entities list
                            this.router.navigate([this.entityMap[this.entityType].link]);

                            return ErrorObservable.create(err);
                        })
                        .subscribe((entityData: CaseModel|ContactModel|EventModel) => {
                            // add new breadcrumb: Entity Modify page
                            this.breadcrumbs.push(
                                new BreadcrumbItemModel(
                                    entityData.name,
                                    `${this.entityMap[this.entityType].link}/${this.entityId}/modify`
                                )
                            );
                            // add new breadcrumb: Entity Relationships list
                            this.breadcrumbs.push(
                                new BreadcrumbItemModel(
                                    'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_TITLE',
                                    `/relationships/${this.entityType}/${this.entityId}`
                                )
                            );
                            // add new breadcrumb: page title
                            this.breadcrumbs.push(
                                new BreadcrumbItemModel('LNG_PAGE_LIST_AVAILABLE_ENTITIES_FOR_RELATIONSHIP_TITLE', null, true)
                            );
                        });
                });
        });
    }

    /**
     * Re(load) the available Entities list, based on the applied filter, sort criterias
     */
    refreshList() {
        if (this.outbreakId && this.entityType && this.entityId) {
            // retrieve the list of Relationships
            this.entitiesList$ = this.entityDataService.getEntitiesList(
                this.outbreakId,
                this.queryBuilder
            );
        }
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = [
            'checkbox', 'firstName', 'lastName', 'age', 'gender', 'risk',
            'lastFollowUp', 'place', 'address'
        ];

        return columns;
    }

    selectEntities(form: NgForm) {

        const fields: any = this.formHelper.getFields(form);

        const allEntitiesField = _.get(fields, 'allEntities', false);
        const entityIdsField = _.get(fields, 'entityIds', {});

        let selectedEntities = [];

        // check if all entities were selected
        if (allEntitiesField) {
            // all entities were selected
            selectedEntities = Object.keys(entityIdsField);
        } else {
            // get the IDs of the selected entities
            for (const entityId in entityIdsField) {
                if (entityIdsField[entityId]) {
                    selectedEntities.push(entityId);
                }
            }
        }

        // redirect to next step
        this.router.navigate(
            [`/relationships/${this.entityType}/${this.entityId}/create`],
            {
                queryParams: {
                    selectedEntityIds: JSON.stringify(selectedEntities)
                }
            }
        );
    }

    /**
     * Filter the Entities list by First Name (for Cases and Contacts) or Name (for Events)
     * @param {string} value
     */
    filterByFirstName(value: string) {
        const condition = {
            or: [
                {
                    firstName: {
                        regexp: `/^${value}/i`
                    }
                },
                {
                    name: {
                        regexp: `/^${value}/i`
                    }
                },
            ]
        };

        if (_.isEmpty(value)) {
            // clear filter
            this.queryBuilder.filter.removeCondition(condition);
        } else {
            // filter by firstName (for Case/Contact) or name (for Event)
            this.queryBuilder.filter.where(condition, true);
        }

        this.refreshList();
    }

}
