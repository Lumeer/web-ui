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

import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {KeyCode} from '../../../key-code';
import {HtmlModifier} from '../../../utils/html-modifier';
import {QueryItem} from '../query-item/model/query-item';
import {SearchSuggestionsComponent} from './suggestions/search-suggestions.component';
import {View} from '../../../../core/store/views/view';

@Component({
  selector: 'search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent {
  @Input()
  public queryItems: QueryItem[] = [];

  @Input()
  public currentView: View;

  @Output()
  public addQueryItem = new EventEmitter<QueryItem>();

  @Output()
  public removeQueryItem = new EventEmitter();

  @Output()
  public search = new EventEmitter();

  @ViewChild('searchInput')
  private searchInput: ElementRef;

  @ViewChild(SearchSuggestionsComponent)
  public searchSuggestions: SearchSuggestionsComponent;

  public suggesting: boolean;
  public text = '';

  public onUseSuggestion(suggestion: QueryItem) {
    this.addQueryItem.emit(suggestion);
    this.text = '';

    setTimeout(() => this.focusInput());
  }

  public removeHtmlComments(html: HTMLElement): string {
    return HtmlModifier.removeHtmlComments(html);
  }

  public focusInput() {
    this.searchInput.nativeElement.focus();
  }

  public onBlur() {
    this.suggesting = false;
  }

  public onFocus() {
    this.suggesting = true;
  }

  public onInput(event: Event) {
    this.text = event.target['value'];
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
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
    const direction = event.code === KeyCode.ArrowUp ? -1 : 1;
    this.searchSuggestions.moveSelection(direction);
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
    if (this.text) {
      this.searchSuggestions.useSelection(this.text);
    } else {
      this.search.emit();
    }
  }
}
