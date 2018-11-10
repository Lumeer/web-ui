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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'share-view-input',
  templateUrl: './share-view-input.component.html',
  styleUrls: ['./share-view-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareViewInputComponent {
  @Input()
  public text: string;

  @Input()
  public suggestions: string[];

  @Input()
  public selectedIndex: number;

  @Output()
  public suggestionChoose = new EventEmitter<string>();

  @Output()
  public inputKeyDown = new EventEmitter<KeyboardEvent>();

  @Output()
  public suggest = new EventEmitter();

  @Output()
  public inputChanged = new EventEmitter<string>();

  public onSuggestionClick(suggestion: string) {
    this.suggestionChoose.emit(suggestion);
  }

  public onKeyDown(event: KeyboardEvent) {
    this.inputKeyDown.emit(event);
  }

  public onSuggest() {
    this.suggest.emit();
  }

  public onInputChanged(value: string) {
    this.inputChanged.emit(value);
  }
}
