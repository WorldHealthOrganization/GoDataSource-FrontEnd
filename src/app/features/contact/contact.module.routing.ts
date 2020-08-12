import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import * as fromPages from './pages';
import { PERMISSION } from '../../core/models/permission.model';
import { AuthGuard } from '../../core/services/guards/auth-guard.service';
import { ViewModifyComponentAction } from '../../core/helperClasses/view-modify-component';
import { PageChangeConfirmationGuard } from '../../core/services/guards/page-change-confirmation-guard.service';

const routes: Routes = [
    // Contact list
    {
        path: '',
        component: fromPages.ContactsListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CONTACT_LIST
            ]
        }
    },
    // Create Contact
    {
        path: 'create',
        component: fromPages.CreateContactComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CONTACT_CREATE
            ]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Contact
    {
        path: ':contactId/view',
        component: fromPages.ModifyContactComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CONTACT_VIEW
            ],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Contact
    {
        path: ':contactId/modify',
        component: fromPages.ModifyContactComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CONTACT_MODIFY
            ],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Contact Questionnaire
    {
        path: ':contactId/view-questionnaire',
        component: fromPages.ModifyQuestionnaireContactComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CONTACT_VIEW
            ],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Contact Questionnaire
    {
        path: ':contactId/modify-questionnaire',
        component: fromPages.ModifyQuestionnaireContactComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CONTACT_MODIFY
            ],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // Bulk Add Contacts
    {
        path: 'create-bulk',
        component: fromPages.BulkCreateContactsComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CONTACT_BULK_CREATE
            ]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // Bulk Modify Contacts
    {
        path: 'modify-bulk',
        component: fromPages.BulkModifyContactsComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CONTACT_BULK_MODIFY
            ]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },

    // View Contact movement
    {
        path: ':contactId/movement',
        component: fromPages.ViewMovementContactComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CONTACT_VIEW_MOVEMENT_MAP
            ]
        }
    },

    // View Contact chronology
    {
        path: ':contactId/chronology',
        component: fromPages.ViewChronologyContactComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.CONTACT_VIEW_CHRONOLOGY_CHART
            ]
        }
    },

    // Daily Follow-ups list
    {
        path: 'follow-ups',
        component: fromPages.ContactDailyFollowUpsListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.FOLLOW_UP_LIST
            ]
        }
    },
    // Follow-ups list from a case
    {
        path: 'case-related-follow-ups/:caseId',
        component: fromPages.ContactDailyFollowUpsListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.FOLLOW_UP_LIST
            ]
        }
    },
    // Follow-ups list from a contact
    {
        path: 'contact-related-follow-ups/:contactId',
        component: fromPages.IndividualContactFollowUpsListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.FOLLOW_UP_LIST
            ]
        }
    },
    // Range Follow-ups list
    {
        path: 'range-follow-ups',
        component: fromPages.ContactRangeFollowUpsListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.FOLLOW_UP_LIST_RANGE
            ]
        }
    },
    // Create Follow Up
    {
        path: ':contactId/follow-ups/create',
        component: fromPages.CreateContactFollowUpComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.FOLLOW_UP_CREATE
            ]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Follow Up
    {
        path: ':contactId/follow-ups/:followUpId/view',
        component: fromPages.ModifyContactFollowUpComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.FOLLOW_UP_VIEW
            ],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Follow Up
    {
        path: ':contactId/follow-ups/:followUpId/modify',
        component: fromPages.ModifyContactFollowUpComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.FOLLOW_UP_MODIFY
            ],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // View Contact Questionnaire
    {
        path: ':contactId/follow-ups/:followUpId/view-questionnaire',
        component: fromPages.ModifyQuestionnaireContactFollowUpComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.FOLLOW_UP_VIEW
            ],
            action: ViewModifyComponentAction.VIEW
        }
    },
    // Modify Contact Questionnaire
    {
        path: ':contactId/follow-ups/:followUpId/modify-questionnaire',
        component: fromPages.ModifyQuestionnaireContactFollowUpComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.FOLLOW_UP_MODIFY
            ],
            action: ViewModifyComponentAction.MODIFY
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    },
    // Modify list of Follow Ups
    {
        path: 'follow-ups/modify-list',
        component: fromPages.ModifyContactFollowUpListComponent,
        canActivate: [AuthGuard],
        data: {
            permissions: [
                PERMISSION.FOLLOW_UP_BULK_MODIFY
            ]
        },
        canDeactivate: [
            PageChangeConfirmationGuard
        ]
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
