import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';

@Component({
    selector: 'app-modify-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-contact.component.html',
    styleUrls: ['./modify-contact.component.less']
})
export class ModifyContactComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts'),
        new BreadcrumbItemModel('LNG_PAGE_MODIFY_CONTACT_TITLE', '.', true)
    ];

    contactId: string;
    outbreakId: string;

    contactData: ContactModel = new ContactModel();
    ageSelected: boolean = true;

    gendersList$: Observable<any[]>;
    riskLevelsList$: Observable<any[]>;

    constructor(
        private genericDataService: GenericDataService,
        private route: ActivatedRoute,
        private outbreakDataService: OutbreakDataService,
        private contactDataService: ContactDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService,
        private router: Router
    ) {}

    ngOnInit() {
        this.gendersList$ = this.genericDataService.getGendersList();
        this.riskLevelsList$ = this.genericDataService.getCaseRiskLevelsList();

        this.route.params.subscribe(params => {
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
                            this.contactData = contactDataReturned;
                        });
                });
        });
    }

    /**
     * Switch between Age and Date of birth
     */
    switchAgeDob(ageSelected: boolean = true) {
        this.ageSelected = ageSelected;
    }

    modifyContact(form: NgForm) {
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // omit fields that are NOT visible
        if (this.ageSelected) {
            delete dirtyFields.dob;
        } else {
            delete dirtyFields.age;
        }

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // get selected outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {

                // modify the contact
                this.contactDataService
                    .modifyContact(selectedOutbreak.id, this.contactId, dirtyFields)
                    .catch((err) => {
                        this.snackbarService.showError(err.message);

                        return ErrorObservable.create(err);
                    })
                    .subscribe(() => {
                        this.snackbarService.showSuccess('Contact saved!');

                        // navigate to listing page
                        this.router.navigate(['/contacts']);
                    });
            });
    }
}
