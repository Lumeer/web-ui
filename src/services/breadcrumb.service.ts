//Taken from: http://stackoverflow.com/questions/37471515/create-breadcrumb-when-navigating-nested-components-angular-2/38310404#38310404
import {Injectable} from '@angular/core';
import {Router, RoutesRecognized, ActivatedRouteSnapshot} from '@angular/router';

@Injectable()
export class BreadcrumbService {
  public breadcrumbs: Array<any>;
  constructor(private _router: Router) {

    this._router.events.subscribe((eventData: any) => {
      if (eventData instanceof RoutesRecognized) {
        let currentUrlPart = eventData.state.root;
        let currUrl = ''; //for HashLocationStrategy

        this.breadcrumbs = [];
        while (currentUrlPart.children.length > 0) {
          currentUrlPart = currentUrlPart.children[0];

          currUrl += '/' + currentUrlPart.url.map(item => {
              return item.path;
            }).join('/');

          this.breadcrumbs.push({
            data: currentUrlPart.data,
            url: currUrl,
            params: currentUrlPart.params
          });
        }
      }
    });
  }}
