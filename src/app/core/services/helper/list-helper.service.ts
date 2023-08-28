import { Injectable } from '@angular/core';
import { ListFilterDataService } from '../data/list-filter.data.service';
import { ActivatedRoute, PRIMARY_OUTLET, Router } from '@angular/router';
import { Location } from '@angular/common';
import { StorageService } from './storage.service';
import { AuthDataService } from '../data/auth.data.service';
import { OutbreakDataService } from '../data/outbreak.data.service';
import { ToastV2Service } from './toast-v2.service';
import { OutbreakAndOutbreakTemplateHelperService } from './outbreak-and-outbreak-template-helper.service';
import { ListHelperModel } from './models/list-helper.model';

@Injectable()
export class ListHelperService {
  // helper
  public readonly model: ListHelperModel = new ListHelperModel();

  /**
   * Constructor
   * Used to easily inject services to list-component that is used to extend all list page compoenents
   */
  constructor(
    public toastV2Service: ToastV2Service,
    public listFilterDataService: ListFilterDataService,
    public route: ActivatedRoute,
    public router: Router,
    public location: Location,
    public storageService: StorageService,
    public authDataService: AuthDataService,
    public outbreakDataService: OutbreakDataService,
    public outbreakAndOutbreakTemplateHelperService: OutbreakAndOutbreakTemplateHelperService
  ) {}

  /**
   * Fallback url
   */
  public determineFallbackUrl(): string[] | boolean {
    // we don't have an url, so we can't parse it ?
    if (!this.router.url) {
      return false;
    }

    // parse url
    const parsedResult = this.router.parseUrl(this.router.url);
    if (
      !parsedResult.root ||
      !parsedResult.root.children ||
      !parsedResult.root.children[PRIMARY_OUTLET] ||
      !parsedResult.root.children[PRIMARY_OUTLET].segments ||
      parsedResult.root.children[PRIMARY_OUTLET].segments.length < 1
    ) {
      return false;
    }

    // finished - return path
    return parsedResult.root.children[PRIMARY_OUTLET].segments.map((segment, index) => {
      return `${index < 1 ? '/' : ''}${segment.path}`;
    });
  }
}

