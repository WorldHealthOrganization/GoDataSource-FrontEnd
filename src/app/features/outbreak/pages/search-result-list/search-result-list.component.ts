import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { SystemSettingsModel } from '../../../../core/models/system-settings.model';
import * as _ from 'lodash';
import { share } from 'rxjs/operators';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { HoverRowAction } from '../../../../shared/components';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { GlobalEntitySearchDataService } from '../../../../core/services/data/global-entity-search.data.service';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { EntityType } from '../../../../core/models/entity-type';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';

@Component({
    selector: 'app-search-result-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './search-result-list.component.html'
})
export class SearchResultListComponent extends ListComponent implements OnInit, OnDestroy {
    // Breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_SEARCH_RESULT_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // entity list
    entityListAll: (CaseModel | ContactModel | ContactOfContactModel | EventModel)[] = [];
    entityList: (CaseModel | ContactModel | ContactOfContactModel | EventModel)[] = [];
    entityListCount: IBasicCount;

    // settings
    settings: SystemSettingsModel;

    // models
    personTypesListMap: { [id: string]: ReferenceDataEntryModel };

    // constants
    EntityType = EntityType;
    ReferenceDataCategory = ReferenceDataCategory;

    recordActions: HoverRowAction[] = [
        // View Item
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_ACTION_VIEW',
            linkGenerator: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): string[] => {
                return [this.getItemRouterLink(item, 'view')];
            },
            visible: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): boolean => {
                return !item.deleted &&
                    this.authUser &&
                    this.canViewItem(item);
            }
        }),

        // Modify Item
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_ACTION_MODIFY',
            linkGenerator: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): string[] => {
                return [this.getItemRouterLink(item, 'modify')];
            },
            visible: (item: CaseModel | ContactModel | ContactOfContactModel | EventModel): boolean => {
                return !item.deleted &&
                    this.authUser &&
                    this.canModifyItem(item);
            }
        })
    ];

    /**
     * Constructor
     */
    constructor(
        protected listHelperService: ListHelperService,
        private authDataService: AuthDataService,
        private globalEntitySearchDataService: GlobalEntitySearchDataService,
        private referenceDataDataService: ReferenceDataDataService
    ) {
        super(listHelperService);
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // reference data
        const personTypes$ = this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.PERSON_TYPE).pipe(share());
        personTypes$.subscribe((personTypeCategory: ReferenceDataCategoryModel) => {
            this.personTypesListMap = _.transform(
                personTypeCategory.entries,
                (result, entry: ReferenceDataEntryModel) => {
                    // groupBy won't work here since groupBy will put an array instead of one value
                    result[entry.id] = entry;
                },
                {}
            );
        });

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // initialize Side Table Columns
        this.initializeSideTableColumns();

        // initialize pagination
        this.initPaginator();

        // retrieve entity list
        this.needsRefreshList(true);
    }

    /**
     * Release resources
     */
    ngOnDestroy() {
        // release parent resources
        super.ngOnDestroy();
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'visualId',
                label: 'LNG_ENTITY_FIELD_LABEL_VISUAL_ID'
            }),
            new VisibleColumnModel({
                field: 'firstName',
                label: 'LNG_ENTITY_FIELD_LABEL_FIRST_NAME'
            }),
            new VisibleColumnModel({
                field: 'lastName',
                label: 'LNG_ENTITY_FIELD_LABEL_LAST_NAME'
            })
        ];
    }

    /**
     * Refresh list
     */
    refreshList(finishCallback: (records: any[]) => void) {
        // get all items
        this.entityListAll = this.globalEntitySearchDataService.getData();

        // display only items from this page
        this.entityList = [];
        if (
            this.queryBuilder.paginator &&
            !_.isEmpty(this.entityListAll)
        ) {
            this.entityList = this.entityListAll.slice(
                this.queryBuilder.paginator.skip,
                this.queryBuilder.paginator.skip + this.queryBuilder.paginator.limit
            );
        }

        // refresh the total count
        this.refreshListCount();

        // flag if list is empty
        this.checkEmptyList(this.entityList);

        // finished
        finishCallback(this.entityList);
    }

    /**
     * Get total number of items
     */
    refreshListCount() {
        this.entityListCount = {
            count: this.entityListAll ?
                this.entityListAll.length :
                0
        };
    }

    /**
     * Retrieve Person Type color
     */
    getPersonTypeColor(personType: string) {
        const personTypeData = _.get(this.personTypesListMap, personType);
        return _.get(personTypeData, 'colorCode', '');
    }

    /**
     * Check if we can view item
     * @param {Object} item
     * @returns {boolean}
     */
    canViewItem(item: CaseModel | ContactModel | ContactOfContactModel | EventModel): boolean {
        // check if we can modify item
        switch (item.type) {
            case EntityType.CASE:
                return CaseModel.canView(this.authUser);
            case EntityType.CONTACT:
                return ContactModel.canView(this.authUser);
            case EntityType.CONTACT_OF_CONTACT:
                return ContactOfContactModel.canModify(this.authUser);
            case EntityType.EVENT:
                return EventModel.canView(this.authUser);
        }

        return false;
    }

    /**
     * Check if we can modify item
     * @param {Object} item
     * @returns {boolean}
     */
    canModifyItem(item: CaseModel | ContactModel | ContactOfContactModel | EventModel): boolean {
        // check if we can modify item
        switch (item.type) {
            case EntityType.CASE:
                return CaseModel.canModify(this.authUser);
            case EntityType.CONTACT:
                return ContactModel.canModify(this.authUser);
            case EntityType.CONTACT_OF_CONTACT:
                return ContactOfContactModel.canModify(this.authUser);
            case EntityType.EVENT:
                return EventModel.canModify(this.authUser);
        }

        return false;
    }

    /**
     * Get the link to redirect to view page depending on item type and action
     * @param {Object} item
     * @param {string} action
     * @returns {string}
     */
    getItemRouterLink(item: CaseModel | ContactModel | ContactOfContactModel | EventModel, action: string): string {
        switch (item.type) {
            case EntityType.CASE:
                return `/cases/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
            case EntityType.CONTACT:
                return `/contacts/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
            case EntityType.CONTACT_OF_CONTACT:
                return `/contacts-of-contacts/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
            case EntityType.EVENT:
                return `/events/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
        }

        return '';
    }
}
