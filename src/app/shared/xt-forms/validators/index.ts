import { EmailValidatorDirective } from './email-validator.directive';
import { EqualValidatorDirective } from './equal-validator.directive';
import { TriggerValidationForValidatorDirective } from './trigger-validation-for-validator.directive';
import { NotEqualValidatorDirective } from './not-equal-validator.directive';
import { DateValidatorDirective } from './date-validator.directive';
import { MinMaxValidatorDirective } from './min-max-validator.directive';
import { GeneralAsyncValidatorDirective } from './general-async-validator.directive';
import { HasPropertyDirective } from './has-property.directive';
import { NotNumberValidatorDirective } from './not-number-validator.directive';
import { GroupOptionRequirementsValidator } from './group-option-requirements-validator.directive';
import { RegexValidatorDirective } from './regex-validator.directive';
import { NoSpacesValidatorDirective } from './no-spaces-validator.directive';
import { QuestionnaireAnswersValidatorDirective } from './questionnaire-answers-validator.directive';
import { VisibleMandatoryValidatorDirective } from './visible-mandatory-validator.directive';

export const validatorDirectives: any[] = [
  EmailValidatorDirective,
  EqualValidatorDirective,
  TriggerValidationForValidatorDirective,
  NotEqualValidatorDirective,
  DateValidatorDirective,
  MinMaxValidatorDirective,
  GeneralAsyncValidatorDirective,
  HasPropertyDirective,
  NotNumberValidatorDirective,
  GroupOptionRequirementsValidator,
  RegexValidatorDirective,
  NoSpacesValidatorDirective,
  QuestionnaireAnswersValidatorDirective,
  VisibleMandatoryValidatorDirective
];
