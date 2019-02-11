import { TestBed, async, ComponentFixture, fakeAsync } from '@angular/core/testing';
import { CreateCaseComponent } from './create-case.component';
import { SharedModule } from '../../../../shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing';
import { CoreModule } from '../../../../core/core.module';
import { TranslateModule } from '@ngx-translate/core';
import { AuthDataServiceMock } from '../../../../core/services/data/auth.data.service.spec';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { GenericDataServiceMock } from '../../../../core/services/data/generic.data.service.spec';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ReferenceDataDataServiceMock } from '../../../../core/services/data/reference-data.data.service.spec';
import { LanguageDataServiceMock } from '../../../../core/services/data/language.data.service.spec';
import { LanguageDataService } from '../../../../core/services/data/language.data.service';

describe('CreateCaseComponent', () => {
    let comp: CreateCaseComponent;
    let fixture: ComponentFixture<CreateCaseComponent>;

    beforeEach(fakeAsync(() => {
        TestBed.configureTestingModule({
            declarations: [
                CreateCaseComponent
            ],
            imports: [
                NoopAnimationsModule,
                CoreModule,
                TranslateModule.forRoot(),
                SharedModule,
                RouterTestingModule
            ],
            providers: [
                {provide: AuthDataService, useClass: AuthDataServiceMock},
                {provide: GenericDataService, useClass: GenericDataServiceMock},
                {provide: ReferenceDataDataService, useClass: ReferenceDataDataServiceMock},
                {provide: LanguageDataService, useClass: LanguageDataServiceMock},
            ]
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(CreateCaseComponent);
                comp = fixture.componentInstance;
            });
    }));

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
                // equal
                comp.infectionForm.controls['dateOfInfection'].setValue('2019-01-01');
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-01');
                expect(comp.infectionForm.controls['dateOfInfection'].invalid).toBeFalsy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeFalsy();

                // lower than
                comp.infectionForm.controls['dateOfInfection'].setValue('2019-01-01');
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-02');
                expect(comp.infectionForm.controls['dateOfInfection'].invalid).toBeFalsy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeFalsy();

                // greater than
                comp.infectionForm.controls['dateOfInfection'].setValue('2019-01-02');
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-01');
                expect(comp.infectionForm.controls['dateOfInfection'].invalid).toBeFalsy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeTruthy();
            });
        }
    ));

    it(`date of infection should be equal to or lower than date of onset`, async(
        () => {
            fixture.detectChanges();
            fixture.whenStable().then(() => {
                // equal
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-01');
                comp.infectionForm.controls['dateOfInfection'].setValue('2019-01-01');
                expect(comp.infectionForm.controls['dateOfInfection'].invalid).toBeFalsy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeFalsy();

                // lower than
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-02');
                comp.infectionForm.controls['dateOfInfection'].setValue('2019-01-01');
                expect(comp.infectionForm.controls['dateOfInfection'].invalid).toBeFalsy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeFalsy();

                // greater than
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-01');
                comp.infectionForm.controls['dateOfInfection'].setValue('2019-01-02');
                expect(comp.infectionForm.controls['dateOfInfection'].invalid).toBeTruthy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeFalsy();
            });
        }
    ));

    it(`date of onset should be equal to or lower than date of outcome`, async(
        () => {
            fixture.detectChanges();
            fixture.whenStable().then(() => {
                // equal
                comp.infectionForm.controls['dateOfOutcome'].setValue('2019-01-01');
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-01');
                expect(comp.infectionForm.controls['dateOfOutcome'].invalid).toBeFalsy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeFalsy();

                // lower than
                comp.infectionForm.controls['dateOfOutcome'].setValue('2019-01-02');
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-01');
                expect(comp.infectionForm.controls['dateOfOutcome'].invalid).toBeFalsy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeFalsy();

                // greater than
                comp.infectionForm.controls['dateOfOutcome'].setValue('2019-01-01');
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-02');
                expect(comp.infectionForm.controls['dateOfOutcome'].invalid).toBeFalsy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeTruthy();
            });
        }
    ));

    it(`date of outcome should be equal to or greater than date of onset`, async(
        () => {
            fixture.detectChanges();
            fixture.whenStable().then(() => {
                // equal
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-01');
                comp.infectionForm.controls['dateOfOutcome'].setValue('2019-01-01');
                expect(comp.infectionForm.controls['dateOfOutcome'].invalid).toBeFalsy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeFalsy();

                // lower than
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-01');
                comp.infectionForm.controls['dateOfOutcome'].setValue('2019-01-02');
                expect(comp.infectionForm.controls['dateOfOutcome'].invalid).toBeFalsy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeFalsy();

                // greater than
                comp.infectionForm.controls['dateOfOnset'].setValue('2019-01-02');
                comp.infectionForm.controls['dateOfOutcome'].setValue('2019-01-01');
                expect(comp.infectionForm.controls['dateOfOutcome'].invalid).toBeTruthy();
                expect(comp.infectionForm.controls['dateOfOnset'].invalid).toBeFalsy();
            });
        }
    ));
});
