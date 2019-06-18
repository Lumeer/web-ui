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

import {ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Actions, ofType} from '@ngrx/effects';
import {Subscription} from 'rxjs';
import {TablesAction, TablesActionType} from '../../../../../core/store/tables/tables.action';
import {select, Store} from '@ngrx/store';
import {KeyCode} from '../../../../../shared/key-code';
import {EDITABLE_EVENT} from '../../table-perspective.component';
import {Direction} from '../../../../../shared/direction';
import {selectTableCursor, selectTablePart} from '../../../../../core/store/tables/tables.selector';
import {CollectionPermissionsPipe} from '../../../../../shared/pipes/permissions/collection-permissions.pipe';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {TableBodyCursor} from '../../../../../core/store/tables/table-cursor';

@Component({
  selector: 'table-hidden-input',
  templateUrl: './table-hidden-input.component.html',
  styleUrls: ['./table-hidden-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableHiddenInputComponent implements OnInit, OnDestroy {
  @Input()
  public canManageConfig: boolean;

  @ViewChild('hiddenInput', {static: true})
  public hiddenInput: ElementRef<HTMLInputElement>;

  private subscriptions = new Subscription();

  private skipCompose = false;

  constructor(
    private actions$: Actions,
    private collectionPermissions: CollectionPermissionsPipe,
    private store$: Store<{}>
  ) {}

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToTableCursorActions());
  }

  private subscribeToTableCursorActions(): Subscription {
    // TODO check same tableId
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
    if (event.key === 'Dead') {
      this.skipCompose = true;
      return;
    }

    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.F2:
        event.preventDefault();
        event.stopPropagation();
        this.store$.dispatch(new TablesAction.EditSelectedCell({}));
        return;
      case KeyCode.Backspace:
        event.preventDefault();
        event.stopPropagation();
        this.store$.dispatch(new TablesAction.EditSelectedCell({clear: true}));
        return;
      case KeyCode.Delete:
        event.preventDefault();
        event.stopPropagation();
        this.store$.dispatch(new TablesAction.RemoveSelectedCell());
        return;
      case KeyCode.ArrowDown:
      case KeyCode.ArrowLeft:
      case KeyCode.ArrowRight:
      case KeyCode.ArrowUp:
        event.preventDefault();
        return;
      case KeyCode.Tab:
        return;
    }

    event.stopPropagation();

    this.onShortcutKeyDown(event);
  }

  private onShortcutKeyDown(event: KeyboardEvent) {
    this.store$
      .pipe(
        select(selectTableCursor),
        take(1),
        switchMap(cursor =>
          this.store$.pipe(
            select(selectTablePart(cursor)),
            take(1),
            filter(part => !!part),
            switchMap(part => this.collectionPermissions.transform({id: part.collectionId, name: null})),
            take(1),
            filter(() => !!cursor.rowPath),
            map(permissions => [cursor, permissions && permissions.writeWithView])
          )
        )
      )
      .subscribe(([cursor, writeWithView]: [TableBodyCursor, boolean]) => {
        event[EDITABLE_EVENT] = writeWithView;

        if (event.altKey && event.shiftKey && writeWithView && this.canManageConfig) {
          event.stopPropagation();
          switch (event.code) {
            case KeyCode.ArrowRight:
              this.store$.dispatch(new TablesAction.IndentRow({cursor}));
              return;
            case KeyCode.ArrowLeft:
              this.store$.dispatch(new TablesAction.OutdentRow({cursor}));
              return;
            case KeyCode.ArrowUp:
              this.store$.dispatch(new TablesAction.MoveRowUp({cursor}));
              this.store$.dispatch(new TablesAction.MoveCursor({direction: Direction.Up}));
              return;
            case KeyCode.ArrowDown:
              this.store$.dispatch(new TablesAction.MoveRowDown({cursor}));
              this.store$.dispatch(new TablesAction.MoveCursor({direction: Direction.Down}));
              return;
          }
        }
      });
  }

  public onInput(event: KeyboardEvent) {
    const element = event.target as HTMLInputElement;
    if ((event as any).isComposing && this.skipCompose) {
      this.skipCompose = false;
      return;
    }

    this.skipCompose = false;
    this.store$.dispatch(new TablesAction.EditSelectedCell({value: element.value}));
    element.value = '';
  }

  public onClick(event: MouseEvent) {
    event.preventDefault();
  }
}
