import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { TransmissionChainModel } from '../../../../core/models/transmission-chain.model';
import { TransmissionChainDataService } from '../../../../core/services/data/transmission-chain.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Constants } from '../../../../core/models/constants';
import { Observable } from 'rxjs/Observable';

@Component({
    selector: 'app-view-transmission-chain',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './view-transmission-chain.component.html',
    styleUrls: ['./view-transmission-chain.component.less']
})
export class ViewTransmissionChainComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_TRANSMISSION_CHAINS_TITLE', null, true)
    ];

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    // list of transmission chains
    transmissionChains: Observable<TransmissionChainModel[]>;

    // provide constants to template
    Constants = Constants;

    constructor(
        private router: Router,
        private outbreakDataService: OutbreakDataService,
        private transmissionChainDataService: TransmissionChainDataService
    ) {}

    ngOnInit() {
        // subscribe to the Selected Outbreak Subject stream
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                this.transmissionChains = this.transmissionChainDataService.getTransmissionChainsList(this.selectedOutbreak.id);

                console.log(this.transmissionChains);

            });
    }

}
