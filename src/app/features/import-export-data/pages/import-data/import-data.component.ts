import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ImportExportRecordType } from '../../../../core/models/constants';

@Component({
    selector: 'app-import-data',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './import-data.component.html',
    styleUrls: ['./import-data.component.less']
})
export class ImportDataComponent {
    // type of the record that we're importing
    private type: ImportExportRecordType;

    constructor(
        private router: Router,
        protected route: ActivatedRoute
    ) {
        // retrieve type of records that we want to import
        this.route.params
            .subscribe((params: { type: ImportExportRecordType }) => {
                // since we have only two types this should be enough for now
                this.type = params.type;

                // check if type is valid
                if (!Object.values(ImportExportRecordType).includes(this.type)) {
                    // invalid - redirect
                    this.router.navigate(['/']);
                }
            });
    }
}
