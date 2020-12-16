import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { CreateCaseComponent } from './create-case.component';
import { configureTestSuite, initializeFixture } from '../../../../../test-helpers.spec';

describe('CreateCaseComponent', () => {
    // we don't actually need to reset TestBed, so we can setup it just once
    configureTestSuite();
    initializeFixture([
        CreateCaseComponent
    ]);

    // Handle fixture initialization
    let comp: CreateCaseComponent;
    let fixture: ComponentFixture<CreateCaseComponent>;
    beforeEach((done) => (async () => {
        fixture = TestBed.createComponent(CreateCaseComponent);
        comp = fixture.componentInstance;
    })().then(done).catch(done.fail));

    it(`personal form should be valid with mandatory fields only`, async(
        () => {
            fixture.detectChanges();
            fixture.whenStable().then(() => {
                comp.personalForm.controls['firstName'].setValue('fn');
                comp.personalForm.controls['dateOfReporting'].setValue('2019-02-01');
                expect(comp.personalForm.invalid).toBeFalsy();
            });
        }
    ));

    it(`personal form should have mandatory fields: first name, date of reporting`, async(
        () => {
            fixture.detectChanges();
            fixture.whenStable().then(() => {
                // form should be invalid
                expect(comp.personalForm.invalid).toBeTruthy();

                for (const fieldName in comp.personalForm.controls) {
                    const control = comp.personalForm.controls[fieldName];

                    if (fieldName === 'firstName' || fieldName === 'dateOfReporting') {
                        expect(control.invalid).toBeTruthy();
                        expect(control.errors.required).toBeTruthy();
                    } else {
                        expect(control.invalid).toBeFalsy();
                    }
                }
            });
        }
    ));

    it(`infection form should be valid with mandatory fields only`, async(
        () => {
            fixture.detectChanges();
            fixture.whenStable().then(() => {
                comp.infectionForm.controls['classification'].setValue('confirmed');
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-01');
                expect(comp.infectionForm.invalid).toBeFalsy();
            });
        }
    ));

    it(`infection form should have mandatory fields: classification, date of onset`, async(
        () => {
            fixture.detectChanges();
            fixture.whenStable().then(() => {
                // form should be invalid
                expect(comp.infectionForm.invalid).toBeTruthy();

                for (const fieldName in comp.infectionForm.controls) {
                    const control = comp.infectionForm.controls[fieldName];

                    if (fieldName === 'classification' || fieldName === 'dateOfOnset') {
                        expect(control.invalid).toBeTruthy();
                        expect(control.errors.required).toBeTruthy();
                    } else {
                        expect(control.invalid).toBeFalsy();
                    }
                }
            });
        }
    ));

    it(`date of onset should be equal to or greater than date of infection`, async(
        () => {
            fixture.detectChanges();
            fixture.whenStable().then(() => {
                jasmine.clock().install();

                // equal
                comp.infectionForm.controls['dateOfInfection'].setValue('2019-01-01');
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-01');
                jasmine.clock().tick(500);
                expect(comp.infectionForm.controls['dateOfInfection'].invalid).toBeFalsy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeFalsy();

                // lower than
                comp.infectionForm.controls['dateOfInfection'].setValue('2019-01-01');
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-02');
                jasmine.clock().tick(500);
                expect(comp.infectionForm.controls['dateOfInfection'].invalid).toBeFalsy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeFalsy();

                // greater than
                comp.infectionForm.controls['dateOfInfection'].setValue('2019-01-02');
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-01');
                jasmine.clock().tick(500);
                expect(comp.infectionForm.controls['dateOfInfection'].invalid).toBeTruthy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeTruthy();

                jasmine.clock().uninstall();
            });
        }
    ));

    it(`date of infection should be equal to or lower than date of onset`, async(
        () => {
            fixture.detectChanges();
            fixture.whenStable().then(() => {
                jasmine.clock().install();

                // equal
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-01');
                comp.infectionForm.controls['dateOfInfection'].setValue('2019-01-01');
                jasmine.clock().tick(500);
                expect(comp.infectionForm.controls['dateOfInfection'].invalid).toBeFalsy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeFalsy();

                // lower than
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-02');
                comp.infectionForm.controls['dateOfInfection'].setValue('2019-01-01');
                jasmine.clock().tick(500);
                expect(comp.infectionForm.controls['dateOfInfection'].invalid).toBeFalsy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeFalsy();

                // greater than
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-01');
                comp.infectionForm.controls['dateOfInfection'].setValue('2019-01-02');
                jasmine.clock().tick(500);
                expect(comp.infectionForm.controls['dateOfInfection'].invalid).toBeTruthy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeTruthy();

                jasmine.clock().uninstall();
            });
        }
    ));

    it(`date of onset should be equal to or lower than date of outcome`, async(
        () => {
            fixture.detectChanges();
            fixture.whenStable().then(() => {
                jasmine.clock().install();

                // equal
                comp.infectionForm.controls['dateOfOutcome'].setValue('2019-01-01');
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-01');
                jasmine.clock().tick(500);
                expect(comp.infectionForm.controls['dateOfOutcome'].invalid).toBeFalsy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeFalsy();

                // lower than
                comp.infectionForm.controls['dateOfOutcome'].setValue('2019-01-02');
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-01');
                jasmine.clock().tick(500);
                expect(comp.infectionForm.controls['dateOfOutcome'].invalid).toBeFalsy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeFalsy();

                // greater than
                comp.infectionForm.controls['dateOfOutcome'].setValue('2019-01-01');
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-02');
                jasmine.clock().tick(500);
                expect(comp.infectionForm.controls['dateOfOutcome'].invalid).toBeTruthy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeTruthy();

                jasmine.clock().uninstall();
            });
        }
    ));

    it(`date of outcome should be equal to or greater than date of onset`, async(
        () => {
            fixture.detectChanges();
            fixture.whenStable().then(() => {
                jasmine.clock().install();

                // equal
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-01');
                comp.infectionForm.controls['dateOfOutcome'].setValue('2019-01-01');
                jasmine.clock().tick(500);
                expect(comp.infectionForm.controls['dateOfOutcome'].invalid).toBeFalsy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeFalsy();

                // lower than
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-01');
                comp.infectionForm.controls['dateOfOutcome'].setValue('2019-01-02');
                jasmine.clock().tick(500);
                expect(comp.infectionForm.controls['dateOfOutcome'].invalid).toBeFalsy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeFalsy();

                // greater than
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-02');
                comp.infectionForm.controls['dateOfOutcome'].setValue('2019-01-01');
                jasmine.clock().tick(500);
                expect(comp.infectionForm.controls['dateOfOutcome'].invalid).toBeTruthy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeTruthy();

                jasmine.clock().uninstall();
            });
        }
    ));
});
