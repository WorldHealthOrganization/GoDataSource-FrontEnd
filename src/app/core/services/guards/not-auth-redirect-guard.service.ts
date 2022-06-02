import { CanActivate, Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { AuthDataService } from '../data/auth.data.service';

@Injectable()
export class NotAuthRedirectGuard implements CanActivate {
  /**
   * Constructor
   */
  constructor(
    private authDataService: AuthDataService,
    private router: Router
  ) {}

  /**
   * Can activate
   */
  canActivate(): boolean {
    // get the authenticated user
    const user = this.authDataService.getAuthenticatedUser();

    // not authenticated ?
    if (!user) {
      this.router.navigate(['/auth/login']);

      // stop
      return false;
    }

    // load page
    return true;
  }
}
