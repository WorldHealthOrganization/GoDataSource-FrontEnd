import { Injectable } from '@angular/core';
import { Params, Router } from '@angular/router';
import { OutbreakAndOutbreakTemplateHelperService } from './outbreak-and-outbreak-template-helper.service';

@Injectable()
export class RedirectService {
  constructor(
    private router: Router,
    public outbreakAndOutbreakTemplateHelperService: OutbreakAndOutbreakTemplateHelperService
  ) {}

  /**
   * Redirect to a specific route
   */
  to(
    path: string[],
    data?: any
  ) {
    this.router.navigate(
      ['/redirect'],
      {
        queryParams: {
          path: JSON.stringify(path),
          data: data ? JSON.stringify(data) : data
        }
      }
    );
  }

  /**
   * Return link & query params
   */
  linkAndQueryParams(
    path: string[],
    data?: any
  ):
    {
      link: () => string[],
      linkQueryParams: () => Params
    }
  {
    return {
      link: () => ['/redirect'],
      linkQueryParams: () => {
        return {
          path: JSON.stringify(path),
          data: data ? JSON.stringify(data) : data
        };
      }
    };
  }
}

