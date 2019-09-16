import { configureTestSuite, getObserverData, initializeFixture } from '../../../../../../test-helpers.spec';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { OutbreakDataService } from '../../../../../core/services/data/outbreak.data.service';
import { OutbreakDataServiceMock } from '../../../../../core/services/data/outbreak.data.service.spec';
import { ActivatedRoute } from '@angular/router';
import { ActivatedRouteMock } from '../../../../../core/services/helper/activated-route.service.spec';
import { ChronologyComponent } from '../../../../../shared/components/chronology/chronology.component';
import { By } from '@angular/platform-browser';
import { ViewChronologyCaseComponent } from '../view-chronology-case.component';
import { CaseDataService } from '../../../../../core/services/data/case.data.service';
import { CaseDataServiceMock } from '../../../../../core/services/data/case.data.service.spec';
import { LabResultDataService } from '../../../../../core/services/data/lab-result.data.service';
import { LabResultDataServiceMock } from '../../../../../core/services/data/lab-result.data.service.spec';
import { CaseModel } from '../../../../../core/models/case.model';
import { LabResultModel } from '../../../../../core/models/lab-result.model';
import { CaseChronology } from './case-chronology';
import { I18nService } from '../../../../../core/services/helper/i18n.service';
import { I18nServiceMock } from '../../../../../core/services/helper/i18n.service.spec';
import { ChronologyItem } from '../../../../../shared/components/chronology/typings/chronology-item';
import * as _ from 'lodash';
import { moment } from '../../../../../core/helperClasses/x-moment';
import { RelationshipDataService } from '../../../../../core/services/data/relationship.data.service';
import { RelationshipDataServiceMock } from '../../../../../core/services/data/relationship.data.service.spec';

describe('CaseChronology', () => {
    // Component tests
    describe('Component tests', () => {
        // we don't actually need to reset TestBed, so we can setup it just once
        configureTestSuite();
        initializeFixture([
            ViewChronologyCaseComponent
        ], [
            {provide: ActivatedRoute, useValue: ActivatedRouteMock},
            {provide: OutbreakDataService, useValue: OutbreakDataServiceMock},
            {provide: CaseDataService, useValue: CaseDataServiceMock},
            {provide: LabResultDataService, useValue: LabResultDataServiceMock},
            {provide: I18nService, useValue: I18nServiceMock},
            {provide: RelationshipDataService, useValue: RelationshipDataServiceMock},
        ]);

        // Handle fixture initialization
        let viewChronologyCaseComponent: ViewChronologyCaseComponent;
        let chronologyComponent: ChronologyComponent;
        let fixture: ComponentFixture<ViewChronologyCaseComponent>;
        beforeEach((done) => (async () => {
            fixture = TestBed.createComponent(ViewChronologyCaseComponent);
            viewChronologyCaseComponent = fixture.componentInstance;
            chronologyComponent = fixture.debugElement.query(By.directive(ChronologyComponent)).componentInstance;
        })().then(done).catch(done.fail));

        it('should call service getSelectedOutbreak', async(() => {
            spyOn(OutbreakDataServiceMock, 'getSelectedOutbreak').and.callThrough();
            fixture.detectChanges();
            expect(OutbreakDataServiceMock.getSelectedOutbreak).toHaveBeenCalled();
        }));

        it('should have specific chronology items', async(async () => {
            fixture.detectChanges();

            // determine expected chronology items
            const caseData: CaseModel = getObserverData(await CaseDataServiceMock.getCase(OutbreakDataServiceMock.selectedOutbreakId, CaseDataServiceMock.selectedCaseId));
            const labResultsData: LabResultModel[] = getObserverData(await LabResultDataServiceMock.getCaseLabResults(OutbreakDataServiceMock.selectedOutbreakId, caseData.id));
            let expectedChronologyItems = CaseChronology.getChronologyEntries(
                I18nServiceMock as any,
                caseData,
                labResultsData
            );

            // sort collection asc
            expectedChronologyItems = _.sortBy(
                expectedChronologyItems,
                'date'
            );

            // determine number of days between events
            let previousItem: ChronologyItem;
            expectedChronologyItems.forEach((item: ChronologyItem, index: number) => {
                // we don't need to determine number of days for the first item
                if (index > 0) {
                    item.daysSincePreviousEvent = moment(item.date).startOf('day').diff(moment(previousItem.date).startOf('day'), 'days');
                }

                // previous item
                previousItem = item;
            });

            // make sure chronology items are the ones we expect
            expect(expectedChronologyItems.length).toEqual(11);
            expect(viewChronologyCaseComponent.chronologyEntries).not.toEqual(expectedChronologyItems);
            expect(chronologyComponent.entries).toEqual(expectedChronologyItems);
        }));
    });
});
