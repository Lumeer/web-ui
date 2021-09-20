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
import {select, Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {getTableRowCursor, TableBodyCursor} from '../../../../../core/store/tables/table-cursor';
import {TablesAction, TablesActionType} from '../../../../../core/store/tables/tables.action';
import {selectTableCursor} from '../../../../../core/store/tables/tables.selector';
import {Direction} from '../../../../../shared/direction';
import {keyboardEventCode, KeyCode} from '../../../../../shared/key-code';
import {EDITABLE_EVENT} from '../../table-perspective.component';
import {AppState} from '../../../../../core/store/app.state';
import {selectConstraintData} from '../../../../../core/store/constraint-data/constraint-data.state';
import {escapeHtml} from '../../../../../shared/utils/common.utils';
import {createEmptyTableRow} from '../../../../../core/store/tables/table.utils';
import {ConstraintData} from '@lumeer/data-filters';
import {TableDataPermissionsService} from '../../service/table-data-permissions.service';
import {View} from '../../../../../core/store/views/view';

@Component({
  selector: 'table-hidden-input',
  templateUrl: './table-hidden-input.component.html',
  styleUrls: ['./table-hidden-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TableDataPermissionsService],
})
export class TableHiddenInputComponent implements OnInit, OnDestroy {
  @Input()
  public canManageConfig: boolean;

  @Input()
  public tableId: string;

  @Input()
  public view: View;

  @ViewChild('hiddenInput', {static: true})
  public hiddenInput: ElementRef<HTMLInputElement>;

  private subscriptions = new Subscription();

  private skipCompose = false;

  private constraintData: ConstraintData;

  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private dataPermissionsService: TableDataPermissionsService
  ) {}

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToTableCursorActions());
    this.subscriptions.add(
      this.store$.pipe(select(selectConstraintData)).subscribe(data => (this.constraintData = data))
    );
  }

  private subscribeToTableCursorActions(): Subscription {
    return this.actions$
      .pipe(
        ofType<TablesAction.SetCursor>(TablesActionType.SET_CURSOR),
        filter(action => !action.payload.cursor || action.payload.cursor.tableId === this.tableId)
      )
      .subscribe(action => {
        const element = this.hiddenInput.nativeElement;

        if (action.payload.cursor) {
          element.focus();
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

    switch (keyboardEventCode(event)) {
      case KeyCode.KeyQ:
        if (event.altKey) {
          this.store$.pipe(select(selectTableCursor), take(1)).subscribe(cursor => {
            if (cursor?.partIndex > 0) event.preventDefault();
            event.stopPropagation();
            this.store$.dispatch(
              new TablesAction.AddLinkedRows({
                cursor: getTableRowCursor(cursor, 0),
                linkedRows: [createEmptyTableRow()],
              })
            );
          });
        }
        return;
      case KeyCode.KeyA:
        if (event.altKey) {
          this.store$.pipe(select(selectTableCursor), take(1)).subscribe(cursor => {
            if (cursor?.partIndex > 0) event.preventDefault();
            event.stopPropagation();
            this.store$.dispatch(
              new TablesAction.AddLinkedRows({
                cursor: getTableRowCursor(cursor, 1),
                linkedRows: [createEmptyTableRow()],
              })
            );
          });
        }
        return;
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
        if (event.altKey && event.shiftKey) {
          break;
        }
        event.preventDefault();
        return;
      case KeyCode.Tab:
        return;
      case KeyCode.KeyC:
        if (event.ctrlKey || event.metaKey) {
          this.copyCell();
          return;
        }
        break;
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
          this.dataPermissionsService.selectDataPermissions$(this.view, cursor).pipe(
            take(1),
            filter(() => !!cursor.rowPath),
            map(permissions => [cursor, permissions?.edit])
          )
        )
      )
      .subscribe(([cursor, editable]: [TableBodyCursor, boolean]) => {
        event[EDITABLE_EVENT] = editable;

        if (event.altKey && event.shiftKey && editable && this.canManageConfig) {
          event.stopPropagation();
          switch (keyboardEventCode(event)) {
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
    this.store$.dispatch(new TablesAction.EditSelectedCell({value: escapeHtml(element.value)}));
    element.value = '';
  }

  public onClick(event: MouseEvent) {
    event.preventDefault();
  }

  private copyCell() {
    this.store$
      .pipe(select(selectTableCursor), take(1))
      .subscribe(cursor => this.store$.dispatch(new TablesAction.CopyValue({cursor})));
  }
}
