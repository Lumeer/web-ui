import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Subject} from 'rxjs';

@Injectable()
export class QueryTagService {
  public tagNamesUrl: string = 'data/colnames.json';
  public tagValuesUrl: string = 'data/colvalues.json';
  public collectionsUrl: string = 'data/collections.json';
  public itemsUrl: string = 'data/queryitems.json';
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
