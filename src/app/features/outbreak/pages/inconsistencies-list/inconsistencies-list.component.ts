import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { Observable } from 'rxjs';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { EntityType } from '../../../../core/models/entity-type';
import { InconsistencyModel } from '../../../../core/models/inconsistency.model';
import * as _ from 'lodash';
import { InconsistencyIssueEnum } from '../../../../core/enums/inconsistency-issue.enum';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ActivatedRoute } from '@angular/router';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { tap } from 'rxjs/operators';

@Component({
    selector: 'app-inconsistencies-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './inconsistencies-list.component.html',
    styleUrls: ['./inconsistencies-list.component.less']
})
export class InconsistenciesListComponent extends ListComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // Outbreak
    outbreak: OutbreakModel;

    // authenticated user
    authUser: UserModel;

    // entities
    entitiesList$: Observable<(CaseModel | ContactModel | EventModel)[]>;

    personTypesListMap: { [id: string]: ReferenceDataEntryModel };

    // constants
    EntityType = EntityType;
    ReferenceDataCategory = ReferenceDataCategory;

    /**
     * Constructor
     */
    constructor(
        protected snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private authDataService: AuthDataService,
        private i18nService: I18nService,
        protected route: ActivatedRoute,
        private referenceDataDataService: ReferenceDataDataService
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

        // reference data
        const personTypes$ = this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.PERSON_TYPE).share();
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

        // authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // retrieve route params
        this.route.params
            .subscribe((params: { outbreakId }) => {
                this.outbreakDataService
                    .getOutbreak(params.outbreakId)
                    .subscribe((outbreak: OutbreakModel) => {
                        // outbreak
                        this.outbreak = outbreak;

                        // init breadcrumbs
                        this.initBreadcrumbs();

                        // ...and re-load the list when the Selected Outbreak is changed
                        this.needsRefreshList(true);
                    });
            });
    }

    /**
     * Re(load) list
     */
    refreshList() {
        if (this.outbreak) {
            this.entitiesList$ = this.outbreakDataService.getPeopleInconsistencies(this.outbreak.id, this.queryBuilder)
                .pipe(tap(this.checkEmptyList.bind(this)));
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
        if (this.outbreak) {
            // outbreak details
            const viewOrModify: string = this.authUser.hasPermissions(PERMISSION.WRITE_OUTBREAK) ?
                'modify' :
                'view';
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    this.outbreak.name,
                    `/outbreaks/${this.outbreak.id}/${viewOrModify}`,
                    false
                )
            );

            // add inconsistencies breadcrumb
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    'LNG_PAGE_LIST_INCONSISTENCIES_TITLE',
                    '.',
                    true
                )
            );
        }
    }

    /**
     * Retrieve Person Type color
     */
    getPersonTypeColor(personType) {
        const personTypeData = _.get(this.personTypesListMap, personType);
        return _.get(personTypeData, 'colorCode', '');
    }

    /**
     * Table columns
     */
    getTableColumns(): string[] {
        return [
            'lastName',
            'firstName',
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
    getItemRouterLink (item: CaseModel | ContactModel | EventModel, action: string) {
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
    getAccessPermissions(item: CaseModel | ContactModel | EventModel) {
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

    /**
     * Inconsistencies
     * @param item
     */
    inconsistencyToText(item: CaseModel | ContactModel | EventModel): string {
        // construct inconsistencies text
        let text: string = '';
        _.each(item.inconsistencies, (inconsistency: InconsistencyModel) => {
            // determine label
            let label: string;
            switch (inconsistency.issue) {
                case InconsistencyIssueEnum.LNG_PAGE_INCONSISTENCY_LABEL_BIGGER:
                    label = 'LNG_PAGE_INCONSISTENCY_LABEL_BIGGER';
                    break;
                case InconsistencyIssueEnum.LNG_PAGE_INCONSISTENCY_LABEL_BIGGER_OR_EQUAL:
                    label = 'LNG_PAGE_INCONSISTENCY_LABEL_BIGGER_OR_EQUAL';
                    break;
                case InconsistencyIssueEnum.LNG_PAGE_INCONSISTENCY_LABEL_SMALLER:
                    label = 'LNG_PAGE_INCONSISTENCY_LABEL_SMALLER';
                    break;
                case InconsistencyIssueEnum.LNG_PAGE_INCONSISTENCY_LABEL_SMALLER_OR_EQUAL:
                    label = 'LNG_PAGE_INCONSISTENCY_LABEL_SMALLER_OR_EQUAL';
                    break;
                case InconsistencyIssueEnum.LNG_PAGE_INCONSISTENCY_LABEL_NOT_EQUAL:
                    label = 'LNG_PAGE_INCONSISTENCY_LABEL_NOT_EQUAL';
                    break;
                case InconsistencyIssueEnum.LNG_PAGE_INCONSISTENCY_LABEL_EQUAL:
                    label = 'LNG_PAGE_INCONSISTENCY_LABEL_EQUAL';
                    break;
            }

            // translate label
            label = this.i18nService.instant(
                label, {
                    date1: inconsistency.dates.length > 0 ? this.i18nService.instant(inconsistency.dates[0].label) : '-',
                    date2: inconsistency.dates.length > 1 ? this.i18nService.instant(inconsistency.dates[1].label) : '-'
                }
            );

            // append inconsistency
            text += (text.length < 1 ? '' : ' / ') + label;
        });

        // finished
        return text;
    }
}
