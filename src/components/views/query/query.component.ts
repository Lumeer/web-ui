import { Component } from '@angular/core';
import {QueryTag} from '../../common/helpers/tag.interface';
import {QUERY_TAG_PLACEHOLDER} from '../../common/helpers/constants';

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
    {colName: 'Sort By', colValue: '*', readOnly: ['colName'], sticky: true, source: this.colNames},
    {colName: 'Collection', colValue: 'Store', readOnly: ['colName'], sticky: true, source: this.collections},
    {colValue: 'Pizza', colName: 'Food'},
    {colValue: 'Burger', colName: 'Food'}
  ];
  public tagOptions = {
    toDisplay: ['colName', 'colValue'],
    colName: this.colNames,
    colValue: this.colValues,
  };

  public autocompleteOptions = {
    displayKey: 'text',
    values: this.colNames
  };
  public placeholder = QUERY_TAG_PLACEHOLDER.PREFIX + QUERY_TAG_PLACEHOLDER.NAME;

  public deleteTag(tagIndex) {
    if (!this.items[tagIndex].sticky) {
      this.items.splice(tagIndex, 1);
      this.placeholder = QUERY_TAG_PLACEHOLDER.PREFIX + QUERY_TAG_PLACEHOLDER.NAME;
      this.autocompleteOptions.values = this.colNames;
    }
  }

  public addItem(currentTag) {
    if (currentTag.index !== -1) {
      this.items[currentTag.index].colValue = currentTag.dataPayload.colValue;
      this.items[currentTag.index].colName = currentTag.dataPayload.colName;
    } else {
      if (this.items[this.items.length - 1] && this.items[this.items.length - 1].colValue === '') {
        this.items[this.items.length - 1].colValue = currentTag.dataPayload;
        this.placeholder = QUERY_TAG_PLACEHOLDER.PREFIX + QUERY_TAG_PLACEHOLDER.NAME;
        this.autocompleteOptions.values = this.colNames;
      } else {
        this.items.push({colName: currentTag.dataPayload, colValue: ''});
        this.placeholder = QUERY_TAG_PLACEHOLDER.PREFIX + QUERY_TAG_PLACEHOLDER.VALUE;
        this.autocompleteOptions.values = this.colValues;
      }
    }
  }
}
