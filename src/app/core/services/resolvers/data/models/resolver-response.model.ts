import { Resolve } from '@angular/router';

export interface IResolverV2ResponseModel<T> {
  list: T[];
  map: {
    [id: string]: T
  };
}

// resolver
export type IMapResolverV2<T> = Resolve<IResolverV2ResponseModel<T>>;
