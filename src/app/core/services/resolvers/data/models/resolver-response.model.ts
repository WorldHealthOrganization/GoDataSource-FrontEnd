import { Resolve } from '@angular/router';
import { ILabelValuePairModel } from '../../../../../shared/forms-v2/core/label-value-pair.model';

export interface IResolverV2ResponseModel<T> {
  // items list
  list: T[];

  // map
  map: {
    [id: string]: T
  };

  // options
  options: ILabelValuePairModel[];
}

// resolver
export type IMapResolverV2<T> = Resolve<IResolverV2ResponseModel<T>>;
