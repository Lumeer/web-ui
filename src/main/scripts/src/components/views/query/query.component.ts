import { Component } from '@angular/core';
import {QueryTag, STRING, NUMBER} from '../../common/helpers/tag.interface';
import {QUERY_TAG_PLACEHOLDER} from '../../common/helpers/constants';
import {AutoCompleteOptions} from '../../common/auto-complete/autocomplete.interface';

@Component({
  selector: 'views-query',
  template: require('./query.component.html')
})

export class QueryComponent {
  public colNames = [
    {text: 'Food'}, {text: 'Ingredient'}, {text: 'Beverage'}
  ];

  public colValues = [
    {text: 'Burger'}, {text: 'Pizza'}, {text: 'Bacon'}, {text: 'Salad'}, {text: 'Water'}, {text: 'Coke'}
  ];

  private collections = [
    {text: 'Store'}, {text: 'Restaurant'}, {text: 'Fast food'}
  ];

  public items: Array<QueryTag> = [
    {colName: 'Sort By', colValue: '*', readOnly: ['colName'], sticky: true, source: this.colNames, type: STRING},
    {colName: 'Collection', colValue: 'Store', readOnly: ['colName'], sticky: true, source: this.collections, type: STRING},
    {colValue: 'Pizza', colName: 'Food', type: STRING},
    {colValue: 'Burger', colName: 'Food', type: STRING}
  ];
  public tagOptions = {
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
  };

  public autocompleteOptions: AutoCompleteOptions = {
    displayKey: 'text'
  };
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
        this.tagOptions.values = this.colNames;
      } else {
        this.items.push({colName: currentTag.dataPayload, colValue: '', type: STRING});
        this.placeholder = QUERY_TAG_PLACEHOLDER.PREFIX + QUERY_TAG_PLACEHOLDER.VALUE;
        this.tagOptions.values = this.colValues;
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
