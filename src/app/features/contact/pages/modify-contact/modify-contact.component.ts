import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { ContactModel } from '../../../../core/models/contact.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { Moment } from 'moment';

@Component({
    selector: 'app-modify-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-contact.component.html',
    styleUrls: ['./modify-contact.component.less']
})
export class ModifyContactComponent extends ViewModifyComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
    ];

    // authenticated user
    authUser: UserModel;

    contactId: string;
    outbreakId: string;

    contactData: ContactModel = new ContactModel();

    genderList$: Observable<any[]>;
    riskLevelsList$: Observable<any[]>;
    occupationsList$: Observable<any[]>;

    // provide constants to template
    EntityType = EntityType;

    serverToday: Moment = null;

    constructor(
        private referenceDataDataService: ReferenceDataDataService,
        protected route: ActivatedRoute,
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private contactDataService: ContactDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService,
        private router: Router,
        private genericDataService: GenericDataService
    ) {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.riskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);
        this.occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);

        // get today time
        this.genericDataService
            .getServerUTCToday()
            .subscribe((curDate) => {
                this.serverToday = curDate;
            });

        this.route.params
            .subscribe((params: {contactId}) => {
                this.contactId = params.contactId;

                // get current outbreak
                this.outbreakDataService
                    .getSelectedOutbreak()
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.outbreakId = selectedOutbreak.id;

                        // get contact
                        this.contactDataService
                            .getContact(selectedOutbreak.id, this.contactId)
                            .subscribe(contactDataReturned => {
                                this.contactData = new ContactModel(contactDataReturned);
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel(
                                        this.viewOnly ? 'LNG_PAGE_VIEW_CONTACT_TITLE' : 'LNG_PAGE_MODIFY_CONTACT_TITLE',
                                        '.',
                                        true,
                                        {},
                                        this.contactData
                                    )
                                );
                            });
                    });
            });
    }

    /**
     * Check if we have write access to contacts
     * @returns {boolean}
     */
    hasContactWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CONTACT);
    }

    modifyContact(form: NgForm) {
        // validate form
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // retrieve dirty fields
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // add age & dob information
        if (dirtyFields.ageDob) {
            dirtyFields.age = dirtyFields.ageDob.age;
            dirtyFields.dob = dirtyFields.ageDob.dob;
            delete dirtyFields.ageDob;
        }

        // modify the contact
        this.contactDataService
            .modifyContact(this.outbreakId, this.contactId, dirtyFields)
            .catch((err) => {
                this.snackbarService.showError(err.message);

                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_CONTACT_ACTION_MODIFY_CONTACT_SUCCESS_MESSAGE');

                // navigate to listing page
                this.disableDirtyConfirm();
                this.router.navigate(['/contacts']);
            });
    }
}
