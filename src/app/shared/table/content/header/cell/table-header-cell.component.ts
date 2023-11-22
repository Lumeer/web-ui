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
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

import {ConditionType, ConditionValue} from '@lumeer/data-filters';

import {AttributeSortType} from '../../../../../core/store/view-settings/view-settings';
import {MenuItem} from '../../../../menu/model/menu-item';
import {StaticMenuComponent} from '../../../../menu/static-menu/static-menu.component';
import {computeElementPositionInParent, preventEvent} from '../../../../utils/common.utils';
import {initForceTouch} from '../../../../utils/html-modifier';
import {TableColumn} from '../../../model/table-column';
import {CellFilterBuilderComponent} from './filter-builder/cell-filter-builder.component';
import {TableHeaderHiddenMenuComponent} from './hidden-menu/table-header-hidden-menu.component';

@Component({
  selector: 'table-header-cell',
  templateUrl: './table-header-cell.component.html',
  styleUrls: ['./table-header-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-block'},
})
export class TableHeaderCellComponent implements OnInit {
  @Input()
  public column: TableColumn;

  @Input()
  public hiddenColumns: TableColumn[];

  @Input()
  public restrictedNames: string[];

  @Input()
  public editing: boolean;

  @Input()
  public editingValue: any;

  @Input()
  public focused: boolean;

  @Output()
  public onCancel = new EventEmitter();

  @Output()
  public newName = new EventEmitter<string>();

  @Output()
  public sortChanged = new EventEmitter<AttributeSortType | null>();

  @Output()
  public filterRemove = new EventEmitter<number>();

  @Output()
  public filterChange = new EventEmitter<{
    index: number;
    condition: ConditionType;
    values: ConditionValue[];
    new?: boolean;
  }>();

  @Output()
  public menuSelected = new EventEmitter<MenuItem>();

  @Output()
  public hiddenMenuSelected = new EventEmitter<TableColumn[]>();

  @ViewChild(StaticMenuComponent)
  public menuComponent: StaticMenuComponent;

  @ViewChild(TableHeaderHiddenMenuComponent)
  public hiddenMenuComponent: TableHeaderHiddenMenuComponent;

  @ViewChild(CellFilterBuilderComponent)
  public filterBuilderComponent: CellFilterBuilderComponent;

  public readonly sortType = AttributeSortType;

  constructor(public element: ElementRef) {}

  public ngOnInit() {
    initForceTouch(this.element.nativeElement, event => this.onContextMenu(event));
  }

  public onHeaderCancel() {
    this.onCancel.emit();
  }

  public onHeaderSave(name: string) {
    if (!this.column.attribute || this.column.attribute.name !== name) {
      this.newName.emit(name);
    }
  }

  public onContextMenu(event: MouseEvent) {
    if (!this.column?.hidden && this.column.menuItems?.length) {
      const {x, y} = computeElementPositionInParent(event, 'table-header-cell');
      this.menuComponent?.open(x, y);

      preventEvent(event);
    }
  }

  public onHiddenContextMenu(event: MouseEvent) {
    if (this.hiddenColumns?.length) {
      const {x, y} = computeElementPositionInParent(event, 'table-header-cell');
      this.hiddenMenuComponent?.open(x, y);

      preventEvent(event);
    }
  }

  public onHiddenMenuSelected(columns: TableColumn[]) {
    this.hiddenMenuSelected.emit(columns);
  }

  public onSortToggle(event: MouseEvent) {
    preventEvent(event);

    if (!this.column.sort) {
      this.sortChanged.emit(AttributeSortType.Ascending);
    } else if (this.column.sort === AttributeSortType.Ascending) {
      this.sortChanged.emit(AttributeSortType.Descending);
    } else {
      this.sortChanged.emit(null);
    }
  }

  public onFilterClick(event: MouseEvent) {
    preventEvent(event);

    this.filterBuilderComponent?.toggle();
  }
}
