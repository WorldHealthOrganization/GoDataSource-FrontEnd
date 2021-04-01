import { NgModule } from '@angular/core';

// modules
import { routing } from './location.module.routing';
import { SharedModule } from '../../shared/shared.module';

// components
import * as fromPages from './pages';

@NgModule({
    imports: [
        routing,
        SharedModule
    ],
    declarations: [
        ...fromPages.pageComponents
    ]
})
export class LocationModule {
}
