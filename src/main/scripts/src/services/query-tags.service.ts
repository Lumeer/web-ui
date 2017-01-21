import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Subject} from 'rxjs';

@Injectable()
export class QueryTagService {
  public tagNamesUrl: string = `${window['lumeer'].constants.publicPath}/data/colnames.json`;
  public tagValuesUrl: string = `${window['lumeer'].constants.publicPath}/data/colvalues.json`;
  public collectionsUrl: string = `${window['lumeer'].constants.publicPath}/data/collections.json`;
  public itemsUrl: string = `${window['lumeer'].constants.publicPath}/data/queryitems.json`;
  public filterUpdateSubject: Subject<any> = new Subject();

  constructor(private http: Http) {}

  public fetchAllTagNames(filter?) {
    return this.http.get(this.tagNamesUrl)
      .map(res => res.json());
  }

  public fetchAllTagValues(filter?) {
    return this.http.get(this.tagValuesUrl)
      .map(res => res.json());
  }

  public fetchCollections(filter?) {
    return this.http.get(this.collectionsUrl)
      .map(res => res.json());
  }

  public fetchItems(filter?) {
    return this.http.get(this.itemsUrl)
      .map(res => res.json());
  }

  public addNewCollectionToFilter(collection) {
    this.filterUpdateSubject.next({collection: collection});
  }
}
