import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { Observable } from 'rxjs/Observable';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { EntityType } from '../../../../core/models/entity-type';

@Component({
    selector: 'app-inconsistencies-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './inconsistencies-list.component.html',
    styleUrls: ['./inconsistencies-list.component.less']
})
export class InconsistenciesListComponent extends ListComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    // authenticated user
    authUser: UserModel;

    // entities
    entitiesList$: Observable<(CaseModel|ContactModel|EventModel)[]>;

    // constants
    EntityType = EntityType;

    /**
     * Constructor
     */
    constructor(
        protected snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private authDataService: AuthDataService
    ) {
        super(
            snackbarService
        );
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // init breadcrumbs
        this.initBreadcrumbs();

        // authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // subscribe to the Selected Outbreak Subject stream
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // selected outbreak
                this.selectedOutbreak = selectedOutbreak;

                // init breadcrumbs
                this.initBreadcrumbs();

                // ...and re-load the list when the Selected Outbreak is changed
                this.needsRefreshList(true);
            });
    }

    /**
     * Re(load) list
     */
    refreshList() {
        if (this.selectedOutbreak) {
            this.entitiesList$ = this.outbreakDataService.getPeopleInconsistencies(this.selectedOutbreak.id);
        }
    }

    /**
     * Init breadcrumbs
     */
    initBreadcrumbs() {
        // initialize
        this.breadcrumbs = [
            new BreadcrumbItemModel(
                'LNG_PAGE_LIST_OUTBREAKS_TITLE',
                '/outbreaks',
                false
            )
        ];

        // add outbreak details ?
        if (
            this.selectedOutbreak &&
            this.selectedOutbreak.id
        ) {
            // outbreak details
            const viewOrModify: string = this.authUser.hasPermissions(PERMISSION.WRITE_OUTBREAK) ?
                'modify' :
                'view';
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    this.selectedOutbreak.name,
                    `/outbreaks/${this.selectedOutbreak.id}/${viewOrModify}`,
                    false
                )
            );

            // add inconsistencies breadcrumb
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    'LNG_PAGE_LIST_INCONSISTENCIES_TITLE',
                    `/outbreaks/${this.selectedOutbreak.id}/inconsistencies`,
                    true
                )
            );
        }
    }

    /**
     * Table columns
     */
    getTableColumns(): string[] {
        return [
            'firstName',
            'lastName',
            'inconsistencies',
            'actions'
        ];
    }

    /**
     * Get the link to redirect to view page depending on item type and action
     * @param {Object} item
     * @param {string} action
     * @returns {string}
     */
    getItemRouterLink (item, action: string) {
        switch (item.type) {
            case EntityType.CASE:
                return `/cases/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
            case EntityType.CONTACT:
                return `/contacts/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
            case EntityType.EVENT:
                return `/events/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
        }
    }

    /**
     * Get the permission for different type of item
     * @param {Object} item
     * @returns {boolean}
     */
    getAccessPermissions(item) {
        switch (item.type) {
            case EntityType.CASE:
                return this.hasCaseWriteAccess();
            case EntityType.CONTACT:
                return this.hasContactWriteAccess();
            case EntityType.EVENT:
                return this.hasEventWriteAccess();
        }
    }

    /**
     * Check if we have access to write cluster's cases
     * @returns {boolean}
     */
    hasCaseWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
    }

    /**
     * Check if we have access to write cluster's contacts
     * @returns {boolean}
     */
    hasContactWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CONTACT);
    }

    /**
     * Check if we have access to write cluster's event
     * @returns {boolean}
     */
    hasEventWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_EVENT);
    }
}
