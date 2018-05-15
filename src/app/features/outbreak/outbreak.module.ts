import { NgModule } from '@angular/core';

// modules
import { routing } from './outbreak.module.routing';
import { SharedModule } from '../../shared/shared.module';

import { MatInputModule, MatPaginatorModule, MatProgressSpinnerModule,MatSortModule, MatTableModule } from "@angular/material";

// components
import * as fromPages from './pages';

@NgModule({
    imports: [
        routing,
        SharedModule,
        MatTableModule
    ],
    declarations: [
        ...fromPages.pageComponents
    ],
    entryComponents: []
})
export class OutbreakModule {
}
