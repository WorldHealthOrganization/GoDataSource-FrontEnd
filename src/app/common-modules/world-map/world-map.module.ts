// modules
import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';

// components
import * as fromComponents from './components';

@NgModule({
    imports: [
        SharedModule
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
export class WorldMapModule {
}
