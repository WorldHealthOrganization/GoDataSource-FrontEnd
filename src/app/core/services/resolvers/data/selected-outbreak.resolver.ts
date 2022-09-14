import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Resolve } from '@angular/router';
import { OutbreakModel } from '../../../models/outbreak.model';
import { OutbreakDataService } from '../../data/outbreak.data.service';

@Injectable()
export class SelectedOutbreakDataResolver implements Resolve<OutbreakModel> {
  /**
   * Constructor
   */
  constructor(
    private outbreakDataService: OutbreakDataService
  ) {}

  /**
   * Resolve response used later
   */
  resolve(): Observable<OutbreakModel> {
    // retrieve user information
    return this.outbreakDataService.determineSelectedOutbreak(true);
  }
}
