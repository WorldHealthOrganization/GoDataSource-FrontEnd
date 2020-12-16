import { NgModule } from '@angular/core';

import {
    MatButtonModule,
    MatInputModule,
    MatSliderModule,
    MatSnackBarModule,
    MatMenuModule,
    MatSortModule,
    MatTableModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatCardModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatChipsModule,
    MatTooltipModule,
    MatSelectModule,
    MatStepperModule,
    MatDialogModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatRadioModule,
    MatExpansionModule,
    MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS
} from '@angular/material';

@NgModule({
    imports: [
        MatButtonModule,
        MatInputModule,
        MatSliderModule,
        MatSnackBarModule,
        MatMenuModule,
        MatTableModule,
        MatSortModule,
        MatSlideToggleModule,
        MatTabsModule,
        MatCardModule,
        MatNativeDateModule,
        MatDatepickerModule,
        MatSidenavModule,
        MatToolbarModule,
        MatListModule,
        MatChipsModule,
        MatTooltipModule,
        MatSelectModule,
        MatStepperModule,
        MatDialogModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        MatPaginatorModule,
        MatRadioModule,
        MatExpansionModule
    ],
    providers: [
        {
            provide: MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS,
            useValue: {
                _forceAnimations: true
            }
        }
    ],
    declarations: [],
    exports: [
        MatButtonModule,
        MatInputModule,
        MatSliderModule,
        MatSnackBarModule,
        MatMenuModule,
        MatTableModule,
        MatSortModule,
        MatSlideToggleModule,
        MatTabsModule,
        MatCardModule,
        MatNativeDateModule,
        MatDatepickerModule,
        MatSidenavModule,
        MatToolbarModule,
        MatListModule,
        MatChipsModule,
        MatTooltipModule,
        MatSelectModule,
        MatStepperModule,
        MatDialogModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        MatPaginatorModule,
        MatRadioModule,
        MatExpansionModule
    ]
})
export class AngularMaterialModule {
}
