/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {BehaviorSubject, Observable, of, Subscription} from 'rxjs';
import {catchError, switchMap} from 'rxjs/operators';
import {QueryItem} from '../../query-item/model/query-item';
import {QueryItemType} from '../../query-item/model/query-item-type';
import {SuggestionsService} from '../../../../../core/service/suggestions-service';
import {isNotNullOrUndefined} from '../../../../utils/common.utils';
import {DropdownComponent} from '../../../../dropdown/dropdown.component';

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

  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public suggestByItems: boolean;

  @Input()
  public restrictedTypes: QueryItemType[] = [];

  @Output()
  public useSuggestion = new EventEmitter<QueryItem>();

  @ViewChild(DropdownComponent)
  public dropdown: DropdownComponent;

  public suggestions$ = new BehaviorSubject<QueryItem[]>([]);
  public selectedIndex$ = new BehaviorSubject(-1);

  public suggesting = true;

  private searchTerms$ = new BehaviorSubject('');

  private subscriptions = new Subscription();

  constructor(private suggestionsService: SuggestionsService) {}

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToSearchTerms());
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.queryItems && this.queryItems) {
      this.suggesting = !this.queryItems.find(queryItem => queryItem.type === QueryItemType.View);
      setTimeout(() => this.updatePosition());
    }
    if (changes.text || changes.queryItems) {
      this.searchTerms$.next(this.text);
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private subscribeToSearchTerms(): Subscription {
    return this.searchTerms$
      .pipe(
        switchMap(text => this.retrieveSuggestions(text)),
        catchError(error => {
          console.error(error);
          return of<QueryItem[]>();
        })
      )
      .subscribe(suggestions => this.onNewSuggestions(suggestions));
  }

  private onNewSuggestions(suggestions: QueryItem[]) {
    this.suggestions$.next(suggestions || []);
    this.selectedIndex$.next(-1);

    if (isNotNullOrUndefined(suggestions)) {
      this.open();
    } else {
      this.close();
    }
  }

  public open() {
    this.dropdown?.open();
  }

  public close() {
    this.dropdown?.close();
  }

  private updatePosition() {
    this.dropdown?.updatePosition();
  }

  private retrieveSuggestions(text: string): Observable<QueryItem[]> {
    if (this.suggesting && isNotNullOrUndefined(text)) {
      return this.suggestionsService.suggest(text, this.queryItems, this.suggestByItems, this.restrictedTypes);
    }
    return of(null);
  }

  public moveSelection(direction: number) {
    const selectedIndex = this.selectedIndex$.getValue() + direction;
    if (0 <= selectedIndex && selectedIndex < this.suggestions$.getValue().length) {
      this.selectedIndex$.next(selectedIndex);
    }
  }

  public hasSelection(): boolean {
    return this.selectedIndex$.getValue() > 0;
  }

  public useSelection(text: string) {
    const selectedIndex = this.selectedIndex$.getValue();
    const queryItem = this.suggestions$.getValue()[selectedIndex];
    if (queryItem) {
      this.onUseSuggestion(queryItem);
    } else {
      const fulltextQueryItem = this.suggestions$.value.find(
        suggestion => suggestion.type === QueryItemType.Fulltext && suggestion.text === text
      );
      if (fulltextQueryItem) {
        this.onUseSuggestion(fulltextQueryItem);
      }
    }
  }

  public onUseSuggestion(queryItem: QueryItem, event?: MouseEvent) {
    if (event) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
    this.useSuggestion.emit(queryItem);
  }
}
