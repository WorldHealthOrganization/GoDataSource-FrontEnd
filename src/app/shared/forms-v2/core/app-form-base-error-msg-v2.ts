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
    _errData: any
  ): string {
    // dynamic error content, must generate string accordingly
    switch (errKey) {
      case 'required':
        return translateService.instant('LNG_FORM_VALIDATION_ERROR_FIELD_REQUIRED');

      default:
        return '--- NOT HANDLED ---';
    }
  }
}
