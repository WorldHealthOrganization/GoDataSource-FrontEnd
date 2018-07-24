// import each page component
import { DashboardComponent } from './dashboard/dashboard.component';
import { ContactsOnFollowupListDashletComponent } from '../components/contacts-on-followup-list-dashlet/contacts-on-followup-list-dashlet.component';

// export each page component individually
export * from './dashboard/dashboard.component';

// export the list of all page components
export const pageComponents: any[] = [
   DashboardComponent,
    ContactsOnFollowupListDashletComponent
];

