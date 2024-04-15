import { Injectable } from '@angular/core';
import { IMapResolverV2, IResolverV2ResponseModel } from './models/resolver-response.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { AuthDataService } from '../../data/auth.data.service';
import { CaseModel } from '../../../models/case.model';
import { ContactModel } from '../../../models/contact.model';
import { EntityType } from '../../../models/entity-type';
import { ContactOfContactModel } from '../../../models/contact-of-contact.model';

@Injectable()
export class LabPersonTypeDataResolver implements IMapResolverV2<ILabelValuePairModel> {
  /**
   * Constructor
   */
  constructor(
    private authDataService: AuthDataService
  ) {}

  /**
   * Retrieve data
   */
  resolve(): IResolverV2ResponseModel<ILabelValuePairModel> {
    // construct list
    const authUser = this.authDataService.getAuthenticatedUser();
    const entries: ILabelValuePairModel[] = [];
    if (CaseModel.canListLabResult(authUser)) {
      entries.push({
        label: EntityType.CASE,
        value: EntityType.CASE
      });
    }
    if (ContactModel.canListLabResult(authUser)) {
      entries.push({
        label: EntityType.CONTACT,
        value: EntityType.CONTACT
      });
    }
    if (ContactOfContactModel.canListLabResult(authUser)) {
      entries.push({
        label: EntityType.CONTACT_OF_CONTACT,
        value: EntityType.CONTACT_OF_CONTACT
      });
    }

    // construct map
    const response: IResolverV2ResponseModel<ILabelValuePairModel> = {
      list: entries,
      map: {},
      options: []
    };
    entries.forEach((item) => {
      // map
      response.map[item.value] = item;

      // add option
      response.options.push({
        label: item.label,
        value: item.value,
        data: item
      });
    });

    // finished
    return response;
  }
}
