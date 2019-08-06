import { ChronologyItem } from '../../../../../shared/components/chronology/typings/chronology-item';
import * as _ from 'lodash';
import { CaseModel } from '../../../../../core/models/case.model';
import { LabResultModel } from '../../../../../core/models/lab-result.model';
import { I18nService } from '../../../../../core/services/helper/i18n.service';
import { RelationshipModel } from '../../../../../core/models/entity-and-relationship.model';

export class CaseChronology {
    static getChronologyEntries(i18nService: I18nService,
                                caseData: CaseModel,
                                labResults: LabResultModel[],
                                relationshipsData?: RelationshipModel[]): ChronologyItem[] {
        const chronologyEntries: ChronologyItem [] = [];

        // finding if the selected case is a contact for any exposure
        if (!_.isEmpty(relationshipsData)) {
            relationshipsData.forEach((relationship) => {
                if (relationship.sourcePerson.id !== caseData.id) {
                    chronologyEntries.push(new ChronologyItem({
                        date: relationship.contactDate,
                        label: 'LNG_CASE_FIELD_LABEL_DATE_OF_EXPOSURE',
                        translateData: {caseName: caseData.name}
                    }));
                }
            });
        }

        // date of onset
        if (!_.isEmpty(caseData.dateOfOnset)) {
            chronologyEntries.push(new ChronologyItem({
                date: caseData.dateOfOnset,
                label: 'LNG_CASE_FIELD_LABEL_DATE_OF_ONSET'
            }));
        }

        // date of infection
        if (!_.isEmpty(caseData.dateOfInfection)) {
            chronologyEntries.push(new ChronologyItem({
                date: caseData.dateOfInfection,
                label: 'LNG_CASE_FIELD_LABEL_DATE_OF_INFECTION'
            }));
        }

        // date of outcome
        if (!_.isEmpty(caseData.dateOfOutcome)) {
            chronologyEntries.push(new ChronologyItem({
                date: caseData.dateOfOutcome,
                label: 'LNG_CASE_FIELD_LABEL_DATE_OF_OUTCOME'
            }));
        }

        // date contact become case
        if (!_.isEmpty(caseData.dateBecomeCase)) {
            chronologyEntries.push(new ChronologyItem({
                date: caseData.dateBecomeCase,
                label: 'LNG_CASE_FIELD_LABEL_DATE_BECOME_CASE'
            }));
        }

        // add date range start dates
        chronologyEntries.push.apply(
            chronologyEntries,
            caseData.dateRanges
            // keep only start dates
                .filter((dateRange) => !_.isEmpty(dateRange.startDate))
                // transform date ranges to ChronologyItem structure
                .map((dateRange) => {
                    // get the label for the date range type
                    const typeLabel = i18nService.instant(dateRange.typeId);
                    // create the ChronologyItem
                    return new ChronologyItem({
                        label: i18nService.instant('LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_DATE_RANGE_START_DATE', {type: typeLabel}),
                        date: dateRange.startDate
                    });
                })
        );

        // add date range end dates
        chronologyEntries.push.apply(
            chronologyEntries,
            caseData.dateRanges
                // keep only end dates
                .filter((dateRange) => !_.isEmpty(dateRange.endDate))
                // transform date ranges to ChronologyItem structure
                .map((dateRange) => {
                    // get the label for the date range type
                    const typeLabel = i18nService.instant(dateRange.typeId);
                    // create the ChronologyItem
                    return new ChronologyItem({
                        label: i18nService.instant('LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_DATE_RANGE_END_DATE', {type: typeLabel}),
                        date: dateRange.endDate
                    });
                })
        );

        // classification dates
        if (!_.isEmpty(caseData.classificationHistory)) {
            _.forEach(
                caseData.classificationHistory, (
                    classificationHistory: {
                        classification: string,
                        startDate: string,
                        endDate: string
                    }
                ) => {
                    const translateData = {
                        classification: i18nService.instant(classificationHistory.classification)
                    };
                    if (!_.isEmpty(classificationHistory.startDate)) {
                        chronologyEntries.push(new ChronologyItem({
                            date: classificationHistory.startDate,
                            label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_CLASSIFICATION_HISTORY_START_DATE',
                            translateData: translateData
                        }));
                    }
                    if (!_.isEmpty(classificationHistory.endDate)) {
                        chronologyEntries.push(new ChronologyItem({
                            date: classificationHistory.endDate,
                            label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_CLASSIFICATION_HISTORY_END_DATE',
                            translateData: translateData
                        }));
                    }
                });
        }

        // isolation dates
        _.forEach(labResults, (labResult) => {
            if (!_.isEmpty(labResult.dateOfResult)) {
                chronologyEntries.push(new ChronologyItem({
                    date: labResult.dateOfResult,
                    label: 'LNG_PAGE_VIEW_CHRONOLOGY_CASE_LABEL_LAB_RESULT_DATE'
                }));
            }
        });

        // finished
        return chronologyEntries;
    }
}
