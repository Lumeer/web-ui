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

import {Component, ChangeDetectionStrategy, Input, SimpleChanges, OnChanges, EventEmitter, Output} from '@angular/core';
import {FormCell, FormRow, FormRowLayoutType} from '../../../../../../core/store/form/form-model';
import {filterValidFormCells} from '../../../form-utils';
import {generateCorrelationId} from '../../../../../../shared/utils/resource.utils';
import {Collection} from '../../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../../core/store/link-types/link.type';

@Component({
  selector: 'form-editor-row',
  templateUrl: './form-editor-row.component.html',
  styleUrls: ['./form-editor-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEditorRowComponent implements OnChanges {
  @Input()
  public row: FormRow;

  @Input()
  public collection: Collection;

  @Input()
  public collectionLinkTypes: LinkType[];

  @Input()
  public usedAttributeIds: string[];

  @Input()
  public usedLinkTypeIds: string[];

  @Output()
  public delete = new EventEmitter();

  @Output()
  public rowChange = new EventEmitter<FormRow>();

  public templateColumns: string;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.row || changes.editable) {
      this.computeTemplateColumns();
    }
  }

  private computeTemplateColumns() {
    const fractions = filterValidFormCells(this.row?.cells)
      .map(cell => `minmax(0, ${cell.span}fr)`)
      .join(' ');
    this.templateColumns = `min-content ${fractions} min-content min-content`;
  }

  public trackByCell(index: number, cell: FormCell): string {
    return cell.id;
  }

  public onLayoutSelected(layout: FormRowLayoutType) {
    const cells = [...(this.row.cells || [])];
    for (let i = 0; i < layout.length; i++) {
      if (cells[i]) {
        cells[i] = {...cells[i], span: layout[i]};
      } else {
        cells.push({id: `${generateCorrelationId()}${i}`, span: layout[i]});
      }
    }

    if (cells.length > layout.length) {
      for (let i = layout.length; i < cells.length; i++) {
        cells[i] = {...cells[i], span: null};
      }
    }

    const newRow = {...this.row, cells};
    this.rowChange.next(newRow);
  }

  public onCellChange(cell: FormCell, index: number) {
    const cells = [...(this.row.cells || [])];
    cells[index] = cell;
    const newRow = {...this.row, cells};
    this.rowChange.next(newRow);
  }
}
