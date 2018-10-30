import { NgModule } from '@angular/core';

// modules
import { routing } from './outbreak.module.routing';
import { SharedModule } from '../../shared/shared.module';
// components
import * as fromPages from './pages';
// services

import * as fromServices from './services';

@NgModule({
    imports: [
        routing,
        SharedModule

    ],
    declarations: [
        ...fromPages.pageComponents
    ],
    providers: [
        ...fromServices.services
    ],
    entryComponents: []
})
export class OutbreakModule {
}
