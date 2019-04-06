import { NgModule } from '@angular/core';

// modules
import { routing } from './help.module.routing';
import { SharedModule } from '../../shared/shared.module';
import { NgxWigModule } from 'ngx-wig';

// components
import * as fromPages from './pages';

@NgModule({
    imports: [
        routing,
        SharedModule,
        NgxWigModule
    ],
    declarations: [
        ...fromPages.pageComponents
    ],
    entryComponents: []
})
export class HelpModule {
}
