import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { TransmissionChainModel } from '../../../../core/models/transmission-chain.model';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ApplyListFilter, Constants } from '../../../../core/models/constants';
import { ListFilterDataService } from '../../../../core/services/data/list-filter.data.service';

@Component({
    selector: 'app-transmission-chains-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './transmission-chains-list.component.html',
    styleUrls: ['./transmission-chains-list.component.less']
})
export class TransmissionChainsListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_TRANSMISSION_CHAINS_TITLE', null, true)
    ];

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    // list of transmission chains
    transmissionChains$: Observable<TransmissionChainModel[]>;

    // provide constants to template
    Constants = Constants;

    constructor(
        private router: Router,
        private outbreakDataService: OutbreakDataService,
        private transmissionChainDataService: TransmissionChainDataService,
        private route: ActivatedRoute,
        protected listFilterDataService: ListFilterDataService
    ) {
        super(listFilterDataService, route.queryParams);
    }

    ngOnInit() {
        // subscribe to the Selected Outbreak Subject stream
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // re-load the list when the Selected Outbreak is changed
                this.refreshList();
            });
    }

    /**
     * Re(load) the Transmission Chains list, based on the applied filter, sort criterias
     */
    refreshList() {
        if (this.selectedOutbreak) {
            if (this.appliedListFilter === ApplyListFilter.NO_OF_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES) {
                this.transmissionChains$ = this.transmissionChainDataService.getTransmissionChainsFromContactsWhoBecameCasesList(this.selectedOutbreak.id, this.queryBuilder);
            } else {
                this.transmissionChains$ = this.transmissionChainDataService.getIndependentTransmissionChainsList(this.selectedOutbreak.id, this.queryBuilder);
            }
        }
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        return [
            'firstContactDate',
            'rootCase',
            'noCases',
            'noAliveCases',
            'active'
        ];
    }
}
