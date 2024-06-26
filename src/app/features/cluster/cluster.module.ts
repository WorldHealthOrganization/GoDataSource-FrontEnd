import { NgModule } from '@angular/core';
import { routing } from './cluster.module.routing';
import { SharedModule } from '../../shared/shared.module';

// components
import * as fromPages from './pages';


@NgModule({
  imports: [
    routing,
    SharedModule
  ],
  declarations: [
    ...fromPages.pageComponents
  ]
})
export class ClusterModule {
}
