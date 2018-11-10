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

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import {QueryModel} from '../../../../core/store/navigation/query.model';
import {TableBodyCursor} from '../../../../core/store/tables/table-cursor';
import {getTableElement} from '../../../../core/store/tables/table.utils';
import {TablesAction} from '../../../../core/store/tables/tables.action';
import {TableRowsComponent} from './rows/table-rows.component';

@Component({
  selector: 'table-body',
  templateUrl: './table-body.component.html',
  styleUrls: ['./table-body.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableBodyComponent implements OnChanges, AfterViewInit {
  @Input()
  public tableId: string;

  @Input()
  public query: QueryModel;

  @Input()
  public canManageConfig: boolean;

  @ViewChild(TableRowsComponent)
  public rowsComponent: TableRowsComponent;

  public cursor: TableBodyCursor;

  public constructor(private element: ElementRef, private store: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.tableId && this.tableId) {
      this.cursor = {
        tableId: this.tableId,
        partIndex: 0,
        rowPath: [],
      };
    }
  }

  public ngAfterViewInit() {
    this.setScrollbarWidth();
  }

  @HostListener('click', ['$event'])
  public onClick(event: MouseEvent) {
    const rowsClick = this.rowsComponent.element.nativeElement.contains(event.target);
    if (!rowsClick) {
      this.store.dispatch(new TablesAction.SetCursor({cursor: null}));
    }
  }

  public setScrollbarWidth() {
    const element = this.element.nativeElement as HTMLElement;
    const scrollbarWidth = element.offsetWidth - element.clientWidth;

    const tableElement = getTableElement(this.tableId);
    tableElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
  }
}
