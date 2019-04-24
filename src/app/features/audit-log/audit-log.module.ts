import { NgModule } from '@angular/core';
import { MatTreeModule } from '@angular/material';

// modules
import { routing } from './audit-log.module.routing';
import { SharedModule } from '../../shared/shared.module';

// components
import * as fromPages from './pages';
import * as fromComponents from './components';

// services
import * as fromServices from './services';

@NgModule({
    imports: [
        routing,
        SharedModule,
        MatTreeModule
    ],
    declarations: [
        ...fromPages.pageComponents,
        ...fromComponents.components,
    ],
    providers: [
        ...fromServices.services
    ],
    entryComponents: []
})
export class AuditLogModule {
}
