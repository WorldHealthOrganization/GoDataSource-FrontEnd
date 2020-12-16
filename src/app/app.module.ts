import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AppComponent } from './app.component';

import { routing } from './app.module.routing';

import { CoreModule } from './core/core.module';

@NgModule({
    imports: [
        BrowserModule,
        NoopAnimationsModule,
        RouterModule,
        routing,
        CoreModule,
        TranslateModule.forRoot()
    ],
    declarations: [
        AppComponent
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
