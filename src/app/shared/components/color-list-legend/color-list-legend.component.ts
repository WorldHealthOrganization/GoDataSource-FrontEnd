import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { ReferenceDataCategory, ReferenceDataEntryModel } from '../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../core/services/data/reference-data.data.service';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { LegendDot } from '../../../core/models/legend-dot.model';

@Component({
    selector: 'app-color-list-legend',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './color-list-legend.component.html',
    styleUrls: ['./color-list-legend.component.less']
})
export class ColorListLegendComponent implements OnInit {

    @Input() referenceDataCategory;

    optionsList$: Observable<any[]>;

    ReferenceDataCategory = ReferenceDataCategory;

    constructor(
        private referenceDataDataService: ReferenceDataDataService
    ) {
    }

    ngOnInit() {
        switch (this.referenceDataCategory) {
            case ReferenceDataCategory.RISK_LEVEL :
                this.getRiskLevelDots();
                break;
            case ReferenceDataCategory.PERSON_TYPE :
                this.getPersonTypeDots();
                break;
        }
    }

    /**
     * Get risk level dots
     */
    getRiskLevelDots() {
        this.optionsList$ = this.referenceDataDataService.getReferenceDataByCategory(this.referenceDataCategory).map((response) => {
            return _.map(response.entries, (riskLevel: ReferenceDataEntryModel) => {
                return new LegendDot(riskLevel.id, riskLevel.value, riskLevel.colorCode);
            });
        });
    }

    /**
     * Get person type dots
     */
    getPersonTypeDots() {
        this.optionsList$ = this.referenceDataDataService.getReferenceDataByCategory(this.referenceDataCategory).map((response) => {
            return _.map(response.entries, (personType: ReferenceDataEntryModel) => {
                return new LegendDot(personType.id, personType.value, personType.colorCode);
            });
        });
    }

    getDotColor(item: LegendDot) {
        return item.colorCode ? item.colorCode : '';
    }
}
