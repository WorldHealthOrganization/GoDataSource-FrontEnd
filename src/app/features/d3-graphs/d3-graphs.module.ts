import { NgModule } from '@angular/core';
import { routing } from './d3-graphs.module.routing';
import { SharedModule } from '../../shared/shared.module';
import * as fromPages from './pages';
import * as fromServices from './services';

@NgModule({
  imports: [
    routing,
    SharedModule
  ],
  declarations: [
    ...fromPages.pageComponents
  ],
  providers: [
    ...fromServices.services
  ]
})
export class D3GraphsModule {
}
