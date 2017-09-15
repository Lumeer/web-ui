/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';

import {Suggestions} from '../../core/dto/suggestions';
import {SearchService} from '../../core/rest/search.service';
import {WorkspaceService} from '../../core/workspace.service';
import {QueryItem} from './query-item/query-item';
import {FulltextQueryItem} from './query-item/fulltext-query-item';
import {AttributeQueryItem} from './query-item/attribute-query-item';
import {CollectionQueryItem} from './query-item/collection-query-item';
import {SuggestionType} from '../../core/dto/suggestion-type';
import {Collection} from '../../core/dto/collection';
import {QueryItemsConverter} from './query-item/query-items-converter';
import {Query} from '../../core/dto/query';
import {QueryConverter} from '../utils/query-converter';

const BACKSPACE_KEY = 8;
const ENTER_KEY = 13;

@Component({
  selector: 'search-box',
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.scss'],
  providers: [QueryItemsConverter]
})
export class SearchBoxComponent implements OnInit {

  public queryItems: QueryItem[] = [];
  public currentQueryItem: QueryItem = new FulltextQueryItem('');

  private searchTerms = new Subject<string>();
  private suggestions: Observable<QueryItem[]>;

  public text = '';
  private type = SuggestionType.All;

  constructor(private activatedRoute: ActivatedRoute,
              private queryItemsConverter: QueryItemsConverter,
              private router: Router,
              private searchService: SearchService,
              private workspaceService: WorkspaceService) {
  }

  public ngOnInit(): void {
    this.parseQueryItemsFromQueryParams();
    this.suggestQueryItems();
  }

  private parseQueryItemsFromQueryParams() {
    this.activatedRoute.queryParamMap
      .map((queryParams: ParamMap) => QueryConverter.fromString(queryParams.get('query')))
      .switchMap((query: Query) => this.queryItemsConverter.fromQuery(query))
      .subscribe(queryItems => {
        if (this.queryItems.length === 0) {
          this.queryItems = queryItems;
        }
      });
  }

  private suggestQueryItems() {
    this.suggestions = this.searchTerms
      .startWith('')
      .debounceTime(300)
      .distinctUntilChanged()
      .switchMap(text => this.retrieveSuggestions(text))
      .switchMap(suggestions => this.convertSuggestionsToQueryItems(suggestions))
      .map(queryItems => this.filterUsedQueryItems(queryItems))
      .catch(error => {
        console.error(error); // TODO: add real error handling
        return Observable.of<QueryItem[]>();
      });
  }

  private retrieveSuggestions(text: string): Observable<Suggestions> {
    return text ? this.searchService.suggest(text, this.type) : Observable.of<Suggestions>();
  }

  private convertSuggestionsToQueryItems(suggestions: Suggestions): Observable<QueryItem[]> {
    let suggestedQueryItems: QueryItem[] = [];

    suggestedQueryItems = suggestedQueryItems.concat(this.createCollectionQueryItems(suggestions.collections));
    suggestedQueryItems = suggestedQueryItems.concat(this.createAttributeQueryItems(suggestions.attributes));
    // TODO add views
    suggestedQueryItems.push(new FulltextQueryItem(this.text));

    return Observable.of(suggestedQueryItems);
  }

  private filterUsedQueryItems(queryItems: QueryItem[]): QueryItem[] {
    return queryItems.filter(queryItem => !this.queryItems.find(usedItem => usedItem.value === queryItem.value));
  }

  private createAttributeQueryItems(collections: Collection[]): QueryItem[] {
    return collections.map(collection => new AttributeQueryItem(collection));
  }

  private createCollectionQueryItems(collections: Collection[]): QueryItem[] {
    return collections.map(collection => new CollectionQueryItem(collection));
  }

  public onKeyUp(event: KeyboardEvent) {
    switch (event.keyCode) {
      case ENTER_KEY:
        return;
      case BACKSPACE_KEY:
      default:
        this.suggest();
    }
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case BACKSPACE_KEY:
        this.removeItem();
        return;
      case ENTER_KEY:
        this.addItemOrSearch();
        return;
    }
  }

  private removeItem() {
    if (this.text === '') {
      event.preventDefault();
      this.queryItems.pop();
    }
  }

  private addItemOrSearch() {
    if (this.text.trim() === '') {
      if (this.queryItems.length > 0) {
        this.search();
      }
    } else {
      this.currentQueryItem.text = this.text;
      this.addQueryItem(this.currentQueryItem);
    }
  }

  public suggest(): void {
    this.searchTerms.next(this.text);
  }

  public hideSuggestions(): void {
    this.searchTerms.next('');
  }

  public onSuggestionClick(queryItem: QueryItem): void {
    if (queryItem.isComplete()) {
      this.addQueryItem(queryItem);
    } else {
      this.currentQueryItem = queryItem;
    }
  }

  public onButtonClick() {
    if (this.currentQueryItem.isComplete()) {
      this.addQueryItem(this.currentQueryItem);
    }
    this.currentQueryItem = new FulltextQueryItem('');
    this.search();
  }

  public search(): void {
    const organizationCode = this.workspaceService.organizationCode;
    const projectCode = this.workspaceService.projectCode;

    this.router.navigate(['/w', organizationCode, projectCode, 'search', 'collections'],
      {queryParams: {query: this.queryItemsConverter.toQueryString(this.queryItems)}});
  }

  private addQueryItem(queryItem: QueryItem) {
    this.queryItems.push(queryItem);
    this.currentQueryItem = new FulltextQueryItem('');
    this.text = '';
    this.hideSuggestions();
  }

  public get placeholder(): string {
    return this.queryItems.length === 0 ? 'Type anything you search for...' : '';
  }

}
