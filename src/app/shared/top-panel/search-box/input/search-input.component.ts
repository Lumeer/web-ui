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
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

import {Direction} from '../../../direction';
import {KeyCode, keyboardEventCode} from '../../../key-code';
import {FulltextQueryItem} from '../query-item/model/fulltext.query-item';
import {QueryItem} from '../query-item/model/query-item';
import {QueryItemType} from '../query-item/model/query-item-type';
import {SearchSuggestionsComponent} from './suggestions/search-suggestions.component';

@Component({
  selector: 'search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'cursor-text'},
})
export class SearchInputComponent {
  @Input()
  public queryItems: QueryItem[] = [];

  @Input()
  public readonly: boolean;

  @Input()
  public restrictedMode: boolean;

  @Output()
  public addQueryItem = new EventEmitter<QueryItem>();

  @Output()
  public removeQueryItem = new EventEmitter();

  @Output()
  public search = new EventEmitter();

  @ViewChild('searchInput', {static: true})
  private searchInput: ElementRef<HTMLInputElement>;

  @ViewChild(SearchSuggestionsComponent, {static: true})
  public searchSuggestions: SearchSuggestionsComponent;

  public readonly emptyPlaceholder: string;
  public readonly placeholder: string;
  public readonly restrictedItemTypes = [QueryItemType.View, QueryItemType.Collection, QueryItemType.Link];

  public suggesting: boolean;
  public text = '';

  constructor(public hostElement: ElementRef) {
    this.emptyPlaceholder = $localize`:@@search.input.placeholder:Type anything you search for…`;
    this.placeholder = $localize`:@@search.input.placeholder.short:Search or filter…`;
  }

  public onUseSuggestion(suggestion: QueryItem) {
    this.addQueryItem.emit(suggestion);
    this.text = '';

    if (this.shouldFocusInput(suggestion)) {
      setTimeout(() => this.focusInput());
    } else {
      this.searchInput.nativeElement.blur();
    }
  }

  private shouldFocusInput(suggestion: QueryItem): boolean {
    return [QueryItemType.Collection, QueryItemType.Link, QueryItemType.Fulltext].includes(suggestion.type);
  }

  @HostListener('click', ['$event'])
  public onClick(event: MouseEvent) {
    this.focusInput();
  }

  @HostListener('mousedown', ['$event'])
  public onMouseDown(event: MouseEvent) {
    const targetingHost = (event.target as Element) === this.hostElement.nativeElement;
    if (targetingHost && this.suggesting) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  public focusInput() {
    this.searchInput.nativeElement.focus();
  }

  public onBlur() {
    this.suggesting = false;

    const fulltext = (this.text || '').trim();
    if (fulltext) {
      this.addQueryItem.emit(new FulltextQueryItem(fulltext));
      this.text = '';
    }
  }

  public onFocus() {
    this.suggesting = true;
  }

  public onInput(event: Event) {
    this.text = event.target['value'];
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (keyboardEventCode(event)) {
      case KeyCode.Backspace:
        this.onBackspaceKeyDown();
        return;
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
    const direction = keyboardEventCode(event) === KeyCode.ArrowUp ? Direction.Up : Direction.Down;
    this.searchSuggestions?.moveSelection(direction);
  }

  public onBackspaceKeyDown() {
    const {selectionStart, selectionEnd} = this.searchInput.nativeElement;
    if (selectionStart === 0 && selectionEnd === 0) {
      this.removeQueryItem.emit();
    }
  }

  public onEscapeKeyDown() {
    this.searchInput.nativeElement.blur();
  }

  public onEnterKeyUp() {
    if (this.text || this.searchSuggestions?.hasSelection()) {
      this.searchSuggestions?.useSelection(this.text);
    } else {
      this.search.emit();
      this.searchInput.nativeElement.blur();
    }
  }
}
