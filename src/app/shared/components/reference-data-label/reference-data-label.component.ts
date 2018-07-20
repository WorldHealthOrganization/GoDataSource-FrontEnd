import { Component, Input, ViewEncapsulation } from '@angular/core';
import { ReferenceDataDataService } from '../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../core/models/reference-data.model';
import * as _ from 'lodash';

@Component({
    selector: 'app-reference-data-label',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './reference-data-label.component.html',
    styleUrls: ['./reference-data-label.component.less']
})
export class ReferenceDataLabelComponent {
    @Input() category: ReferenceDataCategory;
    @Input() set value(entryId: string) {
        // get the category
        this.referenceDataDataService
            .getReferenceDataByCategory(this.category)
            .subscribe((category: ReferenceDataCategoryModel) => {
                // find the entry
                const entry = _.find(category.entries, {id: entryId});

                if (entry) {
                    this.entry = entry;
                }
            });
    }

    // entry of given category having the id of the given value
    entry: ReferenceDataEntryModel = new ReferenceDataEntryModel();

    constructor(
        private referenceDataDataService: ReferenceDataDataService
    ) {
    }
}
