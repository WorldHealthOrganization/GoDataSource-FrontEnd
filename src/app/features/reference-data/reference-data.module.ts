import { NgModule } from '@angular/core';

// modules
import { routing } from './reference-data.module.routing';
import { SharedModule } from '../../shared/shared.module';
import { ColorPickerModule } from 'ngx-color-picker';
import { FileUploadModule } from 'ng2-file-upload';

// components
import * as fromPages from './pages';

@NgModule({
    imports: [
        routing,
        SharedModule,
        ColorPickerModule,
        FileUploadModule
    ],
    declarations: [
        ...fromPages.pageComponents
    ],
    entryComponents: []
})
export class ReferenceDataModule {
}
