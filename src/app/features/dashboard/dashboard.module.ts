import { NgModule } from '@angular/core';

// modules
import { routing } from './dashboard.module.routing';
import { SharedModule } from '../../shared/shared.module';
import { NgxChartsModule } from '@swimlane/ngx-charts';

// components
import * as fromPages from './pages';
import * as fromComponents from './components';

@NgModule({
    imports: [
        routing,
        SharedModule,
        NgxChartsModule
    ],
    declarations: [
        ...fromPages.pageComponents,
        ...fromComponents.components
    ],
    entryComponents: []
})
export class DashboardModule {
}
