import { TranslateService } from '@ngx-translate/core';

export abstract class AppFormBaseErrorMsgV2 {
  // error separator
  static readonly SEPARATOR: string = ' / ';

  /**
   * Retrieve message
   */
  static msg(
    translateService: TranslateService,
    errKey: string,
    errData: any
  ): string {
    // dynamic error content, must generate string accordingly
    switch (errKey) {
      case 'required':
        return translateService.instant('LNG_FORM_VALIDATION_ERROR_FIELD_REQUIRED');

      case 'minNumberValidator':
        return translateService.instant(
          'LNG_FORM_VALIDATION_ERROR_MIN_NUMBER', {
            min: errData.min
          }
        );
      case 'maxNumberValidator':
        return translateService.instant(
          'LNG_FORM_VALIDATION_ERROR_MAX_NUMBER', {
            max: errData.max
          }
        );

      case 'emailValidator':
        return translateService.instant('LNG_FORM_VALIDATION_ERROR_FIELD_EMAIL');

      default:
        return '--- NOT HANDLED ---';
    }
  }
}
