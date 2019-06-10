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
  Input,
  OnChanges,
  OnInit,
  Renderer2,
  SimpleChange,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {selectAllCollections} from '../../../../core/store/collections/collections.state';
import {AppState} from '../../../../core/store/app.state';
import {TableHeaderCursor} from '../../../../core/store/tables/table-cursor';
import {TableConfigPart, TableModel} from '../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../core/store/tables/tables.action';

@Component({
  selector: 'table-header',
  templateUrl: './table-header.component.html',
  styleUrls: ['./table-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableHeaderComponent implements OnInit, OnChanges {
  @Input()
  public table: TableModel;

  @Input()
  public canManageConfig: boolean;

  @ViewChild('content')
  public contentElement: ElementRef<HTMLDivElement>;

  public singleCollection$: Observable<boolean>;
  public cursor: TableHeaderCursor;

  public constructor(private renderer: Renderer2, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.bindSingleCollection();
  }

  private bindSingleCollection() {
    this.singleCollection$ = this.store$.pipe(
      select(selectAllCollections),
      map(collections => collections.length === 1)
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

  public scroll(left: number) {
    this.renderer.setStyle(this.contentElement.nativeElement, 'left', `${left}px`);
  }
}

function hasTableIdChanged(change: SimpleChange): boolean {
  return !change.previousValue || change.previousValue.id !== change.currentValue.id;
}
