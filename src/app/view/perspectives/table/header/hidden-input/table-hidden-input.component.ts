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

import {ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Actions, ofType} from '@ngrx/effects';
import {Subscription} from 'rxjs';
import {TablesAction, TablesActionType} from '../../../../../core/store/tables/tables.action';
import {Store} from '@ngrx/store';
import {KeyCode} from '../../../../../shared/key-code';

@Component({
  selector: 'table-hidden-input',
  templateUrl: './table-hidden-input.component.html',
  styleUrls: ['./table-hidden-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableHiddenInputComponent implements OnInit, OnDestroy {
  @ViewChild('hiddenInput')
  public hiddenInput: ElementRef<HTMLInputElement>;

  private subscriptions = new Subscription();

  constructor(private actions$: Actions, private store$: Store<{}>) {}

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToTableCursorActions());
  }

  private subscribeToTableCursorActions(): Subscription {
    return this.actions$.pipe(ofType<TablesAction.SetCursor>(TablesActionType.SET_CURSOR)).subscribe(action => {
      const element = this.hiddenInput.nativeElement;

      if (action.payload.cursor) {
        setTimeout(() => element.focus());
      } else {
        element.blur();
      }
    });
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.F2:
        event.preventDefault();
        event.stopPropagation();
        this.store$.dispatch(new TablesAction.EditSelectedCell({}));
        return;
      case KeyCode.Backspace:
      case KeyCode.Delete:
        event.preventDefault();
        event.stopPropagation();
        this.store$.dispatch(new TablesAction.RemoveSelectedCell());
        return;
    }
  }

  public onInput(event: KeyboardEvent) {
    const element = event.target as HTMLInputElement;
    this.store$.dispatch(new TablesAction.EditSelectedCell({value: element.value}));
    element.value = '';
  }

  public onClick(event: MouseEvent) {
    event.preventDefault();
  }
}
