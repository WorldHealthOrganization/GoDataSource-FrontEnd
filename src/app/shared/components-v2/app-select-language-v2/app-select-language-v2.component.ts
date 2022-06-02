import { Component } from '@angular/core';
import { LanguageModel } from '../../../core/models/language.model';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { ILabelValuePairModel } from '../../../shared/forms-v2/core/label-value-pair.model';
import { ActivatedRoute } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastV2Service } from '../../../core/services/helper/toast-v2.service';
import { DialogV2Service } from '../../../core/services/helper/dialog-v2.service';
import { IResolverV2ResponseModel } from '../../../core/services/resolvers/data/models/resolver-response.model';

@Component({
  selector: 'app-select-language-v2',
  templateUrl: './app-select-language-v2.component.html'
})
export class AppSelectLanguageV2Component {
  // selected Language ID
  selectedLanguageId: string;

  // languages
  languageOptions: ILabelValuePairModel[];

  /**
   * Constructor
   */
  constructor(
    activatedRoute: ActivatedRoute,
    private i18nService: I18nService,
    private toastV2Service: ToastV2Service,
    private dialogV2Service: DialogV2Service
  ) {
    // get the selected language ID
    this.selectedLanguageId = i18nService.getSelectedLanguageId();

    // language options
    this.languageOptions = (activatedRoute.snapshot.data.languages as IResolverV2ResponseModel<LanguageModel>).options;
  }

  /**
   * Change the selected Language across the application
   */
  selectLanguage(): void {
    // display loading
    const loading = this.dialogV2Service.showLoadingDialog();
    this.i18nService
      .changeLanguage(this.selectedLanguageId)
      .pipe(
        catchError((err) => {
          // show error
          this.toastV2Service.error(err);

          // hide loading
          loading.close();

          // send error down the road
          return throwError(err);
        })
      )
      .subscribe(() => {
        // hide loading
        loading.close();

        // finished
        this.toastV2Service.success('LNG_LAYOUT_ACTION_CHANGE_LANGUAGE_SUCCESS_MESSAGE');
      });
  }
}
