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

import {
  AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, QueryList, ViewChild,
  ViewChildren
} from '@angular/core';
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
import {WorkspaceService} from '../../core/workspace.service';
import {QueryItem} from './query-item/query-item';
import {FulltextQueryItem} from './query-item/fulltext-query-item';
import {AttributeQueryItem} from './query-item/attribute-query-item';
import {CollectionQueryItem} from './query-item/collection-query-item';
import {Collection} from '../../core/dto/collection';
import {QueryItemsConverter} from './query-item/query-items-converter';
import {Query} from '../../core/dto/query';
import {QueryConverter} from '../utils/query-converter';
import {ViewService} from '../../core/rest/view.service';
import {KeyCode} from '../key-code';
import {HtmlModifier} from '../utils/html-modifier';
import {QueryItemType} from './query-item/query-item-type';
import {ConditionQueryItem} from './query-item/condition-query-item';
import {SearchService} from '../../core/rest/search.service';
import {SuggestionType} from '../../core/dto/suggestion-type';

@Component({
  selector: 'search-box',
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.scss'],
  providers: [QueryItemsConverter]
})
export class SearchBoxComponent implements OnInit, AfterViewInit {

  @ViewChildren('queryItemCondition')
  public conditions: QueryList<ElementRef>;

  @ViewChild('searchBox')
  public input: ElementRef;

  public queryItems: QueryItem[] = [];
  public suggestionItems: QueryItem[] = [];

  private searchTerms = new Subject<string>();

  public text: string = '';
  public shouldShowSuggestions: boolean = false;
  public selectedSuggestion: number = -1;
  private shouldFocusCondition: boolean = false;
  private selectedQueryItem: number = -1;
  private textCopy: string = '';

  constructor(private activatedRoute: ActivatedRoute,
              private queryItemsConverter: QueryItemsConverter,
              private router: Router,
              private searchService: SearchService,
              private viewService: ViewService,
              private workspaceService: WorkspaceService,
              private ref: ChangeDetectorRef) {
  }

  public ngOnInit(): void {
    this.getQueryItemsFromQueryParams();
    this.getQueryItemsFromView();
    this.suggestQueryItems();
  }

  public ngAfterViewInit(): void {
    this.conditions.changes.subscribe(change => {
      if (this.shouldFocusCondition && change.last) {
        this.shouldFocusCondition = false;
        setTimeout(() => change.last.nativeElement.focus());
        this.selectedQueryItem = change.last.nativeElement.id;
        this.suggestionItems = ConditionQueryItem.conditions.map(condition => new ConditionQueryItem(condition))
        this.ref.detectChanges();
      }
    });
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
    this.searchTerms
      .startWith('')
      .debounceTime(300)
      .switchMap(text => this.retrieveSuggestions(text))
      .switchMap(suggestions => this.convertSuggestionsToQueryItems(suggestions))
      .map(queryItems => this.filterUsedQueryItems(queryItems))
      .catch(error => {
        console.error(error); // TODO: add real error handling
        return Observable.of<QueryItem[]>();
      }).subscribe(items => {
      this.selectedSuggestion = -1;
      this.suggestionItems = items;
    });
  }

  private retrieveSuggestions(text: string): Observable<Suggestions> {
    if (text) {
      return this.searchService.suggest(text.toLowerCase(), SuggestionType.All);
    }
    return Observable.of<Suggestions>();
  }

  private convertSuggestionsToQueryItems(suggestions: Suggestions): Observable<QueryItem[]> {
    let suggestedQueryItems: QueryItem[] = [];

    suggestedQueryItems = suggestedQueryItems.concat(this.createCollectionQueryItems(suggestions.collections));
    suggestedQueryItems = suggestedQueryItems.concat(this.createAttributeQueryItems(suggestions.attributes));
    // TODO add views
    if (!this.isFullTextQueryPresented()) {
      suggestedQueryItems.push(new FulltextQueryItem(this.text));
    }

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

  public onRemoveQueryItem(index: number) {
    let numToDelete = 1;
    if (this.queryItems[index].type == QueryItemType.Collection && index + 1 < this.queryItems.length) {
      for (let i = index + 1; i < this.queryItems.length; i++) {
        if (this.queryItems[i].type == QueryItemType.Attribute) {
          numToDelete++;
        } else {
          break;
        }
      }
    }
    this.queryItems.splice(index, numToDelete);
  }

  public onKeyUp(event: KeyboardEvent) {
    switch (event.keyCode) {
      case KeyCode.Enter:
      case KeyCode.UpArrow:
      case KeyCode.DownArrow:
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
        event.preventDefault();
        this.addItemOrSearch();
        return;
      case KeyCode.DownArrow:
        this.incSelectedSuggestionAndEditText();
        return;
      case KeyCode.UpArrow:
        this.decSelectedSuggestionAndEditText();
        return;
    }
  }

  public onKeyDownCondition(event: KeyboardEvent, id: number) {
    switch (event.keyCode) {
      case KeyCode.Enter:
        event.preventDefault();
        if (this.selectedSuggestion >= 0) {
          this.addCondition(id);
        } else {
          this.input.nativeElement.focus();
        }
        return;
      case KeyCode.DownArrow:
        this.incSelectedSuggestion();
        return;
      case KeyCode.UpArrow:
        this.decSelectedSuggestion();
        return;
    }
  }

  public onConditionBlur() {
    this.clearSuggestions();
    this.selectedQueryItem = -1;
  }

  private addCondition(ix: number) {
    this.queryItems[ix].condition = this.suggestionItems[this.selectedSuggestion].text;
    this.findConditionElementAndFocus(ix);
    this.clearSuggestions();
  }

  private incSelectedSuggestion() {
    if (this.selectedSuggestion + 1 >= this.suggestionItems.length) {
      this.selectedSuggestion = this.suggestionItems.length - 1;
      return;
    }
    this.selectedSuggestion++;
  }

  private decSelectedSuggestion() {
    if (this.selectedSuggestion <= -1) {
      this.selectedSuggestion = -1;
      return;
    }
    this.selectedSuggestion--;
  }

  private incSelectedSuggestionAndEditText() {
    if (this.selectedSuggestion + 1 >= this.suggestionItems.length) {
      this.selectedSuggestion = this.suggestionItems.length - 1;
      return;
    }
    if (this.selectedSuggestion == -1) {
      this.textCopy = this.text;
    }
    this.selectedSuggestion++;
    this.text = this.suggestionItems[this.selectedSuggestion].text;
  }

  private decSelectedSuggestionAndEditText() {
    if (this.selectedSuggestion <= -1) {
      this.selectedSuggestion = -1;
      return;
    }
    if (this.selectedSuggestion == 0) {
      this.selectedSuggestion = -1;
      this.text = this.textCopy;
    } else {
      this.selectedSuggestion--;
      this.text = this.suggestionItems[this.selectedSuggestion].text;
    }
  }

  private removeItem() {
    if (this.text === '') {
      event.preventDefault();
      this.queryItems.pop();
    }
  }

  private addItemOrSearch() {
    if (this.selectedSuggestion >= 0 && this.selectedSuggestion < this.suggestionItems.length) {
      this.addQueryItem(this.suggestionItems[this.selectedSuggestion]);
    } else {
      this.search();
    }
  }

  public suggest(): void {
    if (this.text == '') {
      this.clearSuggestions();
    } else {
      this.showSuggestions();
    }
    this.searchTerms.next(this.text);
  }

  public showSuggestions() {
    this.shouldShowSuggestions = true;
  }

  public hideSuggestions() {
    this.shouldShowSuggestions = false;
  }

  public clearSuggestions() {
    this.suggestionItems = [];
    this.selectedSuggestion = -1;
  }

  public onSuggestionClick(queryItem: QueryItem): void {
    this.addQueryItem(queryItem);
  }

  public onButtonClick() {
    this.search();
  }

  public search(): void {
    const organizationCode = this.workspaceService.organizationCode;
    const projectCode = this.workspaceService.projectCode;

    const items = this.queryItems.filter(item => item.isComplete());

    this.router.navigate(['/w', organizationCode, projectCode, 'view'], {
      queryParams: {
        query: this.queryItemsConverter.toQueryString(items),
        perspective: 'search',
        searchTab: 'collections' // TODO remove when `all` tab is implemented
      },
      queryParamsHandling: 'merge'
    });
  }

  private addQueryItem(queryItem: QueryItem) {
    if (queryItem.type == QueryItemType.Condition) {
      if (this.selectedQueryItem >= 0 && this.queryItems[this.selectedQueryItem].type == QueryItemType.Attribute) {
        (this.queryItems[this.selectedQueryItem] as AttributeQueryItem).condition = queryItem.text;
        this.findConditionElementAndFocus(this.selectedQueryItem);
      }
    } else {
      if (queryItem.type === QueryItemType.Attribute) {
        const collectionItem = (queryItem as AttributeQueryItem).toCollectionQueryItem();
        if (this.queryItems.length === 0 || !this.isOneOfLastItems(collectionItem)) {
          this.queryItems.push(collectionItem);
        }
        this.shouldFocusCondition = true;
      }
      this.queryItems.push(queryItem);
      this.text = '';
    }
    this.clearSuggestions();
  }

  private findConditionElementAndFocus(id: number) {
    const conditionElement = this.findConditionElement(id);
    if (conditionElement) {
      setTimeout(() => {
        conditionElement.nativeElement.focus();
        HtmlModifier.setCursorAtTextContentEnd(conditionElement.nativeElement);
      });
    }
  }

  private findConditionElement(id: number): ElementRef {
    const filtered = this.conditions.filter(element => element.nativeElement.id == id);
    return filtered.length == 1 ? filtered[0] : undefined;
  }

  private isOneOfLastItems(queryItem: CollectionQueryItem): boolean {
    if (this.queryItems.length > 0) {
      for (let i = this.queryItems.length - 1; i >= 0; i--) {
        const item = this.queryItems[i];
        if (item.type == QueryItemType.Collection) {
          return item.value === queryItem.value;
        }
      }
    }
    return false;
  }

  public removeHtmlComments(html: HTMLElement): string {
    return HtmlModifier.removeHtmlComments(html);
  }

  private isFullTextQueryPresented(): boolean {
    return this.queryItems.some(item => item.type === QueryItemType.Fulltext);
  }

  public isCollectionItem(queryItem: QueryItem): boolean {
    return queryItem.type === QueryItemType.Collection;
  }

}
