// import each component
import { SnackbarComponent } from './snackbar/snackbar.component';
import { TopnavComponent } from './topnav/topnav.component';
import { BreadcrumbsComponent} from './breadcrumbs/breadcrumbs.component';
import { FormAddressComponent } from './form-address/form-address.component';
import { FormAddressListComponent } from './form-address-list/form-address-list.component';
import { FormDocumentComponent } from './form-document/form-document.component';
import { FormDocumentListComponent } from './form-document-list/form-document-list.component';
import { FormRangeComponent } from './form-range/form-range.component';
import { NotAuthTemplateComponent } from './not-auth-template/not-auth-template.component';
import { DialogConfirmComponent } from './dialog-confirm/dialog-confirm.component';
import { FormRelationshipComponent } from './form-relationship/form-relationship.component';
import { SideFiltersComponent } from './side-filters/side-filters.component';
import { FormAnswerListComponent } from '../../features/outbreak/components/form-answer-list/form-answer-list.component';
import { FormQuestionListComponent } from '../../features/outbreak/components/form-question-list/form-question-list.component';
import { CountedItemsListComponent } from './counted-items-list/counted-items-list.component';
import { YesNoLabelComponent } from './yes-no-label/yes-no-label.component';
import { FormFillQuestionnaireComponent } from './form-fill-questionnaire/form-fill-questionnaire.component';
import { ReferenceDataLabelComponent } from './reference-data-label/reference-data-label.component';

// export necessary components individually
export * from './snackbar/snackbar.component';
export * from './dialog-confirm/dialog-confirm.component';
export * from './counted-items-list/counted-items-list.component';

// export the list of all components
export const components: any[] = [
    SnackbarComponent,
    TopnavComponent,
    BreadcrumbsComponent,
    NotAuthTemplateComponent,
    DialogConfirmComponent,
    FormAddressComponent,
    FormAddressListComponent,
    FormDocumentComponent,
    FormDocumentListComponent,
    FormRangeComponent,
    FormRangeComponent,
    FormRelationshipComponent,
    SideFiltersComponent,
    CountedItemsListComponent,
    YesNoLabelComponent,
    FormFillQuestionnaireComponent,
    ReferenceDataLabelComponent
];
