import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import * as fromPages from './pages';
import { routing } from './contacts-of-contacts.module.routing';
import { WorldMapMovementModule } from '../../common-modules/world-map-movement/world-map-movement.module';

@NgModule({
    imports: [
        routing,
        SharedModule,
        WorldMapMovementModule
    ],
    declarations: [
        ...fromPages.pageComponents
    ],
    entryComponents: []
})
export class ContactsOfContactsModule {
}
