import { NgModule } from '@angular/core';
import { HotTableModule } from '@handsontable/angular';

// modules
import { routing } from './contact.module.routing';
import { SharedModule } from '../../shared/shared.module';

// components
import * as fromPages from './pages';
import * as fromComponents from './components';

@NgModule({
    imports: [
        routing,
        SharedModule,
        HotTableModule.forRoot()
    ],
    declarations: [
        ...fromPages.pageComponents,
        ...fromComponents.components
    ],
    entryComponents: []
})
export class ContactModule {
}
