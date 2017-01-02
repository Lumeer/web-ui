import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Router} from '@angular/router';
import * as _ from 'lodash';

@Injectable()
export class NavigationChildrenService {
  constructor(public router: Router, private http: Http) {}

  public fetchDataForChildren() {
    _.chain(this.router.config)
      .flatMap(item => item.children)
      .map((child: any) => child && child.data && child.data.contentUrl && this.fetchChildContent(child))
      .value();
  }

  private fetchChildContent(child) {
    this.http.get(child.data.contentUrl)
      .map(res => res.json())
      .subscribe(items => child.data.childContent = items);
  }
}
