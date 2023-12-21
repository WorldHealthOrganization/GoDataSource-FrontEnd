import { Injectable } from '@angular/core';
import { IMapResolverV2, IResolverV2ResponseModel } from './models/resolver-response.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { EntityType } from '../../../models/entity-type';

@Injectable()
export class FollowUpCreatedAsDataResolver implements IMapResolverV2<ILabelValuePairModel> {
  /**
   * Constructor
   */
  constructor() {}

  /**
   * Retrieve data
   */
  resolve(): IResolverV2ResponseModel<ILabelValuePairModel> {
    // construct list
    const entries: ILabelValuePairModel[] = [
      {
        label: EntityType.CASE,
        value: EntityType.CASE
      }, {
        label: EntityType.CONTACT,
        value: EntityType.CONTACT
      }
    ];

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
