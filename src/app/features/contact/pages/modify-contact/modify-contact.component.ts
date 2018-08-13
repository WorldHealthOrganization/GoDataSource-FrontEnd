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
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { Constants } from '../../../../core/models/constants';

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

    contactId: string;
    outbreakId: string;

    contactData: ContactModel = new ContactModel();
    ageSelected: boolean = true;

    genderList$: Observable<any[]>;
    riskLevelsList$: Observable<any[]>;

    // provide constants to template
    EntityType = EntityType;

    Constants = Constants;

    constructor(
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService,
        protected route: ActivatedRoute,
        private outbreakDataService: OutbreakDataService,
        private contactDataService: ContactDataService,
        private formHelper: FormHelperService,
        private snackbarService: SnackbarService,
        private router: Router
    ) {
        super(route);
    }

    ngOnInit() {
        this.genderList$ = this.genericDataService.getGenderList();
        this.riskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);

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
                this.router.navigate(['/contacts']);
            });
    }
}
