// import each page component
import { EventsListComponent } from './events-list/events-list.component';
import { CreateEventComponent } from './create-event/create-event.component';
import { ModifyEventComponent } from './modify-event/modify-event.component';

// export each page component individually
export * from './events-list/events-list.component';
export * from './create-event/create-event.component';
export * from './modify-event/modify-event.component';

// export the list of all page components
export const pageComponents: any[] = [
    EventsListComponent,
    CreateEventComponent,
    ModifyEventComponent
];
