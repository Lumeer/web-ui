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
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable, of, Subscription} from 'rxjs';
import {catchError, debounceTime, map, switchMap, withLatestFrom} from 'rxjs/operators';
import {SuggestionsDto, SuggestionType} from '../../../../../core/dto';
import {SearchService} from '../../../../../core/rest';
import {AppState} from '../../../../../core/store/app.state';
import {selectAllCollections} from '../../../../../core/store/collections/collections.state';
import {FulltextQueryItem} from '../../query-item/model/fulltext.query-item';
import {QueryItem} from '../../query-item/model/query-item';
import {QueryItemType} from '../../query-item/model/query-item-type';
import {convertSuggestionsDtoToModel} from './model/suggestions.converter';
import {convertSuggestionsToQueryItemsSorted, getCollectionIdsChainForItems} from './model/suggestions.util';

@Component({
  selector: 'search-suggestions',
  templateUrl: './search-suggestions.component.html',
  styleUrls: ['./search-suggestions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  constructor(private searchService: SearchService, private store: Store<AppState>) {}

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToSearchTerms());
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.queryItems && this.queryItems) {
      this.suggesting = !this.queryItems.find(queryItem => queryItem.type === QueryItemType.View);
    }
    if (changes.text) {
      this.searchTerms$.next(this.text);
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private subscribeToSearchTerms(): Subscription {
    return this.searchTerms$
      .pipe(
        debounceTime(300),
        switchMap(text => this.retrieveSuggestions(text)),
        withLatestFrom(this.store.pipe(select(selectAllCollections))),
        map(([suggestionsDto, collections]) => convertSuggestionsDtoToModel(suggestionsDto, collections)),
        map(suggestions => convertSuggestionsToQueryItemsSorted(suggestions, this.queryItems)),
        map(queryItems => this.addFulltextSuggestion(queryItems)),
        map(queryItems => this.filterUsedQueryItems(queryItems)),
        catchError(error => {
          console.error(error);
          return of<QueryItem[]>();
        })
      )
      .subscribe(suggestions => {
        this.suggestions$.next(suggestions);
        this.selectedIndex$.next(-1);
      });
  }

  private retrieveSuggestions(text: string): Observable<SuggestionsDto> {
    if (this.suggesting && text) {
      const priorityCollectionIds = getCollectionIdsChainForItems(this.queryItems);
      const dto = {text: text.toLowerCase(), type: SuggestionType.All, priorityCollectionIds};
      return this.searchService.suggest(dto);
    }
    return of<SuggestionsDto>(null);
  }

  private addFulltextSuggestion(queryItems: QueryItem[]): QueryItem[] {
    if (this.text) {
      return queryItems.concat(new FulltextQueryItem(this.text));
    } else {
      return queryItems;
    }
  }

  private filterUsedQueryItems(queryItems: QueryItem[]): QueryItem[] {
    const allowedTypes = [QueryItemType.Attribute, QueryItemType.Link, QueryItemType.Document];
    return queryItems.filter(
      queryItem =>
        allowedTypes.includes(queryItem.type) ||
        !this.queryItems.find(usedItem => {
          return usedItem.type === queryItem.type && usedItem.value === queryItem.value;
        })
    );
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

  public onUseSuggestion(queryItem: QueryItem) {
    this.useSuggestion.emit(queryItem);
    this.suggestions$.next([]);
  }
}
