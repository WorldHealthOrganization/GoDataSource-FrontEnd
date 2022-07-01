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
          'LNG_FORM_VALIDATION_ERROR_MIN_NUMBER',
          errData
        );
      case 'maxNumberValidator':
        return translateService.instant(
          'LNG_FORM_VALIDATION_ERROR_MAX_NUMBER',
          errData
        );

      case 'emailValidator':
        return translateService.instant('LNG_FORM_VALIDATION_ERROR_FIELD_EMAIL');

      case 'invalidDateValidator':
        return translateService.instant('LNG_FORM_VALIDATION_ERROR_INVALID_DATE');

      case 'dateValidator':
        return translateService.instant(
          'LNG_FORM_VALIDATION_ERROR_DATE_COMPARE',
          errData
        );

      case 'generalAsyncValidatorDirective':
        return translateService.instant(
          errData.err,
          errData.details
        );

      case 'minlength':
        return translateService.instant(
          'LNG_FORM_VALIDATION_ERROR_MIN_LENGTH', {
            length: errData.requiredLength
          }
        );

      case 'equalValidator':
        return translateService.instant(errData.err);

      case 'notEqualValidator':
        return translateService.instant(errData.err);

      case 'regexNotMatched':
        return translateService.instant(
          errData.msg ?
            errData.msg :
            'LNG_FORM_VALIDATION_ERROR_INVALID_REGEX'
        );

      case 'notNumberValidator':
        return translateService.instant('LNG_FORM_VALIDATION_ERROR_FIELD_NOT_NUMBER');

      case 'hasPropertyValidator':
        return translateService.instant(errData.err);

      case 'noSpaces':
        return translateService.instant('LNG_FORM_VALIDATION_ERROR_FIELD_NO_SPACES');

      case 'missingRequiredOptions':
        return translateService.instant(
          'LNG_FORM_VALIDATION_ERROR_MISSING_REQUIRED_OPTIONS', {
            options: errData.options.join(', ')
          }
        );

      default:
        return `--- NOT HANDLED (${errKey}) ---`;
    }
  }
}