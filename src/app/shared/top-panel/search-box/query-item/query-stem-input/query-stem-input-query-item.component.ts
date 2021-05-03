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
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {QueryStemInputQueryItem} from '../model/query-stem-input.query-item';
import {QueryItem} from '../model/query-item';
import {SearchSuggestionsComponent} from '../../input/suggestions/search-suggestions.component';
import {KeyCode} from '../../../../key-code';
import {QueryItemType} from '../model/query-item-type';

@Component({
  selector: 'query-stem-input-query-item',
  templateUrl: './query-stem-input-query-item.component.html',
  styleUrls: ['./query-stem-input-query-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryStemInputQueryItemComponent implements OnChanges {
  @Input()
  public queryItem: QueryStemInputQueryItem;

  @Output()
  public addQueryItem = new EventEmitter<QueryItem>();

  @Output()
  public textChange = new EventEmitter<string>();

  @ViewChild('searchInput', {static: false})
  private searchInput: ElementRef<HTMLInputElement>;

  @ViewChild(SearchSuggestionsComponent, {static: false})
  public searchSuggestions: SearchSuggestionsComponent;

  public readonly restrictedItemTypes = [QueryItemType.View, QueryItemType.Collection, QueryItemType.Fulltext];

  public suggesting: boolean;
  public text = '';

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.queryItem && this.queryItem) {
      this.text = this.queryItem.text || '';
    }
  }

  public onStartSuggesting() {
    this.suggesting = true;
    setTimeout(() => this.focusInput());
  }

  public onUseSuggestion(suggestion: QueryItem) {
    this.addQueryItem.emit(suggestion);
    this.textChange.emit('');
    this.text = '';
    this.suggesting = false;
  }

  public focusInput() {
    this.searchInput.nativeElement.focus();
    this.searchSuggestions?.open();
  }

  public onBlur() {
    this.suggesting = false;
    this.textChange.emit(this.text?.trim());
  }

  public onFocus() {
    this.suggesting = true;
  }

  public onInput(event: Event) {
    this.text = event.target['value'];
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Escape:
        this.onEscapeKeyDown();
        return;
      case KeyCode.ArrowDown:
      case KeyCode.ArrowUp:
        this.onUpAndDownArrowKeysDown(event);
        return;
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
        event.preventDefault();
        return;
    }
  }

  public onUpAndDownArrowKeysDown(event: KeyboardEvent) {
    event.preventDefault();
    const direction = event.code === KeyCode.ArrowUp ? -1 : 1;
    this.searchSuggestions?.moveSelection(direction);
  }

  public onEscapeKeyDown() {
    this.searchInput.nativeElement.blur();
  }

  public onEnterKeyUp() {
    if (this.text || this.searchSuggestions?.hasSelection()) {
      this.searchSuggestions?.useSelection(this.text);
    }
  }
}
