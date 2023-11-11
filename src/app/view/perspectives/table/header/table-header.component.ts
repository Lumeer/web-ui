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
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable} from 'rxjs';
import {filter, map, switchMap} from 'rxjs/operators';
import {AppState} from '../../../../core/store/app.state';
import {TableHeaderCursor} from '../../../../core/store/tables/table-cursor';
import {TableConfigPart, TableModel} from '../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../core/store/tables/tables.action';
import {
  selectCollectionPermissionsByView,
  selectReadableCollectionsByView,
} from '../../../../core/store/common/permissions.selectors';
import {selectProjectPermissions} from '../../../../core/store/user-permissions/user-permissions.state';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {selectTableLastCollectionId} from '../../../../core/store/tables/tables.selector';
import {Query} from '../../../../core/store/navigation/query/query';
import {View} from '../../../../core/store/views/view';

@Component({
  selector: 'table-header',
  templateUrl: './table-header.component.html',
  styleUrls: ['./table-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'invisible-scroll-y'},
})
export class TableHeaderComponent implements OnInit, OnChanges {
  @Input()
  public table: TableModel;

  @Input()
  public query: Query;

  @Input()
  public view: View;

  @Input()
  public canManageConfig: boolean;

  @Input()
  public embedded: boolean;

  public hasCollectionToLink$: Observable<boolean>;
  public canCreateLinks$: Observable<boolean>;
  public permissions$: Observable<AllowedPermissions>;
  public cursor$ = new BehaviorSubject<TableHeaderCursor>(null);
  public view$ = new BehaviorSubject<View>(null);

  public cursor: TableHeaderCursor;

  public constructor(
    private element: ElementRef<HTMLElement>,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.bindCollectionHasToLink();
  }

  private bindCollectionHasToLink() {
    this.hasCollectionToLink$ = this.view$.pipe(
      switchMap(view => this.store$.pipe(select(selectReadableCollectionsByView(view)))),
      map(collections => collections.length > 1)
    );
    this.canCreateLinks$ = this.store$.pipe(
      select(selectProjectPermissions),
      map(permissions => permissions?.roles?.LinkContribute)
    );
    this.permissions$ = this.cursor$.pipe(
      filter(cursor => !!cursor),
      switchMap(cursor => this.store$.pipe(select(selectTableLastCollectionId(cursor.tableId)))),
      switchMap(collectionId =>
        this.view$.pipe(
          switchMap(view => this.store$.pipe(select(selectCollectionPermissionsByView(view, collectionId))))
        )
      )
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.table && this.table && hasTableIdChanged(changes.table)) {
      this.cursor = this.createHeaderRootCursor();
      this.cursor$.next(this.cursor);
    }
    if (changes.view) {
      this.view$.next(this.view);
    }
  }

  private createHeaderRootCursor(): TableHeaderCursor {
    return {
      tableId: this.table.id,
      partIndex: null,
      columnPath: [],
    };
  }

  public trackByPartIndexAndEntityId(index: number, part: TableConfigPart): string {
    return index + ':' + (part.collectionId || part.linkTypeId);
  }

  public unsetCursor() {
    this.store$.dispatch(new TablesAction.SetCursor({cursor: null}));
  }

  @HostListener('click', ['$event'])
  public onClick(event: MouseEvent) {
    if (event.target === this.element.nativeElement) {
      this.unsetCursor();
    }
  }

  public onAddColumn() {
    const parts = this.table?.config?.parts;
    if (parts && parts.length > 0) {
      const lastPart = parts[parts.length - 1];
      const column = lastPart.columns?.length;

      this.store$.dispatch(
        new TablesAction.AddColumn({
          cursor: {
            tableId: this.table.id,
            partIndex: this.table.config.parts.length - 1,
            columnPath: [column],
          },
        })
      );
    }
  }
}

function hasTableIdChanged(change: SimpleChange): boolean {
  return !change.previousValue || change.previousValue.id !== change.currentValue.id;
}
