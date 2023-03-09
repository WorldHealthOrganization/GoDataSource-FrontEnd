import { TranslateService } from '@ngx-translate/core';

/**
 * Error type
 */
export enum AppFormBaseErrorMsgV2Type {
  REQUIRED = 'required',
  INTEGER = 'integerValidator',
  MIN_NUMBER = 'minNumberValidator',
  MAX_NUMBER = 'maxNumberValidator',
  EMAIL = 'emailValidator',
  INVALID_DATE = 'invalidDateValidator',
  DATE = 'dateValidator',
  GENERAL_ASYNC = 'generalAsyncValidatorDirective',
  MIN_LENGTH = 'minlength',
  EQUAL = 'equalValidator',
  NOT_EQUAL = 'notEqualValidator',
  REGEX = 'regexNotMatched',
  NOT_NUMBER = 'notNumberValidator',
  HAS_PROPERTY = 'hasPropertyValidator',
  NO_SPACES = 'noSpaces',
  MISSING_OPTIONS = 'missingRequiredOptions'
}

/**
 * Error handler
 */
export abstract class AppFormBaseErrorMsgV2 {
  // error separator
  static readonly SEPARATOR: string = ' / ';

  /**
   * Retrieve message
   */
  static msg(
    translateService: TranslateService,
    errKey: AppFormBaseErrorMsgV2Type,
    errData: any
  ): string {
    // dynamic error content, must generate string accordingly
    switch (errKey) {
      case AppFormBaseErrorMsgV2Type.REQUIRED:
        return translateService.instant('LNG_FORM_VALIDATION_ERROR_FIELD_REQUIRED');

      case AppFormBaseErrorMsgV2Type.INTEGER:
        return translateService.instant('LNG_FORM_VALIDATION_ERROR_INTEGER');
      case AppFormBaseErrorMsgV2Type.MIN_NUMBER:
        return translateService.instant(
          'LNG_FORM_VALIDATION_ERROR_MIN_NUMBER',
          errData
        );
      case AppFormBaseErrorMsgV2Type.MAX_NUMBER:
        return translateService.instant(
          'LNG_FORM_VALIDATION_ERROR_MAX_NUMBER',
          errData
        );

      case AppFormBaseErrorMsgV2Type.EMAIL:
        return translateService.instant('LNG_FORM_VALIDATION_ERROR_FIELD_EMAIL');

      case AppFormBaseErrorMsgV2Type.INVALID_DATE:
        return translateService.instant('LNG_FORM_VALIDATION_ERROR_INVALID_DATE');

      case AppFormBaseErrorMsgV2Type.DATE:
        return translateService.instant(
          'LNG_FORM_VALIDATION_ERROR_DATE_COMPARE',
          errData
        );

      case AppFormBaseErrorMsgV2Type.GENERAL_ASYNC:
        return translateService.instant(
          errData.err,
          errData.details
        );

      case AppFormBaseErrorMsgV2Type.MIN_LENGTH:
        return translateService.instant(
          'LNG_FORM_VALIDATION_ERROR_MIN_LENGTH', {
            length: errData.requiredLength
          }
        );

      case AppFormBaseErrorMsgV2Type.EQUAL:
        return translateService.instant(errData.err);

      case AppFormBaseErrorMsgV2Type.NOT_EQUAL:
        return translateService.instant(errData.err);

      case AppFormBaseErrorMsgV2Type.REGEX:
        return translateService.instant(
          errData.msg ?
            errData.msg :
            'LNG_FORM_VALIDATION_ERROR_INVALID_REGEX'
        );

      case AppFormBaseErrorMsgV2Type.NOT_NUMBER:
        return translateService.instant('LNG_FORM_VALIDATION_ERROR_FIELD_NOT_NUMBER');

      case AppFormBaseErrorMsgV2Type.HAS_PROPERTY:
        return translateService.instant(errData.err);

      case AppFormBaseErrorMsgV2Type.NO_SPACES:
        return translateService.instant('LNG_FORM_VALIDATION_ERROR_FIELD_NO_SPACES');

      case AppFormBaseErrorMsgV2Type.MISSING_OPTIONS:
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
