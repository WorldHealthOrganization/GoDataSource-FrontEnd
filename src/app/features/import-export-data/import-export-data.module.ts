import { NgModule } from '@angular/core';
import { FileUploadModule } from 'ng2-file-upload';

// modules
import { routing } from './import-export.module.routing';
import { SharedModule } from '../../shared/shared.module';

// components
import * as fromPages from './pages';

@NgModule({
    imports: [
        routing,
        SharedModule,
        FileUploadModule
    ],
    declarations: [
        ...fromPages.pageComponents
    ],
    entryComponents: []
})
export class ImportExportDataModule { }
