import { NgModule } from '@angular/core';

// modules
import { routing } from './case.module.routing';
import { SharedModule } from '../../shared/shared.module';
import { WorldMapMovementModule } from '../../common-modules/world-map-movement/world-map-movement.module';

// components
import * as fromPages from './pages';
import * as fromComponents from './components';

@NgModule({
    imports: [
        routing,
        SharedModule,
        WorldMapMovementModule
    ],
    declarations: [
        ...fromPages.pageComponents,
        ...fromComponents.components
    ],
    entryComponents: []
})
export class CaseModule {
}
