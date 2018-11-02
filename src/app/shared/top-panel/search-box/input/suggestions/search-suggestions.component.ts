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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {Store} from '@ngrx/store';
import {BehaviorSubject, Observable, of, Subscription} from 'rxjs';
import {catchError, debounceTime, map, mergeMap, switchMap, withLatestFrom} from 'rxjs/operators';
import {Suggestions, SuggestionType} from '../../../../../core/dto';
import {SearchService} from '../../../../../core/rest';
import {AppState} from '../../../../../core/store/app.state';
import {selectAllCollections} from '../../../../../core/store/collections/collections.state';
import {FulltextQueryItem} from '../../query-item/model/fulltext.query-item';
import {QueryItem} from '../../query-item/model/query-item';
import {QueryItemType} from '../../query-item/model/query-item-type';
import {SuggestionsConverter} from './suggestions.converter';

@Component({
  selector: 'search-suggestions',
  templateUrl: './search-suggestions.component.html',
  styleUrls: ['./search-suggestions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchSuggestionsComponent implements OnChanges, OnDestroy, OnInit {

  @Input()
  public queryItems: QueryItem[] = [];

  @Input()
  public text: string;

  @Output()
  public useSuggestion = new EventEmitter<QueryItem>();

  public suggestions$ = new BehaviorSubject<QueryItem[]>([]);
  public selectedIndex$ = new BehaviorSubject(-1);

  public suggesting = true;

  private searchTerms$ = new BehaviorSubject('');

  private subscriptions = new Subscription();

  constructor(private searchService: SearchService,
              private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToSearchTerms());
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('queryItems') && this.queryItems) {
      this.suggesting = !this.queryItems.find(queryItem => queryItem.type === QueryItemType.View);
    }
    if (changes.hasOwnProperty('text')) {
      this.searchTerms$.next(this.text);
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private subscribeToSearchTerms(): Subscription {
    return this.searchTerms$.pipe(
      debounceTime(300),
      switchMap(text => this.retrieveSuggestions(text)),
      withLatestFrom(this.store.select(selectAllCollections)),
      mergeMap(([suggestions, collections]) => SuggestionsConverter.convertSuggestionsToQueryItems(suggestions, collections)),
      map(queryItems => this.filterViewQueryItems(queryItems)),
      map(queryItems => this.addFulltextSuggestion(queryItems)),
      map(queryItems => this.filterUsedQueryItems(queryItems)),
      catchError(error => {
        console.error(error);
        return of<QueryItem[]>();
      })
    ).subscribe(suggestions => {
      this.suggestions$.next(suggestions);
      this.selectedIndex$.next(-1);
    });
  }

  private retrieveSuggestions(text: string): Observable<Suggestions> {
    if (this.suggesting && text) {
      return this.searchService.suggest(text.toLowerCase(), SuggestionType.All);
    }
    return of<Suggestions>(null);
  }

  private addFulltextSuggestion(queryItems: QueryItem[]): QueryItem[] {
    if (!this.isFullTextPresented() && this.text) {
      return queryItems.concat(new FulltextQueryItem(this.text));
    } else {
      return queryItems;
    }
  }

  private filterViewQueryItems(queryItems: QueryItem[]): QueryItem[] {
    if (this.queryItems.length > 0) {
      return queryItems.filter(queryItem => queryItem.type !== QueryItemType.View);
    }
    return queryItems;
  }

  private filterUsedQueryItems(queryItems: QueryItem[]): QueryItem[] {
    return queryItems.filter(queryItem => !this.queryItems.find(usedItem => {
      return usedItem.type === queryItem.type && usedItem.value === queryItem.value;
    }));
  }

  public moveSelection(direction: number) {
    const selectedIndex = this.selectedIndex$.getValue() + direction;
    if (0 <= selectedIndex && selectedIndex < this.suggestions$.getValue().length) {
      this.selectedIndex$.next(selectedIndex);
    }
  }

  public useSelection(text: string) {
    const selectedIndex = this.selectedIndex$.getValue();
    const queryItem = this.suggestions$.getValue()[selectedIndex] || new FulltextQueryItem(text);
    this.onUseSuggestion(queryItem);
  }

  private isFullTextPresented(): boolean {
    return this.queryItems && !!this.queryItems.find(q => q.type === QueryItemType.Fulltext);
  }

  public onUseSuggestion(queryItem: QueryItem) {
    if (queryItem.type === QueryItemType.Fulltext && this.isFullTextPresented()) {
      return;
    }

    this.useSuggestion.emit(queryItem);
    this.suggestions$.next([]);
  }

}
