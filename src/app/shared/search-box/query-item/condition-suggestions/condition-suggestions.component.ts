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

import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import {AttributeModel} from '../../../../core/store/collections/collection.model';

@Component({
  selector: 'condition-suggestions',
  templateUrl: './condition-suggestions.component.html'
})
export class ConditionSuggestionsComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  public attribute: AttributeModel;

  @Input()
  public text: string;

  @Input()
  public moveSelection$: Observable<number>;

  @Input()
  public useSelection$: Observable<string>;

  @Output()
  public useSuggestion = new EventEmitter<string>();

  public suggestions = ['=', '!=', '<', '>', '~']; // TODO suggest based on attribute constraints
  public selectedIndex = -1;

  private moveSelectionSubscription: Subscription;
  private useSelectionSubscription: Subscription;

  public suggesting = true;

  public ngOnInit() {
    this.subscribeToMoveSelection();
    this.subscribeToUseSelection();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('text')) {
      this.suggesting = !this.text;
    }
  }

  public ngOnDestroy() {
    if (this.moveSelectionSubscription) {
      this.moveSelectionSubscription.unsubscribe();
    }
    if (this.useSelectionSubscription) {
      this.useSelectionSubscription.unsubscribe();
    }
  }

  public onUseSuggestion(condition: string) {
    this.useSuggestion.emit(condition);
  }

  private subscribeToMoveSelection() {
    this.moveSelectionSubscription = this.moveSelection$.subscribe(direction => {
      const selectedIndex = this.selectedIndex + direction;
      if (0 <= selectedIndex && selectedIndex < this.suggestions.length) {
        this.selectedIndex = selectedIndex;
      }
    });
  }

  private subscribeToUseSelection() {
    this.useSelectionSubscription = this.useSelection$.subscribe(text => {
      const condition = this.selectedIndex >= 0 && this.suggestions[this.selectedIndex] ? this.suggestions[this.selectedIndex] : text;
      this.onUseSuggestion(condition);
    });
  }

}
