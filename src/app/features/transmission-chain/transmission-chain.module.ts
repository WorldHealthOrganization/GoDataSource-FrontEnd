import { NgModule } from '@angular/core';

// modules
import { routing } from './transmission-chain.module.routing';
import { SharedModule } from '../../shared/shared.module';
import { WorldMapModule } from '../../common-modules/world-map/world-map.module';

// components
import * as fromPages from './pages';
import * as fromComponents from './components';

@NgModule({
    imports: [
        routing,
        SharedModule,
        WorldMapModule
    ],
    declarations: [
        ...fromPages.pageComponents,
        ...fromComponents.components
    ],
    entryComponents: []
})
export class TransmissionChainModule {
}
