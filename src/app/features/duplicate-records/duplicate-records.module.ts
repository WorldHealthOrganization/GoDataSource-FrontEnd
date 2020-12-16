import { NgModule } from '@angular/core';
import { HotTableModule } from '@handsontable/angular';

// modules
import { routing } from './duplicate-records.module.routing';
import { SharedModule } from '../../shared/shared.module';

// components
import * as fromPages from './pages';

@NgModule({
    imports: [
        routing,
        SharedModule,
        HotTableModule.forRoot()
    ],
    declarations: [
        ...fromPages.pageComponents
    ],
    entryComponents: []
})
export class DuplicateRecordsModule {
}
