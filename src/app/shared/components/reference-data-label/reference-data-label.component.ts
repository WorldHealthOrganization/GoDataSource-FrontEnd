import { Component, Input } from '@angular/core';
import { ReferenceDataDataService } from '../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../core/models/reference-data.model';
import * as _ from 'lodash';

@Component({
  selector: 'app-reference-data-label',
  templateUrl: './reference-data-label.component.html'
})
export class ReferenceDataLabelComponent {
  @Input() listSplitter: string = ' / ';
  @Input() category: ReferenceDataCategory;

  @Input() set value(entriesIds: string | string[] | { id: string }[]) {
    // get the category
    this.referenceDataDataService
      .getReferenceDataByCategory(this.category)
      .subscribe((category: ReferenceDataCategoryModel) => {
        // find the entries
        const hasObjects: boolean = !_.isEmpty(entriesIds) && _.isObject(entriesIds[Object.keys(entriesIds)[0]]);
        let entries: ReferenceDataEntryModel | ReferenceDataEntryModel[];
        if (Array.isArray(entriesIds)) {
          entries = _.filter(
            category.entries,
            (entry) => {
              return hasObjects ?
                !_.isEmpty(_.find(entriesIds as { id: any }[], { id: entry.id })) :
                (_.indexOf(entriesIds as any[], entry.id) > -1);
            }
          );
        } else {
          entries = _.find(category.entries, { id: entriesIds as string });
        }

        if (
          entries &&
                    !_.isArray(entries)
        ) {
          entries = [entries as ReferenceDataEntryModel];
        }

        if (
          entries &&
                    (entries as ReferenceDataEntryModel[]).length > 0
        ) {
          this.entries = entries as ReferenceDataEntryModel[];
        }
      });
  }

  // entry of given category having the id of the given value
  entries: ReferenceDataEntryModel[];

  constructor(
    private referenceDataDataService: ReferenceDataDataService
  ) {
  }
}
