// import each page component
import { DashboardComponent } from './dashboard/dashboard.component';
import { ContactsOnFollowupListDashletComponent } from '../components/contacts-on-followup-list-dashlet/contacts-on-followup-list-dashlet.component';
import { ContactsPerCaseMeanDashletComponent } from '../components/contacts-per-case-mean-dashlet/contacts-per-case-mean-dashlet.component';
import { ContactsPerCaseMedianDashletComponent } from '../components/contacts-per-case-median-dashlet/contacts-per-case-median-dashlet.component';
import { CasesDeceasedComponent } from '../components/cases-deceased/cases-deceased.component';

// export each page component individually
export * from './dashboard/dashboard.component';

// export the list of all page components
export const pageComponents: any[] = [
   DashboardComponent,
   ContactsOnFollowupListDashletComponent,
   ContactsPerCaseMeanDashletComponent,
   ContactsPerCaseMedianDashletComponent,
   CasesDeceasedComponent

];

