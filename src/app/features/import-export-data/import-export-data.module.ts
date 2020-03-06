import { NgModule } from '@angular/core';
import { FileUploadModule } from 'ng2-file-upload';

// modules
import { routing } from './import-export.module.routing';
import { SharedModule } from '../../shared/shared.module';

// components
import * as fromPages from './pages';
import { ImportContactOfContactDataComponent } from './pages/import-contact-of-contact-data/import-contact-of-contact-data.component';

@NgModule({
    imports: [
        routing,
        SharedModule,
        FileUploadModule
    ],
    declarations: [
        ...fromPages.pageComponents,
        ImportContactOfContactDataComponent
    ],
    entryComponents: []
})
export class ImportExportDataModule { }
