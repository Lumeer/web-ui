import {Component, EventEmitter, Output} from '@angular/core';
import {QueryTag, STRING, NUMBER} from '../helpers/tag.interface';
import {QUERY_TAG_PLACEHOLDER} from '../helpers/constants';
import {AutoCompleteOptions} from '../auto-complete/autocomplete.interface';
import {ITagOptions, TagBuilder} from '../../views/research/query-tag.inteface';
import * as _ from 'lodash';
import {ActivatedRoute} from '@angular/router';
import {QueryTagService} from '../../../services/query-tags.service';

const COLLECTION = {text: 'Collection', type: 'collection'};
const SORT_BY = {text: 'Sort By', type: 'sortby'};

@Component({
  selector: 'query-filter',
  template: require('./filter.component.html')
})

export class FilterComponent {
  constructor(private route: ActivatedRoute, private queryTagService: QueryTagService) {
    this.initTagOptions();
  }

  @Output() public filterChanged: EventEmitter<any> = new EventEmitter();

  public colNames: any[] = [];
  public colValues: any[] = [];
  public collections: any[] = [];
  public items: QueryTag[] = [];
  public tagOptions: ITagOptions;

  public autocompleteOptions: AutoCompleteOptions = {
    displayKey: 'text',
    filterFn: (item, currentValue) => this.filterValues(item, currentValue)
  };

  private collectionItem = {colValue: 'Store', colName: 'Collection', readOnly: ['colName'],
    source: this.collections, type: STRING};
  private sortByItem = {colName: 'Sort By', colValue: '*', readOnly: ['colName'],
    source: this.colNames, type: STRING};

  public ngOnInit() {
    this.fetchColNames();
    this.fetchColValues();
    this.fetchCollections();
    this.route.queryParams.subscribe(keys => this.fetchItems(keys['id']));
  }

  private fetchColNames() {
    //TODO: Send active filter with request to fetch correct names (for autocomplete)
    this.queryTagService.fetchAllTagNames()
      .subscribe(colNames => {
        this.colNames = [COLLECTION, SORT_BY, ...colNames];
        this.tagOptions.withColNames(this.colNames);
        this.tagOptions.values = this.colNames;
      });
  }

  private fetchColValues() {
    //TODO: Send active filter with request to fetch correct values (for autocomplete)
    this.queryTagService.fetchAllTagValues()
      .subscribe(colValues => {
        this.colValues = colValues;
        this.tagOptions.withColValues(colValues);
      });
  }

  private fetchCollections() {
    //TODO: Send active filter with request to fetch correct collections (for autocomplete)
    this.queryTagService.fetchCollections()
      .subscribe(collections => {
        this.collections = collections;
        this.collectionItem.source = collections;
      });
  }

  private fetchItems(activeFilter?: any) {
    //TODO: Send active filter ID with request to fetch correct items in research
    this.queryTagService.fetchItems()
      .flatMap(res => res)
      .reduce((result: any[], item: any) => {
        item.operand = item.operand || this.defaultOperand();
        item.equality = item.equality || this.defaultEquality(item.colValue);
        return [...result, item];
      }, [])
      .subscribe(items => this.items = items);
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
    this.filterChanged.emit(this.items);
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
    this.filterChanged.emit(this.items);
  }

  private editItem(indexOfItem, data) {
    this.items[indexOfItem].colValue = data.colValue;
    this.items[indexOfItem].colName = data.colName;
    this.items[indexOfItem].type = FilterComponent.getType(data.colValue);
    this.items[indexOfItem].equality = data.equality;
    this.items[indexOfItem].operand = data.operand;
  }

  private newItemValue(data) {
    this.items[this.items.length - 1].colValue = data;
    this.items[this.items.length - 1].type = FilterComponent.getType(data);
    this.items[this.items.length - 1].operand = this.defaultOperand();
    this.items[this.items.length - 1].equality = this.defaultEquality(data);
    this.placeholder = QUERY_TAG_PLACEHOLDER.PREFIX + QUERY_TAG_PLACEHOLDER.NAME;
    this.tagOptions.values = this.colNames;
  }

  private newItem(data) {
    if (data === COLLECTION.text) {
      let newCollection = _.cloneDeep(this.collectionItem);
      newCollection.colValue = '';
      this.items.push(newCollection);
      this.placeholder = QUERY_TAG_PLACEHOLDER.PREFIX + QUERY_TAG_PLACEHOLDER.COLLECTION;
      this.tagOptions.values = newCollection.source;
    } else {
      this.items.push({colName: data, colValue: '', type: FilterComponent.getType(data)});
      this.placeholder = QUERY_TAG_PLACEHOLDER.PREFIX + QUERY_TAG_PLACEHOLDER.VALUE;
      this.tagOptions.values = this.colValues;
    }
  }

  private static isNumber(itemValue) {
    return /^\d+$/.test(itemValue);
  }

  private static getType(itemValue) {
    return FilterComponent.isNumber(itemValue) ? NUMBER : STRING;
  }

  private defaultOperand(): string {
    return <string>this.tagOptions.operandTypes.values[0];
  }

  private defaultEquality(data): string {
    return FilterComponent.getType(data) === STRING ?
      this.tagOptions.equalityValues.string.values[0]['value'] : this.tagOptions.equalityValues.number.values[0];
  }

  private filterValues(oneItem, currentValue) {
    let currentData = currentValue.trim().toLowerCase();
    if (currentData !== '') {
      return oneItem[this.autocompleteOptions.displayKey].toLowerCase().indexOf(currentData) !== -1;
    }
    return true;
  }
}
