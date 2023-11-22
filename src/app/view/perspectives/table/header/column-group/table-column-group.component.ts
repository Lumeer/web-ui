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
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import {Store} from '@ngrx/store';

import {ResizeEvent} from 'angular-resizable-element';

import {DRAG_DELAY} from '../../../../../core/constants';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {AppState} from '../../../../../core/store/app.state';
import {Collection} from '../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {Query} from '../../../../../core/store/navigation/query/query';
import {TableHeaderCursor} from '../../../../../core/store/tables/table-cursor';
import {TableColumnType, TableConfigColumn, TableModel} from '../../../../../core/store/tables/table.model';
import {getTableElementFromInnerElement, getTablePart} from '../../../../../core/store/tables/table.utils';
import {TablesAction} from '../../../../../core/store/tables/tables.action';
import {View} from '../../../../../core/store/views/view';

interface ElementHeight {
  element: HTMLElement;
  height: number;
}

@Component({
  selector: 'table-column-group',
  templateUrl: './table-column-group.component.html',
  styleUrls: ['./table-column-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableColumnGroupComponent implements OnChanges, AfterViewChecked {
  @Input()
  public table: TableModel;

  @Input()
  public cursor: TableHeaderCursor;

  @Input()
  public view: View;

  @Input()
  public query: Query;

  @Input()
  public columns: TableConfigColumn[];

  @Input()
  public collection: Collection;

  @Input()
  public linkType: LinkType;

  @Input()
  public allowedPermissions: AllowedPermissions;

  @Input()
  public canManageConfig: boolean;

  @Input()
  public embedded: boolean;

  private elementCache: Record<string, ElementHeight> = {};

  public readonly dragDelay = DRAG_DELAY;
  public resizedColumnIndex: number;

  public constructor(
    private element: ElementRef,
    private store$: Store<AppState>
  ) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collection || changes.linkType) {
      this.store$.dispatch(new TablesAction.SyncColumns({cursor: this.cursor, view: this.view}));
    }
  }

  public ngAfterViewChecked() {
    this.calculateColumnGroupHeight();
  }

  private calculateColumnGroupHeight() {
    const element = this.element.nativeElement as HTMLElement;
    const height = element.offsetHeight;

    if (height) {
      this.checkElementHeight(this.cursor.tableId, height);
    }
  }

  private checkElementHeight(id: string, height: number): ElementHeight {
    const elementHeight = this.elementCache[id];

    if (!elementHeight) {
      const newElementHeight = {element: getTableElementFromInnerElement(this.element.nativeElement, id), height};

      if (newElementHeight.element) {
        this.elementCache[id] = newElementHeight;
        newElementHeight.element.style.setProperty('--column-group-height', `${height}px`);

        return newElementHeight;
      } else {
        return null;
      }
    } else {
      if (elementHeight.height !== height) {
        elementHeight.element.style.setProperty('--column-group-height', `${height}px`);
      }
    }

    return elementHeight;
  }

  public trackByCollectionAndAttribute(index: number, column: TableConfigColumn): string {
    if (column && column.type === TableColumnType.COMPOUND) {
      const part = getTablePart(this.table, this.cursor);
      const attributeSuffix = column.attributeName ? `${column.attributeName}:${index}` : column.attributeIds[0];
      return `${part.collectionId}:${attributeSuffix}`;
    }
  }

  public onResizeStart(columnIndex: number, event: ResizeEvent) {
    this.resizedColumnIndex = columnIndex;
  }

  public onResizeEnd(cursor: TableHeaderCursor, event: ResizeEvent) {
    this.resizedColumnIndex = null;

    const delta = Number(event.edges.right);
    this.store$.dispatch(new TablesAction.ResizeColumn({cursor, delta}));
  }

  public onDrop(event: any) {
    const {currentIndex, previousIndex} = event;
    if (currentIndex === previousIndex) {
      return;
    }
    const cursor = {...this.cursor, columnPath: this.cursor.columnPath.concat(previousIndex)};
    this.store$.dispatch(new TablesAction.MoveColumn({cursor, toIndex: currentIndex}));
  }
}
