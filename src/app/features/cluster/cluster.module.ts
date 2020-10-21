import { NgModule } from '@angular/core';
import { routing } from './cluster.module.routing';
import { SharedModule } from '../../shared/shared.module';
import { ColorPickerModule } from 'ngx-color-picker';

// components
import * as fromPages from './pages';


@NgModule({
    imports: [
        routing,
        ColorPickerModule,
        SharedModule
    ],
    declarations: [
        ...fromPages.pageComponents
    ],
    entryComponents: []
})
export class ClusterModule {
}
