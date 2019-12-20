import {NgModule} from '@angular/core';

import {SharedModule} from '../../shared/shared.module';

// components
import * as fromPages from './pages';
import {routing} from './contacts-of-contacts.module.routing';

@NgModule({
    imports: [
        routing,
        SharedModule
    ],
    declarations: [
        ...fromPages.pageComponents
    ],
    entryComponents: []
})
export class ContactsOfContactsModule {
}
