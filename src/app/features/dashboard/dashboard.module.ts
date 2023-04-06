import { NgModule } from '@angular/core';

// modules
import { routing } from './dashboard.module.routing';
import { SharedModule } from '../../shared/shared.module';

// components
import * as fromPages from './pages';
import * as fromComponents from './components';

@NgModule({
  imports: [
    routing,
    SharedModule
  ],
  declarations: [
    ...fromPages.pageComponents,
    ...fromComponents.components
  ]
})
export class DashboardModule {
}
