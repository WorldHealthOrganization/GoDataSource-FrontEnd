import { Component, OnInit } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { RelationshipsListComponent } from '../../helper-classes/relationships-list-component';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Observable } from 'rxjs/index';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { share, tap } from 'rxjs/internal/operators';
import * as _ from 'lodash';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';

@Component({
    selector: 'app-available-entities-for-switch-list',
    templateUrl: './available-entities-for-switch-list.component.html',
    styleUrls: ['./available-entities-for-switch-list.component.less']
})
export class AvailableEntitiesForSwitchListComponent extends RelationshipsListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [];

    entitiesList$: Observable<(CaseModel|ContactModel|EventModel)[]>;
    entitiesListCount$: Observable<any>;

    constructor(
        protected snackbarService: SnackbarService,
        protected router: Router,
        protected route: ActivatedRoute,
        protected authDataService: AuthDataService,
        protected outbreakDataService: OutbreakDataService,
        protected entityDataService: EntityDataService,
        private relationshipDataService: RelationshipDataService
    ) {
        super(
            snackbarService, router, route,
            authDataService, outbreakDataService, entityDataService
        );
    }

    ngOnInit() {
    }

    /**
     * @Overrides parent method
     */
    onDataInitialized() {
        // initialize breadcrumbs
        this.initializeBreadcrumbs();

        // // initialize query builder
        // this.clearQueryBuilder();
        //
        // // initialize pagination
        // this.initPaginator();
        // // ...and (re)load the list
        // this.needsRefreshList(true);
    }

    /**
     * @Overrides parent method
     */
    onPersonLoaded() {
        // (re)initialize breadcrumbs
        this.initializeBreadcrumbs();
    }

    private initializeBreadcrumbs() {
        if (
            this.relationshipType &&
            this.entity
        ) {
            this.breadcrumbs = [
                new BreadcrumbItemModel(this.entityMap[this.entityType].label, this.entityMap[this.entityType].link),
                new BreadcrumbItemModel(
                    this.entity.name,
                    `${this.entityMap[this.entityType].link}/${this.entityId}/view`
                ),
                new BreadcrumbItemModel(
                    this.relationshipsListPageTitle,
                    `/relationships/${this.entityType}/${this.entityId}/${this.relationshipTypeRoutePath}`
                ),
                new BreadcrumbItemModel('LNG_PAGE_LIST_AVAILABLE_ENTITIES_FOR_RELATIONSHIP_TITLE', null, true)
            ];
        }
    }

    /**
     * Re(load) the available Entities list, based on the applied filter, sort criterias
     */
    refreshList(finishCallback: () => void) {
        if (
            this.entityType &&
            this.entityId &&
            this.selectedOutbreak
        ) {
            // retrieve the list of Relationships
            this.entitiesList$ = this.relationshipDataService
                .getEntityAvailablePeople(
                    this.selectedOutbreak.id,
                    this.entityType,
                    this.entityId,
                    this.queryBuilder
                )
                .pipe(
                    tap(this.checkEmptyList.bind(this)),
                    tap(() => {
                        finishCallback();
                    })
                );
        } else {
            finishCallback();
        }
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        if (
            this.entityType &&
            this.entityId &&
            this.selectedOutbreak
        ) {
            // remove paginator from query builder
            const countQueryBuilder = _.cloneDeep(this.queryBuilder);
            countQueryBuilder.paginator.clear();
            this.entitiesListCount$ = this.relationshipDataService
                .getEntityAvailablePeopleCount(
                    this.selectedOutbreak.id,
                    this.entityType,
                    this.entityId,
                    this.queryBuilder
                )
                .pipe(share());
        }
    }

}
