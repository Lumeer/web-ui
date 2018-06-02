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

import {ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {AppState} from '../../../../../../../../../core/store/app.state';
import {DocumentModel} from '../../../../../../../../../core/store/documents/document.model';
import {LinkInstanceModel} from '../../../../../../../../../core/store/link-instances/link-instance.model';
import {TableBodyCursor} from '../../../../../../../../../core/store/tables/table-cursor';
import {TableSingleColumn} from '../../../../../../../../../core/store/tables/table.model';
import {selectEditedAttribute} from '../../../../../../../../../core/store/tables/tables.state';

@Component({
  selector: 'table-collapsed-cell',
  templateUrl: './table-collapsed-cell.component.html',
  styleUrls: ['./table-collapsed-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableCollapsedCellComponent implements OnChanges {

  @Input()
  public column: TableSingleColumn;

  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public documents: DocumentModel[];

  @Input()
  public linkInstances: LinkInstanceModel[];

  @Input()
  public selected: boolean;

  @ViewChild('collapsedCell')
  public collapsedCell: ElementRef;

  public affected$: Observable<boolean>;

  public values = '';

  public constructor(private store: Store<AppState>) {
  }

  public ngOnInit() {
    if (this.cursor && this.cursor.partIndex > 0) {
      this.affected$ = this.store.select(selectEditedAttribute).pipe(
        map(editedAttribute => editedAttribute &&
          this.documents.some(document => editedAttribute.documentId === document.id) &&
          editedAttribute.attributeId === this.column.attributeId
        )
      );
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.selected && this.selected) {
      this.collapsedCell.nativeElement.focus();
    }
    if (changes.column || changes.documents || changes.linkInstances) {
      this.values = this.getDataValues();
    }
  }

  public getDataValues(): string {
    return this.getData().map(data => data[this.column.attributeId])
      .filter(data => data)
      .join(', ');
  }

  private getData(): any[] {
    if (this.documents) {
      return this.documents.map(document => document.data);
    }
    if (this.linkInstances) {
      return this.linkInstances.map(linkInstance => linkInstance.data);
    }
    return [];
  }

}
