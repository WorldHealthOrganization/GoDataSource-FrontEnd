import { NgModule } from '@angular/core';

// modules
import { routing } from './reference-data.module.routing';
import { SharedModule } from '../../shared/shared.module';
import { FileUploadModule } from 'ng2-file-upload';

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
  ]
})
export class ReferenceDataModule {
}
