// modules
import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { WorldMapModule } from '../world-map/world-map.module';

// components
import * as fromComponents from './components';

@NgModule({
    imports: [
        SharedModule,
        WorldMapModule
    ],
    declarations: [
        ...fromComponents.components
    ],
    providers: [],
    exports: [
        ...fromComponents.components
    ],
    entryComponents: []
})
export class WorldMapMovementModule {
}
