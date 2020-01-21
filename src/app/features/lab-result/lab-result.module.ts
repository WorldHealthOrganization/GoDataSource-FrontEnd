import { NgModule } from '@angular/core';

// modules
import { routing } from './lab-result.module.routing';
import { SharedModule } from '../../shared/shared.module';

// components
import * as fromPages from './pages';
import * as fromComponents from './components';

@NgModule({
    imports: [
        routing,
        SharedModule
    ],
    declarations: [
        ...fromPages.pageComponents,
        ...fromComponents.components
    ],
    entryComponents: []
})
export class LabResultModule {
}
