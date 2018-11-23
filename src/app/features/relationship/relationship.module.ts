import { NgModule } from '@angular/core';

// modules
import { routing } from './relationship.module.routing';
import { SharedModule } from '../../shared/shared.module';

// components
import * as fromComponents from './components';
import * as fromPages from './pages';

@NgModule({
    imports: [
        routing,
        SharedModule

    ],
    declarations: [
        ...fromComponents.components,
        ...fromPages.pageComponents
    ],
    entryComponents: []
})
export class RelationshipModule {
}
