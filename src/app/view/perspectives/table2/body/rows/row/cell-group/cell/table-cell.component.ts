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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {first} from 'rxjs/operators';
import {AppState} from '../../../../../../../../core/store/app.state';
import {DocumentModel} from '../../../../../../../../core/store/documents/document.model';
import {LinkInstanceModel} from '../../../../../../../../core/store/link-instances/link-instance.model';
import {TableBodyCursor} from '../../../../../../../../core/store/tables/table-cursor';
import {TableModel, TableSingleColumn} from '../../../../../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../../../../../core/store/tables/tables.action';
import {selectTableCursorSelected} from '../../../../../../../../core/store/tables/tables.state';
import {Direction} from '../../../../../../../../shared/direction';
import {KeyCode} from '../../../../../../../../shared/key-code';

@Component({
  selector: 'table-cell',
  templateUrl: './table-cell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableCellComponent implements OnChanges {

  @Input()
  public column: TableSingleColumn;

  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public documents: DocumentModel[];

  @Input()
  public linkInstances: LinkInstanceModel[];

  @Input()
  public table: TableModel;

  public collapsed: boolean;
  public selected$: Observable<boolean>;

  public constructor(private store: Store<AppState>) {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.documents || changes.linkInstances) {
      this.collapsed = this.isCollapsed();
    }
    if (changes.cursor && this.cursor) {
      this.bindSelectedCursor();
    }
  }

  private bindSelectedCursor() {
    this.selected$ = this.store.select(selectTableCursorSelected(this.cursor));
  }

  private isCollapsed(): boolean {
    return (this.documents && this.documents.length > 1) || (this.linkInstances && this.linkInstances.length > 1);
  }

  public onMouseDown(event: MouseEvent) {
    this.selected$.pipe(
      first()
    ).subscribe(() => this.store.dispatch(new TablesAction.SetCursor({cursor: this.cursor})));
    event.stopPropagation();
  }

}
