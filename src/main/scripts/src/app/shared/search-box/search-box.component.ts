/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
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
import {ViewService} from '../../core/rest/view.service';
import {KeyCode} from '../key-code';
import {HtmlModifier} from '../utils/html-modifier';

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
  public suggestions: Observable<QueryItem[]>;

  public text = '';
  private type = SuggestionType.All;

  constructor(private activatedRoute: ActivatedRoute,
              private queryItemsConverter: QueryItemsConverter,
              private router: Router,
              private searchService: SearchService,
              private viewService: ViewService,
              private workspaceService: WorkspaceService) {
  }

  public ngOnInit(): void {
    this.getQueryItemsFromQueryParams();
    this.getQueryItemsFromView();
    this.suggestQueryItems();
  }

  private getQueryItemsFromQueryParams() {
    this.activatedRoute.queryParamMap
      .map((queryParams: ParamMap) => QueryConverter.fromString(queryParams.get('query')))
      .switchMap((query: Query) => this.queryItemsConverter.fromQuery(query))
      .subscribe(queryItems => {
        if (this.queryItems.length === 0) {
          this.queryItems = queryItems;
        }
      });
  }

  private getQueryItemsFromView() {
    if (!this.activatedRoute.firstChild) {
      return;
    }

    this.activatedRoute.firstChild.paramMap
      .map((params: ParamMap) => params.get('viewCode'))
      .switchMap(viewCode => this.viewService.getView(viewCode))
      .switchMap(view => view ? this.queryItemsConverter.fromQuery(view.query) : Observable.of([]))
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
      case KeyCode.Enter:
        return;
      case KeyCode.Backspace:
      default:
        this.suggest();
    }
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case KeyCode.Backspace:
        this.removeItem();
        return;
      case KeyCode.Enter:
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

    this.router.navigate(['/w', organizationCode, projectCode, 'view'], {
      queryParams: {
        query: this.queryItemsConverter.toQueryString(this.queryItems),
        perspective: 'search',
        searchTab: 'collections' // TODO remove when `all` tab is implemented
      },
      queryParamsHandling: 'merge'
    });
  }

  private addQueryItem(queryItem: QueryItem) {
    this.queryItems.push(queryItem);
    this.currentQueryItem = new FulltextQueryItem('');
    this.text = '';
    this.hideSuggestions();
  }

  public removeHtmlComments(html: HTMLElement): string {
    return HtmlModifier.removeHtmlComments(html);
  }

}
