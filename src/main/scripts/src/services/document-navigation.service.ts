import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import * as _ from 'lodash';

@Injectable()
export class DocumentNavigationService {
  public activeFilter: any;
  public activeItem: any;
  constructor(private router: Router) {}

  public handleItemSelect(dataPayload?: any) {
    if (dataPayload) {
      if (dataPayload.child.id === 'query' && dataPayload.link) {
        this.activeFilter = dataPayload.link;
      }
      this.activeItem = dataPayload.child;
      let navigateTo: any = [`${dataPayload.parent.id}`, `${dataPayload.child.id}`];
      if (dataPayload.link) {
        this.router.navigate(navigateTo, {queryParams: {id: dataPayload.link.id}});
      } else {
        this.router.navigate(navigateTo);
      }
    } else {
      this.activeItem = { title: 'Home'};
      this.router.navigate([`/`]);
    }
  }

  public activeRoutes() {
    return _.chain(this.router.config)
            .flatMap(conf => conf.children)
            .filter(item => item && item.data['active'])
            .map((item: any) => {
              item.data.current = false;
              return item;
            })
            .value();
  }

  public getParentForChildRoute(childRoute) {
    let parents = this.router.config.filter(item => item.children && item.children
      .filter(child => child && child.data['id'] === childRoute.data.id).length !== 0
    );
    return parents && parents[0];
  }
}
