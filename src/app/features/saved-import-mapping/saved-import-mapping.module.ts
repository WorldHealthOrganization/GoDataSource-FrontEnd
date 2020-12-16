import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { routing } from './saved-import-mapping.module.routing';

import * as fromPages from './pages';
@NgModule({
    imports: [
        routing,
        SharedModule
    ],
    declarations: [
        ...fromPages.pageComponents,
    ],
    entryComponents: []
})

export class SavedImportMappingModule {

}
