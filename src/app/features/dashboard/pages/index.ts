// import each page component
import { DashboardComponent } from './dashboard/dashboard.component';
import { ContactsOnFollowupListDashletComponent } from '../components/contacts-on-followup-list-dashlet/contacts-on-followup-list-dashlet.component';
import { ContactsPerCaseMeanDashletComponent } from '../components/contacts-per-case-mean-dashlet/contacts-per-case-mean-dashlet.component';
import { ContactsPerCaseMedianDashletComponent } from '../components/contacts-per-case-median-dashlet/contacts-per-case-median-dashlet.component';
import { CasesDeceasedDashletComponent } from '../components/cases-deceased-dashlet/cases-deceased-dashlet.component';
import { CasesHospitalisedDashletComponent } from '../components/cases-hospitalised-dashlet/cases-hospitalised-dashlet.component';
import { ContactsNotSeenDashletComponent } from '../components/contacts-not-seen-dashlet/contacts-not-seen-dashlet.component';
import { CasesLessContactsDashletComponent } from '../components/cases-less-contacts-dashlet/cases-less-contacts-dashlet.component';
import { NewCasesPreviousDaysContactsDashletComponent } from '../components/new-cases-previous-days-contacts-dashlet/new-cases-previous-days-contacts-dashlet.component';
import { ContactsSeenEachDayDashletComponent } from '../components/contacts-seen-each-day-dashlet/contacts-seen-each-day-dashlet.component';

// export each page component individually
export * from './dashboard/dashboard.component';

// export the list of all page components
export const pageComponents: any[] = [
   DashboardComponent,
   ContactsOnFollowupListDashletComponent,
   CasesDeceasedDashletComponent,
   CasesHospitalisedDashletComponent,
   ContactsPerCaseMeanDashletComponent,
   ContactsPerCaseMedianDashletComponent,
   ContactsNotSeenDashletComponent,
   CasesLessContactsDashletComponent,
   NewCasesPreviousDaysContactsDashletComponent,
   ContactsSeenEachDayDashletComponent
];

