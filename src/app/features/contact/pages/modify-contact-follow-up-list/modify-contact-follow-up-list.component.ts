import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components';
import { NgForm, NgModel } from '@angular/forms';
import { GroupBase } from '../../../../shared/xt-forms/core';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import 'rxjs/add/observable/forkJoin';
import { Observable } from 'rxjs/Observable';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { TeamModel } from '../../../../core/models/team.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { Constants } from '../../../../core/models/constants';

@Component({
    selector: 'app-modify-contact-follow-ups-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-contact-follow-up-list.component.html',
    styleUrls: ['./modify-contact-follow-up-list.component.less']
})
export class ModifyContactFollowUpListComponent extends ConfirmOnFormChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts'),
        new BreadcrumbItemModel('LNG_PAGE_LIST_FOLLOW_UPS_TITLE', '/contacts/follow-ups'),
        new BreadcrumbItemModel('LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_TITLE', '.', true)
    ];

    // selected outbreak
    selectedOutbreak: OutbreakModel;

    followUps: FollowUpModel[] = [];

    dailyStatusTypeOptions$: Observable<any[]>;

    teamsList$: Observable<TeamModel[]>;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private followUpsDataService: FollowUpsDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService,
        private formHelper: FormHelperService,
        private referenceDataDataService: ReferenceDataDataService,
        private teamDataService: TeamDataService
    ) {
        super();
    }

    ngOnInit() {
        // daily status types
        this.dailyStatusTypeOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_DAILY_FOLLOW_UP_STATUS);

        this.teamsList$ = this.teamDataService.getTeamsList();

        // get selected outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // selected outbreak
                this.selectedOutbreak = selectedOutbreak;

                // retrieve contact follow-ups
                this.route.queryParams
                    .subscribe((queryParams: { followUpsIds }) => {
                        if (_.isEmpty(queryParams.followUpsIds)) {
                            this.snackbarService.showError('LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_ERROR_NO_FOLLOW_UPS_SELECTED');

                            // No entities selected
                            this.disableDirtyConfirm();
                            this.router.navigate(['/contacts/follow-ups']);
                        } else {
                            // configure follow-ups list query
                            const followUpsIds: string[] = JSON.parse(queryParams.followUpsIds);
                            const qb: RequestQueryBuilder = new RequestQueryBuilder();

                            // bring specific follow-ups
                            qb.filter.bySelect(
                                'id',
                                followUpsIds,
                                true,
                                null
                            );

                            // retrieve follow-ups + contact details
                            this.followUpsDataService.getFollowUpsList(
                                this.selectedOutbreak.id,
                                qb
                            ).subscribe((followUps: FollowUpModel[]) => {
                                this.followUps = followUps;
                            });
                        }
                    });
            });
    }

    /**
     * Track by field id
     * @param index
     * @param items
     */
    trackByFieldID(index: number, item: {id: string}): string {
        return item.id;
    }

    /**
     * Remove follow-up
     * @param index
     */
    removeFollowUp(index: number) {
        // handle remove item confirmation
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_REMOVE_FOLLOW_UP')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.followUps.splice(index, 1);
                }
            });
    }

    /**
     * Check if an object has empty values
     * @param object
     */
    private isEmptyObject(object): boolean {
        return _.every(
            object,
            (value) => {
                return _.isObject(value) ?
                    this.isEmptyObject(value) :
                    ( !_.isNumber(value) && _.isEmpty(value) );
            }
        );
    }

    /**
     * Copy value from follow-up to all the other records
     * @param property
     * @param sourceFollowUp
     */
    copyValueToEmptyFields(
        property: string,
        sourceFollowUp: FollowUpModel,
        form?: NgForm,
        isEmpty: (value: any) => boolean = _.isEmpty
    ) {
        // handle remove item confirmation
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_COPY_VALUE')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // copy values
                    _.each(
                        this.followUps,
                        (followUp: FollowUpModel) => {
                            // if it is a number then it means that it has a value... ( we need to do this because _.isEmpty doesn't work for numbers )
                            // right now we don't have numbers, but we might in teh future..for example for ZIP codes etc which might break the code
                            const value: any = _.get(followUp, property);
                            if (
                                followUp.id !== sourceFollowUp.id &&
                                !_.isNumber(value) && (
                                    isEmpty(value) || (
                                        _.isObject(value) &&
                                        this.isEmptyObject(value)
                                    )
                                )
                            ) {
                                // clone for arrays, because if we put the same object it will cause issues if we want to change something
                                // clone works for strings & numbers
                                _.set(followUp, property, _.cloneDeep(_.get(sourceFollowUp, property)));
                            }
                        }
                    );

                    // validate groups
                    if (form) {
                        // wait for binding to take effect
                        setTimeout(() => {
                            const formDirectives = _.get(form, '_directives', []);
                            _.forEach(formDirectives, (ngModel: NgModel) => {
                                if (
                                    ngModel.valueAccessor &&
                                    ngModel.valueAccessor instanceof GroupBase
                                ) {
                                    ngModel.valueAccessor.validateGroup();
                                }
                            });
                        });
                    }
                }
            });
    }

    /**
     * Check if follow-up status has value "No data"
     */
    checkIfStatusIsEmpty(value: any): boolean {
        return _.isEmpty(value) || value === Constants.FOLLOW_UP_STATUS.NO_DATA.value;
    }

    /**
     * Display error when we have invalid fields
     */
    invalidDisplayFields(form: NgForm) {
        if (form.invalid) {
            this.snackbarService.showError('LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_ERROR_INVALID_FIELDS');
        }
    }

    /**
     * Update Follow-Ups
     * @param stepForms
     */
    updateFollowUps(stepForms: NgForm[]) {
        // get forms fields
        const followUpsToSave: {
            [ id: string ]: FollowUpModel
        } = {};
        const mappedRealFollowUps: {
            [ id: string ]: FollowUpModel
        } = {};
        _.each(
            stepForms,
            (form) => {
                // get dirty fields
                const dirtyFields: any = this.formHelper.getDirtyFields(form);
                if (!_.isEmpty(dirtyFields)) {
                    // go through each dirty follow-up record
                    for (const property in dirtyFields.followUps) {
                        // retrieve id
                        const id: string = this.followUps[property].id;

                        // map related follow-up so we can easily use it later
                        mappedRealFollowUps[id] = this.followUps[property];

                        // set data
                        followUpsToSave[id] = {
                            ...followUpsToSave[id],
                            ...dirtyFields.followUps[property]
                        };
                    }
                }
            }
        );

        // check if we have something to save
        if (_.isEmpty(followUpsToSave)) {
            this.snackbarService.showSuccess('LNG_FORM_WARNING_NO_CHANGES');
            return;
        }

        // save follow-ups
        // construct list of observables to save follow-ups
        const observableList$: Observable<any>[] = [];
        _.each(
            followUpsToSave,
            (followUp: FollowUpModel, id: string) => {
                // retrieve contact id
                observableList$.push(
                    this.followUpsDataService
                        .modifyFollowUp(
                            this.selectedOutbreak.id,
                            mappedRealFollowUps[id].personId,
                            id,
                            followUp
                        )
                );
            }
        );

        // execute observables in parallel
        Observable.forkJoin(observableList$)
            .catch((err) => {
                this.snackbarService.showError(err.message);
                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                // multiple or single followups to save ?
                if (observableList$.length > 1) {
                    this.snackbarService.showSuccess('LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_ACTION_MODIFY_MULTIPLE_FOLLOW_UPS_SUCCESS_MESSAGE');
                } else {
                    this.snackbarService.showSuccess('LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_ACTION_MODIFY_FOLLOW_UP_SUCCESS_MESSAGE');
                }

                // navigate to listing page
                this.disableDirtyConfirm();
                this.router.navigate(['/contacts/follow-ups']);
            });
    }
}
