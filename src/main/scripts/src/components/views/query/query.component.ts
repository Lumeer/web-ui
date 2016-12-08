import { Component } from '@angular/core';
import {QueryTag, STRING, NUMBER} from '../../common/helpers/tag.interface';
import {QUERY_TAG_PLACEHOLDER} from '../../common/helpers/constants';
import {AutoCompleteOptions} from '../../common/auto-complete/autocomplete.interface';
import {KeycloakHttp} from '../../../services';
import {Http} from '@angular/http';

@Component({
  selector: 'views-query',
  template: require('./query.component.html')
})

export class QueryComponent {
  constructor(private http: Http) {}

  public colNames: any[] = [];
  public colValues: any[] = [];
  public collections: any[] = [];

  public items: Array<QueryTag> = [];

  public tagOptions = {};

  private collectionItem = {colName: 'Collection', colValue: 'Store', readOnly: ['colName'],
    sticky: true, source: this.collections, type: STRING};
  private sortByItem = {colName: 'Sort By', colValue: '*', readOnly: ['colName'],
    sticky: true, source: this.colNames, type: STRING};

  public ngOnInit() {
    this.initTagOptions();
    this.fetchColNames();
    this.fetchColValues();
    this.fetchCollections();
    this.fetchItems();
    console.log(this);
  }

  private fetchColNames() {
    this.http.get('/data/colnames.json')
      .map(res => res.json())
      .subscribe(colNames => {
        this.colNames = colNames;
        this.tagOptions['colName'] = colNames;
        this.tagOptions['values'] = colNames;
      });
  }

  private fetchColValues() {
    this.http.get('/data/colvalues.json')
      .map(res => res.json())
      .subscribe(colValues => {
        this.colValues = colValues;
        this.tagOptions['colValue'] = colValues;
      });
  }

  private fetchCollections() {
    this.http.get('/data/collections.json')
      .map(res => res.json())
      .subscribe(collections => {
        this.collections = collections;
        this.collectionItem.source = collections;
      });
  }

  private fetchItems() {
    this.items = [this.sortByItem, this.collectionItem];
    this.http.get('/data/queryitems.json')
      .map(res => res.json())
      .subscribe(items => this.items = [...this.items, ...items]);
  }

  private initTagOptions() {
    this.tagOptions = {
      toDisplay: ['colName', 'colValue'],
      colName: this.colNames,
      colValue: this.colValues,
      values: this.colNames,
      operandTypes: {type: 'string', values: ['&', '||']},
      equalityValues: {
        [STRING]: {
          type: 'icon',
          values: [{icon: 'fa-exchange', value: 'like'}, {icon: 'fa-code', value: 'not-like'}]
        },
        [NUMBER]: {
          type: 'string',
          values: ['==', '>', '<', '>=', '=<']
        }
      }
    }
  }

  public autocompleteOptions: AutoCompleteOptions = {
    displayKey: 'text'
  };

  public placeholder = QUERY_TAG_PLACEHOLDER.PREFIX + QUERY_TAG_PLACEHOLDER.NAME;

  public deleteTag(tagIndex) {
    if (!this.items[tagIndex].sticky) {
      this.items.splice(tagIndex, 1);
      this.placeholder = QUERY_TAG_PLACEHOLDER.PREFIX + QUERY_TAG_PLACEHOLDER.NAME;
      this.tagOptions['values'] = this.colNames;
    }
  }

  public addItem(currentTag) {
    if (currentTag.index !== -1) {
      this.items[currentTag.index].colValue = currentTag.dataPayload.colValue;
      this.items[currentTag.index].colName = currentTag.dataPayload.colName;
      this.items[currentTag.index].type = QueryComponent.getType(currentTag.dataPayload.colValue);
      this.items[currentTag.index].equality = currentTag.dataPayload.equality;
      this.items[currentTag.index].operand = currentTag.dataPayload.operand;
    } else {
      if (this.items[this.items.length - 1] && this.items[this.items.length - 1].colValue === '') {
        this.items[this.items.length - 1].colValue = currentTag.dataPayload;
        this.items[this.items.length - 1].type = QueryComponent.getType(currentTag.dataPayload);
        this.placeholder = QUERY_TAG_PLACEHOLDER.PREFIX + QUERY_TAG_PLACEHOLDER.NAME;
        this.tagOptions['values'] = this.colNames;
      } else {
        this.items.push({colName: currentTag.dataPayload, colValue: '', type: STRING});
        this.placeholder = QUERY_TAG_PLACEHOLDER.PREFIX + QUERY_TAG_PLACEHOLDER.VALUE;
        this.tagOptions['values'] = this.colValues;
      }
    }
  }

  private static isNumber(itemValue) {
    return /^\d+$/.test(itemValue);
  }

  private static getType(itemValue) {
    return QueryComponent.isNumber(itemValue) ? NUMBER : STRING;
  }
}
