import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { ReferenceDataCategory, ReferenceDataEntryModel } from '../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../core/services/data/reference-data.data.service';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { LegendDot } from '../../../core/models/legend-dot.model';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-color-list-legend',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './color-list-legend.component.html',
    styleUrls: ['./color-list-legend.component.less']
})
export class ColorListLegendComponent implements OnInit {
    @Input() referenceDataCategory;
    @Input() title: string;

    optionsList$: Observable<any[]>;

    ReferenceDataCategory = ReferenceDataCategory;

    constructor(
        private referenceDataDataService: ReferenceDataDataService
    ) {
    }

    ngOnInit() {
        this.getDots();
    }

    /**
     * Get dots based on what reference category we have
     */
    getDots() {
        this.optionsList$ = this.referenceDataDataService.getReferenceDataByCategory(this.referenceDataCategory)
            .pipe(
                map((response) => {
                    return _.map(response.entries, (entry: ReferenceDataEntryModel) => {
                        return new LegendDot(entry.id, entry.value, entry.colorCode);
                    });
                })
            );
    }
}
