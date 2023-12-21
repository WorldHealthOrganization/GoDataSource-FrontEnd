import { APP_INITIALIZER, LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppComponent } from './app.component';
import { routing } from './app.module.routing';
import { CoreModule } from './core/core.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SystemSettingsDataService } from './core/services/data/system-settings.data.service';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@NgModule({
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    RouterModule,
    routing,
    CoreModule,
    TranslateModule.forRoot()
  ],
  declarations: [
    AppComponent
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (systemSettingsDataService: SystemSettingsDataService) => (): Observable<any> => {
        // update timezone
        return systemSettingsDataService.getAPIVersionNoCache()
          .pipe(
            // should be last one
            catchError(() => {
              // try one more time so redirect to login will work after invalid token was removed from cache
              return systemSettingsDataService.getAPIVersionNoCache();
            })
          );
      },
      multi: true,
      deps: [SystemSettingsDataService]
    },
    {
      provide: LOCALE_ID,
      useValue: 'en-GB'
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
