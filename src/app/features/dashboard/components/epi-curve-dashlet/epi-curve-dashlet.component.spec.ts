import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { configureTestSuite, initializeFixture } from '../../../../../test-helpers.spec';
import { EpiCurveDashletComponent } from './epi-curve-dashlet.component';

describe('EpiCurveDashletComponent', () => {
    // we don't actually need to reset TestBed, so we can setup it just once
    configureTestSuite();
    initializeFixture([
        EpiCurveDashletComponent
    ]);

    // Handle fixture initialization
    let comp: EpiCurveDashletComponent;
    let fixture: ComponentFixture<EpiCurveDashletComponent>;
    beforeEach((done) => (async () => {
        fixture = TestBed.createComponent(EpiCurveDashletComponent);
        comp = fixture.componentInstance;
    })().then(done).catch(done.fail));

    // it(`should display a message if there are not values to display`, async(
    //     () => {
    //         fixture.detectChanges();
    //         fixture.whenStable().then(() => {
    //             comp.chartData = {};
    //             const messageElem = document.getElementsByClassName('dashlet-no-data');
    //             expect(messageElem[0].innerHTML).toMatch('There is no data to build the chart');
    //         });
    //     }
    // ));



});
