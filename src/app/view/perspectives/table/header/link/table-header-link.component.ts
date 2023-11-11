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
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {selectLinkTypeByIdWithCollections} from '../../../../../core/store/link-types/link-types.state';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {TableHeaderCursor} from '../../../../../core/store/tables/table-cursor';
import {TableConfigPart, TableModel} from '../../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../../core/store/tables/tables.action';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {AppState} from '../../../../../core/store/app.state';
import {Query} from '../../../../../core/store/navigation/query/query';
import {View} from '../../../../../core/store/views/view';
import {selectLinkTypePermissionsByView} from '../../../../../core/store/common/permissions.selectors';
import {getTableElementFromInnerElement} from '../../../../../core/store/tables/table.utils';

@Component({
  selector: 'table-header-link',
  templateUrl: './table-header-link.component.html',
  styleUrls: ['./table-header-link.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableHeaderLinkComponent implements OnChanges, AfterViewInit {
  @Input()
  public cursor: TableHeaderCursor;

  @Input()
  public query: Query;

  @Input()
  public view: View;

  @Input()
  public table: TableModel;

  @Input()
  public part: TableConfigPart;

  @Input()
  public canManageConfig: boolean;

  @Input()
  public embedded: boolean;

  public linkType$: Observable<LinkType>;
  public permissions$: Observable<AllowedPermissions>;

  public linkInfoWidth = 0;

  public constructor(
    private element: ElementRef,
    private store$: Store<AppState>
  ) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.part && this.part) {
      this.linkType$ = this.store$.select(selectLinkTypeByIdWithCollections(this.part.linkTypeId));
    }
    if ((changes.part || changes.view) && this.part) {
      this.permissions$ = this.store$.pipe(select(selectLinkTypePermissionsByView(this.view, this.part.linkTypeId)));
    }
  }

  public ngAfterViewInit() {
    const tableElement = getTableElementFromInnerElement(this.element.nativeElement, this.cursor.tableId);
    if (tableElement) {
      const linkInfoColumnWidth = tableElement.style.getPropertyValue('--link-info-column-width');
      this.linkInfoWidth = parseFloat((linkInfoColumnWidth || '0px').slice(0, -2));
    }
  }

  public onAddLinkColumn() {
    const cursor: TableHeaderCursor = {...this.cursor, columnPath: [0]};
    this.store$.dispatch(new TablesAction.AddColumn({cursor}));
  }

  public onSwitchParts() {
    this.store$.dispatch(new TablesAction.SwitchParts({cursor: this.cursor, query: this.query}));
  }

  public onRemovePart() {
    this.store$.dispatch(new TablesAction.RemovePart({cursor: this.cursor, query: this.query}));
  }
}
