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
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {AppState} from '../../../../core/store/app.state';
import {TableHeaderCursor} from '../../../../core/store/tables/table-cursor';
import {TableConfigPart, TableModel} from '../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../core/store/tables/tables.action';
import {StoreDataService} from '../../../../core/service/store-data.service';

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
  public canManageConfig: boolean;

  @Input()
  public embedded: boolean;

  public hasCollectionToLink$: Observable<boolean>;
  public cursor: TableHeaderCursor;

  public constructor(private element: ElementRef<HTMLElement>, private store$: Store<AppState>, private storeDataService: StoreDataService) {}

  public ngOnInit() {
    this.bindCollectionHasToLink();
  }

  private bindCollectionHasToLink() {
    this.hasCollectionToLink$ = this.storeDataService.selectCollectionsByReadPermission$().pipe(
      map(collections => collections?.length > 1)
    );
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.table && this.table && hasTableIdChanged(changes.table)) {
      this.cursor = this.createHeaderRootCursor();
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
      this.store$.dispatch(new TablesAction.SetCursor({cursor: null}));
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
