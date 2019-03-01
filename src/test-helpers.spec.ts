import { ComponentFixture, getTestBed, TestBed } from '@angular/core/testing';
import { Type } from '@angular/core';
import { AuthDataService } from './app/core/services/data/auth.data.service';
import { AuthDataServiceMock } from './app/core/services/data/auth.data.service.spec';
import { GenericDataService } from './app/core/services/data/generic.data.service';
import { GenericDataServiceMock } from './app/core/services/data/generic.data.service.spec';
import { ReferenceDataDataService } from './app/core/services/data/reference-data.data.service';
import { ReferenceDataDataServiceMock } from './app/core/services/data/reference-data.data.service.spec';
import { LanguageDataService } from './app/core/services/data/language.data.service';
import { LanguageDataServiceMock } from './app/core/services/data/language.data.service.spec';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CoreModule } from './app/core/core.module';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from './app/shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing';

/**
 * Handle TestBed when we don't actually need to reinitialize declarations & imports
 */
export const configureTestSuite = () => {
    const testBedApi: any = getTestBed();
    const originReset = TestBed.resetTestingModule;

    TestBed.resetTestingModule();
    TestBed.resetTestingModule = () => TestBed;

    afterEach(() => {
        testBedApi._activeFixtures.forEach((fixture: ComponentFixture<any>) => fixture.destroy());
        testBedApi._instantiated = false;
    });

    afterAll(() => {
        TestBed.resetTestingModule = originReset;
        TestBed.resetTestingModule();
    });
};

/**
 * Initialize Fixture
 * @param component
 * @param providers
 * @param imports
 */
export const initializeFixture = (
    components: Type<any>[],
    providers?: any[],
    imports?: any[]
) => {
    // set default providers
    if (!providers) {
        providers = [
            {provide: AuthDataService, useClass: AuthDataServiceMock},
            {provide: GenericDataService, useClass: GenericDataServiceMock},
            {provide: ReferenceDataDataService, useClass: ReferenceDataDataServiceMock},
            {provide: LanguageDataService, useClass: LanguageDataServiceMock},
        ];
    }

    // set default imports
    imports = [
        NoopAnimationsModule,
        CoreModule,
        TranslateModule.forRoot(),
        SharedModule,
        RouterTestingModule
    ];

    /**
     * Handle TestBed initialization
     */
    beforeAll((done) => (async () => {
        TestBed.configureTestingModule({
            declarations: components,
            imports: imports,
            providers: providers
        });

        await TestBed.compileComponents();
    })().then(done).catch(done.fail));
};

