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
import {Store, select} from '@ngrx/store';

import {DeviceDetectorService} from 'ngx-device-detector';
import {Subscription} from 'rxjs';
import {filter, take} from 'rxjs/operators';

import {ConstraintData} from '@lumeer/data-filters';
import {escapeHtml} from '@lumeer/utils';

import {AppState} from '../../../../../core/store/app.state';
import {selectConstraintData} from '../../../../../core/store/constraint-data/constraint-data.state';
import {TableCursor, getTableRowCursor} from '../../../../../core/store/tables/table-cursor';
import {createEmptyTableRow} from '../../../../../core/store/tables/table.utils';
import {TablesAction, TablesActionType} from '../../../../../core/store/tables/tables.action';
import {selectTableCursor} from '../../../../../core/store/tables/tables.selector';
import {View} from '../../../../../core/store/views/view';
import {Direction} from '../../../../../shared/direction';
import {KeyCode, keyboardEventCode} from '../../../../../shared/key-code';
import {TableDataPermissionsService} from '../../service/table-data-permissions.service';
import {EDITABLE_EVENT} from '../../table-perspective.component';

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

  @Input()
  public cursor: TableCursor;

  @Input()
  public correlationId: string;

  @ViewChild('hiddenInput', {static: true})
  public hiddenInput: ElementRef<HTMLInputElement>;

  private subscriptions = new Subscription();

  private skipCompose = false;
  private readonly isInputEnabled: boolean;

  private constraintData: ConstraintData;

  constructor(
    private element: ElementRef,
    private actions$: Actions,
    private store$: Store<AppState>,
    private dataPermissionsService: TableDataPermissionsService,
    private deviceService: DeviceDetectorService
  ) {
    this.isInputEnabled = !(deviceService.isMobile() || deviceService.isTablet());
  }

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
        if (action.payload.cursor) {
          this.focus();
        } else {
          this.blur();
        }
      });
  }

  private focus() {
    if (this.isInputEnabled) {
      this.hiddenInput?.nativeElement?.focus();
    }
  }

  private blur() {
    if (this.isInputEnabled) {
      this.hiddenInput?.nativeElement?.blur();
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Dead') {
      this.skipCompose = true;
      return;
    }

    if (!this.isEventFromCurrentTable(event)) {
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
        this.store$.dispatch(new TablesAction.EditSelectedCell({correlationId: this.correlationId}));
        return;
      case KeyCode.Backspace:
        event.preventDefault();
        event.stopPropagation();
        this.store$.dispatch(new TablesAction.EditSelectedCell({correlationId: this.correlationId, clear: true}));
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

  private isEventFromCurrentTable(event: KeyboardEvent): boolean {
    return this.element.nativeElement.contains(event.target as HTMLElement);
  }

  private onShortcutKeyDown(event: KeyboardEvent) {
    if (!this.cursor?.rowPath) {
      return;
    }

    this.dataPermissionsService
      .selectDataPermissions$(this.view, this.cursor)
      .pipe(take(1))
      .subscribe(editable => {
        event[EDITABLE_EVENT] = editable;
        const workspace = {viewId: this.view?.id};
        const cursor = this.cursor;

        if (event.altKey && event.shiftKey && editable) {
          event.stopPropagation();
          switch (keyboardEventCode(event)) {
            case KeyCode.ArrowRight:
              this.store$.dispatch(new TablesAction.IndentRow({cursor, workspace}));
              return;
            case KeyCode.ArrowLeft:
              this.store$.dispatch(new TablesAction.OutdentRow({cursor, workspace}));
              return;
            case KeyCode.ArrowUp:
              this.store$.dispatch(new TablesAction.MoveRowUp({cursor, workspace}));
              this.store$.dispatch(new TablesAction.MoveCursor({direction: Direction.Up}));
              return;
            case KeyCode.ArrowDown:
              this.store$.dispatch(new TablesAction.MoveRowDown({cursor, workspace}));
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
    if (!this.isEventFromCurrentTable(event)) {
      return;
    }

    this.skipCompose = false;
    this.store$.dispatch(
      new TablesAction.EditSelectedCell({correlationId: this.correlationId, value: escapeHtml(element.value)})
    );
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
