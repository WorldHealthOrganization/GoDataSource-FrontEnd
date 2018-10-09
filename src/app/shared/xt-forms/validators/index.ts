import { EmailValidatorDirective } from './email-validator.directive';
import { EqualValidatorDirective } from './equal-validator.directive';
import { FileExtensionValidatorDirective } from './file-extension-validator.directive';
import { TruthyValidatorDirective } from './truthy-validator.directive';
import { UniqueAsyncValidatorDirective } from './unique-async-validator.directive';
import { TriggerValidationForValidatorDirective } from './trigger-validation-for-validator.directive';
import { PasswordValidatorDirective } from './password-validator.directive';
import { NotEqualValidatorDirective } from './not-equal-validator.directive';
import { UniqueValidatorDirective } from './unique-validator.directive';
import { DateValidatorDirective } from './date-validator.directive';
import { RequiredOneOrOtherValidatorDirective } from './required-one-or-other-validator.directive';
import { MinMaxValidatorDirective } from './min-max-validator.directive';

export const validatorDirectives: any[] = [
    EmailValidatorDirective,
    EqualValidatorDirective,
    FileExtensionValidatorDirective,
    TruthyValidatorDirective,
    UniqueAsyncValidatorDirective,
    TriggerValidationForValidatorDirective,
    PasswordValidatorDirective,
    NotEqualValidatorDirective,
    UniqueValidatorDirective,
    DateValidatorDirective,
    RequiredOneOrOtherValidatorDirective,
    MinMaxValidatorDirective
];
