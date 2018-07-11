// import each page component
import { FollowUpsListComponent } from './follow-ups-list/follow-ups-list.component';
import { CreateFollowUpComponent } from './create-follow-up/create-follow-up.component';

// export each page component individually
export * from './follow-ups-list/follow-ups-list.component';
export * from './create-follow-up/create-follow-up.component';

// export the list of all page components
export const pageComponents: any[] = [
    FollowUpsListComponent,
    CreateFollowUpComponent
];
