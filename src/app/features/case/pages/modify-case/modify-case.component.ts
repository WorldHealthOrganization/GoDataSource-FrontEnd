import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import * as _ from 'lodash';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable } from 'rxjs/Observable';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { LocationModel } from "../../../../core/models/location.model";
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { Subject } from 'rxjs/Subject';
import { AddressModel } from "../../../../core/models/address.model";
import { DocumentModel } from "../../../../core/models/document.model";
import { current } from "codelyzer/util/syntaxKind";

@Component({
    selector: 'app-modify-case',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-case.component.html',
    styleUrls: ['./modify-case.component.less']
})
export class ModifyCaseComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('Cases', '/cases'),
        new BreadcrumbItemModel('Modify Case', '.', true)
    ];

    outbreakId: string;
    caseId: string;

    caseData: CaseModel = new CaseModel();
    ageSelected: boolean = true;

    gendersList$: Observable<any[]>;
    locationsList$: Observable<LocationModel[]>;
    caseClassificationsList$: Observable<any[]>;
    caseRiskLevelsList$: Observable<any[]>;
    documentTypesList$: Observable<any[]>;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private locationDataService: LocationDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService
    ) {
        this.gendersList$ = this.genericDataService.getGendersList();
        this.locationsList$ = this.locationDataService.getLocationsList();
        this.caseClassificationsList$ = this.genericDataService.getCaseClassificationsList();
        this.caseRiskLevelsList$ = this.genericDataService.getCaseRiskLevelsList();
        this.documentTypesList$ = this.genericDataService.getDocumentTypesList();

        this.route.params.subscribe(params => {
            this.caseId = params.caseId;

            // get current outbreak
            const selectedOutbreakCompleted$ = new Subject();
            this.outbreakDataService
                .getSelectedOutbreak()
                .takeUntil(selectedOutbreakCompleted$)
                .subscribe((currentOutbreak: OutbreakModel) => {

                    selectedOutbreakCompleted$.next();
                    selectedOutbreakCompleted$.complete();
                    this.outbreakId = currentOutbreak.id;
                    // get case
                    this.caseDataService
                        .getCase(currentOutbreak.id, this.caseId)
                        .subscribe(caseDataReturned => {
                            this.caseData = caseDataReturned;
                        });
                });


        });

    }

    ngOnInit() {
    }

    /**
     * Add a new address slot in UI
     */
    addAddress() {
        this.caseData.addresses.push(new AddressModel());
    }

    /**
     * Remove an address from the list of addresses
     */
    deleteAddress(index) {
        this.caseData.addresses.splice(index, 1);
    }

    /**
     * Add a new document slot in UI
     */
    addDocument() {
        this.caseData.documents.push(new DocumentModel());
    }

    /**
     * Remove a document from the list of documents
     */
    deleteDocument(index) {
        this.caseData.documents.splice(index, 1);
    }

    /**
     * Add a new Hospitalization Date slot in UI
     */
    addHospitalizationDate() {
        this.caseData.hospitalizationDates.push(null);
    }

    /**
     * Remove a Hospitalization Date from the list
     */
    deleteHospitalizationDate(index) {
        this.caseData.hospitalizationDates.splice(index, 1);
    }

    /**
     * Add a new Isolation Date slot in UI
     */
    addIsolationDate() {
        this.caseData.isolationDates.push(null);
    }

    /**
     * Remove an Isolation Date from the list
     */
    deleteIsolationDate(index) {
        this.caseData.isolationDates.splice(index, 1);
    }

    /**
     * Switch between Age and Date of birth
     */
    switchAgeDob(ageSelected: boolean = true) {
        this.ageSelected = ageSelected;
    }

    /**
     * Modify case
     * @param form
     */
    modifyCase(form) {

        const dirtyFields: any = form.value;
        // omit fields that are NOT visible
        if (this.ageSelected) {
            delete dirtyFields.dob;
        } else {
            delete dirtyFields.age;
        }

        if (form.valid && !_.isEmpty(dirtyFields)) {
            // get current outbreak
             const selectedOutbreakSubscription = this.outbreakDataService
                 .getSelectedOutbreak()
                 .subscribe((currentOutbreak: OutbreakModel) => {
                     // selectedOutbreakSubscription.unsubscribe();
                     // modify Case
                     dirtyFields.documents = this.caseData.documents;
                     dirtyFields.addresses = this.caseData.addresses;

                     this.caseDataService
                        .modifyCase(currentOutbreak.id, this.caseId, dirtyFields)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('Case saved!');

                            // navigate to listing page
                            this.router.navigate(['/cases']);
                         });
                 });
        }
    }

}
