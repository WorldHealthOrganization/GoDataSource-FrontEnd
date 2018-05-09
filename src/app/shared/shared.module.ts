// modules
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

import { AngularMaterialModule } from './angular-material/angular-material.module';

// components
import { AuthenticationDataService } from './services/data/authentication.data.service';


@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        AngularMaterialModule
    ],
    declarations: [

    ],
    providers: [
        AuthenticationDataService
    ],
    exports: [
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        AngularMaterialModule
    ]
})
export class SharedModule {
}
