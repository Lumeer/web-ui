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

import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {Subject} from 'rxjs';
import {KeyCode} from '../../key-code';
import {HtmlModifier} from '../../utils/html-modifier';
import {QueryItem} from '../query-item/model/query-item';

@Component({
  selector: 'search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss']
})
export class SearchInputComponent {

  @Input()
  public queryItems: QueryItem[] = [];

  @Output()
  public addQueryItem = new EventEmitter<QueryItem>();

  @Output()
  public removeQueryItem = new EventEmitter();

  @Output()
  public search = new EventEmitter();

  @ViewChild('searchInput')
  private searchInput: ElementRef;

  public suggesting: boolean;
  public text = '';

  public moveSuggestionSelection$ = new Subject<number>();
  public useSuggestionSelection$ = new Subject<string>();

  public onUseSuggestion(suggestion: QueryItem) {
    this.addQueryItem.emit(suggestion);
    this.text = '';

    if (suggestion.isComplete()) {
      setTimeout(() => this.searchInput.nativeElement.focus());
    }
  }

  public removeHtmlComments(html: HTMLElement): string {
    return HtmlModifier.removeHtmlComments(html);
  }

  public onBlur() {
    this.suggesting = false;
  }

  public onFocus() {
    this.suggesting = true;
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case KeyCode.Backspace:
        this.onBackspaceKeyDown();
        return;
      case KeyCode.Escape:
        this.onEscapeKeyDown();
        return;
      case KeyCode.DownArrow:
      case KeyCode.UpArrow:
        this.onUpAndDownArrowKeysDown(event);
        return;
    }
  }

  public onUpAndDownArrowKeysDown(event: KeyboardEvent) {
    event.preventDefault();
    const direction = event.keyCode === KeyCode.UpArrow ? -1 : 1;
    this.moveSuggestionSelection$.next(direction);
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
      this.useSuggestionSelection$.next(this.text);
    } else {
      this.search.emit();
    }
  }

}
