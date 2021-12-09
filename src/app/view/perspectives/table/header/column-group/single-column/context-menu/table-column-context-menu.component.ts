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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {MatMenuTrigger} from '@angular/material/menu';

import {ConstraintType} from '@lumeer/data-filters';
import {Store} from '@ngrx/store';

import {Attribute} from '../../../../../../../core/store/collections/collection';
import {TableHeaderCursor} from '../../../../../../../core/store/tables/table-cursor';
import {AllowedPermissions} from '../../../../../../../core/model/allowed-permissions';
import {isMacOS} from '../../../../../../../shared/utils/system.utils';
import {TablesAction} from '../../../../../../../core/store/tables/tables.action';
import {AppState} from '../../../../../../../core/store/app.state';
import {Query} from '../../../../../../../core/store/navigation/query/query';
import {View} from '../../../../../../../core/store/views/view';

@Component({
  selector: 'table-column-context-menu',
  templateUrl: './table-column-context-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableColumnContextMenuComponent {
  @Input()
  public cursor: TableHeaderCursor;

  @Input()
  public view: View;

  @Input()
  public query: Query;

  @Input()
  public attribute: Attribute;

  @Input()
  public defaultAttribute: boolean;

  @Input()
  public leaf: boolean;

  @Input()
  public canManageConfig: boolean;

  @Input()
  public allowedPermissions: AllowedPermissions;

  @Output()
  public add = new EventEmitter<boolean>();

  @Output()
  public configure = new EventEmitter();

  @Output()
  public lockSettings = new EventEmitter();

  @Output()
  public edit = new EventEmitter();

  @Output()
  public remove = new EventEmitter();

  @Output()
  public hide = new EventEmitter();

  @Output()
  public setDefaultAttribute = new EventEmitter();

  @Output()
  public split = new EventEmitter();

  @Output()
  public functionEdit = new EventEmitter();

  @Output()
  public descriptionEdit = new EventEmitter();

  @ViewChild(MatMenuTrigger)
  public contextMenu: MatMenuTrigger;

  public readonly macOS = isMacOS();
  public readonly type = ConstraintType;

  public contextMenuPosition = {x: 0, y: 0};

  public constructor(private store$: Store<AppState>) {}

  public addNextColumn() {
    this.add.emit(true);
  }

  public addPreviousColumn() {
    this.add.emit(false);
  }

  public onCopyName() {
    this.store$.dispatch(new TablesAction.CopyValue({cursor: this.cursor}));
  }

  public onCopyValues(unique?: boolean) {
    this.store$.dispatch(
      new TablesAction.CopyRowValues({cursor: this.cursor, view: this.view, query: this.query, unique})
    );
  }

  public open(x: number, y: number) {
    this.contextMenuPosition = {x, y};
    this.contextMenu.menu.focusFirstItem('mouse');
    this.contextMenu.openMenu();
  }

  public onClick(event: MouseEvent) {
    this.contextMenu?.closeMenu();
    event.stopPropagation();
  }
}
