import { Component } from '@angular/core';
import {QueryTag, STRING, NUMBER} from '../../common/helpers/tag.interface';
import {QUERY_TAG_PLACEHOLDER} from '../../common/helpers/constants';
import {AutoCompleteOptions} from '../../common/auto-complete/autocomplete.interface';
import {Http} from '@angular/http';
import {ITagOptions, TagBuilder} from './query-tag.inteface';

@Component({
  selector: 'views-query',
  template: require('./query.component.html')
})

export class QueryComponent {
  constructor(private http: Http) {
    this.initTagOptions();
  }

  public colNames: any[] = [];
  public colValues: any[] = [];
  public collections: any[] = [];
  public items: QueryTag[] = [];
  public tagOptions: ITagOptions;

  public autocompleteOptions: AutoCompleteOptions = {
    displayKey: 'text'
  };

  private collectionItem = {colValue: 'Store', colName: 'Collection', readOnly: ['colName'],
    sticky: true, source: this.collections, type: STRING};
  private sortByItem = {colName: 'Sort By', colValue: '*', readOnly: ['colName'],
    sticky: true, source: this.colNames, type: STRING};

  public ngOnInit() {
    this.fetchColNames();
    this.fetchColValues();
    this.fetchCollections();
    this.fetchItems();
  }

  private fetchColNames() {
    this.http.get('/data/colnames.json')
      .map(res => res.json())
      .subscribe(colNames => {
        this.colNames = colNames;
        this.tagOptions.withColNames(colNames);
        this.tagOptions.values = colNames;
      });
  }

  private fetchColValues() {
    this.http.get('/data/colvalues.json')
      .map(res => res.json())
      .subscribe(colValues => {
        this.colValues = colValues;
        this.tagOptions.withColValues(colValues);
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
    this.tagOptions = new TagBuilder()
      .withOperands(['&', '||'])
      .withNumberEquality(['==', '>', '<', '>=', '=<'])
      .withStringEquality([{icon: 'fa-exchange', value: 'like'}, {icon: 'fa-code', value: 'not-like'}])
      .build();
  }

  public placeholder = QUERY_TAG_PLACEHOLDER.PREFIX + QUERY_TAG_PLACEHOLDER.NAME;

  public deleteTag(tagIndex) {
    if (!this.items[tagIndex].sticky) {
      this.items.splice(tagIndex, 1);
      this.placeholder = QUERY_TAG_PLACEHOLDER.PREFIX + QUERY_TAG_PLACEHOLDER.NAME;
      this.tagOptions.values = this.colNames;
    }
  }

  public addItem(currentTag) {
    if (currentTag.index !== -1) {
      this.editItem(currentTag.index, currentTag.dataPayload);
    } else {
      if (this.items[this.items.length - 1] && this.items[this.items.length - 1].colValue === '') {
        this.newItemValue(currentTag.dataPayload);
      } else {
        this.newItem(currentTag.dataPayload);
      }
    }
  }

  private editItem(indexOfItem, data) {
    this.items[indexOfItem].colValue = data.colValue;
    this.items[indexOfItem].colName = data.colName;
    this.items[indexOfItem].type = QueryComponent.getType(data.colValue);
    this.items[indexOfItem].equality = data.equality;
    this.items[indexOfItem].operand = data.operand;
  }

  private newItemValue(data) {
    this.items[this.items.length - 1].colValue = data;
    this.items[this.items.length - 1].type = QueryComponent.getType(data);
    this.placeholder = QUERY_TAG_PLACEHOLDER.PREFIX + QUERY_TAG_PLACEHOLDER.NAME;
    this.tagOptions.values = this.colNames;
  }

  private newItem(data) {
    this.items.push({colName: data, colValue: '', type: STRING});
    this.placeholder = QUERY_TAG_PLACEHOLDER.PREFIX + QUERY_TAG_PLACEHOLDER.VALUE;
    this.tagOptions.values = this.colValues;
  }

  private static isNumber(itemValue) {
    return /^\d+$/.test(itemValue);
  }

  private static getType(itemValue) {
    return QueryComponent.isNumber(itemValue) ? NUMBER : STRING;
  }
}
