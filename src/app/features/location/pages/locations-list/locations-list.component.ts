import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ActivatedRoute } from '@angular/router';
import 'rxjs/add/operator/filter';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { LocationModel } from '../../../../core/models/location.model';
import { Observable } from 'rxjs/Observable';
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import * as _ from 'lodash';
import { HierarchicalLocationModel } from '../../../../core/models/hierarchical-location.model';

@Component({
    selector: 'app-contacts-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './locations-list.component.html',
    styleUrls: ['./locations-list.component.less']
})
export class LocationsListComponent extends ListComponent implements OnInit {
    public breadcrumbs: BreadcrumbItemModel[] = [];

    locationsList$: Observable<LocationModel[]>;
    yesNoOptionsList$: Observable<any[]>;
    parentId: string;

    constructor(
        private outbreakDataService: OutbreakDataService,
        private locationDataService: LocationDataService,
        private genericDataService: GenericDataService,
        private route: ActivatedRoute
    ) {
        super();
      }

    ngOnInit() {
        // lists
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

        // reload data
        this.route.params
            .subscribe((params: { parentId }) => {
                // set parent
                this.parentId = params.parentId;

                // reset breadcrumbs
                this.breadcrumbs = [
                    new BreadcrumbItemModel(
                        'LNG_PAGE_LIST_LOCATIONS_TITLE',
                        '/locations',
                        true
                    )
                ];

                // retrieve parents of this parent and create breadcrumbs if necessary
                if (this.parentId) {
                    // construct query builder that we need
                    const queryBuilder: RequestQueryBuilder = new RequestQueryBuilder();
                    queryBuilder.filter
                        .where({
                            id: this.parentId
                        }, true)
                        .flag(
                            'includeChildren',
                            false
                        );

                    // retrieve parent locations
                    this.locationDataService.getLocationsHierarchicalList(queryBuilder).subscribe((locationParents) => {
                        if (locationParents && locationParents.length > 0) {
                            let locationP = locationParents[0];
                            while (!_.isEmpty(locationP.location)) {
                                // make previous breadcrumb not the active one
                                this.breadcrumbs[this.breadcrumbs.length - 1].active = false;

                                // add breadcrumb
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel(
                                        locationP.location.name,
                                        `/locations/${locationP.location.id}/children`,
                                        true
                                    )
                                );

                                // next location
                                locationP = _.isEmpty(locationP.children) ? {} as HierarchicalLocationModel : locationP.children[0];
                            }
                        }
                    });
                }

                // refresh list
                this.refreshList();
            });
    }

    /**
     * Re(load) the Contacts list
     */
    refreshList() {
        // retrieve the list of Contacts
        this.locationsList$ = this.locationDataService.getLocationsListByParent(this.parentId, this.queryBuilder);
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        // default columns that we should display
        const columns = [
            'name',
            'synonyms',
            'active',
            'populationDensity',
            'actions'
        ];

        // finished
        return columns;
    }
}
