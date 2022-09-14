import { NgModule } from '@angular/core';
import { routing } from './relationship.module.routing';
import { SharedModule } from '../../shared/shared.module';
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
export class RelationshipModule {}
