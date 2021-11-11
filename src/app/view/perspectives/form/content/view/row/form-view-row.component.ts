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

import {Component, ChangeDetectionStrategy, Input, SimpleChanges, OnChanges, Output, EventEmitter} from '@angular/core';
import {FormCell, FormRow} from '../../../../../../core/store/form/form-model';
import {Collection} from '../../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {filterValidFormCells} from '../../../form-utils';
import {ConstraintData, DataValue} from '@lumeer/data-filters';
import {DocumentModel} from '../../../../../../core/store/documents/document.model';

@Component({
  selector: 'form-view-row',
  templateUrl: './form-view-row.component.html',
  styleUrls: ['./form-view-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormViewRowComponent implements OnChanges {
  @Input()
  public row: FormRow;

  @Input()
  public collection: Collection;

  @Input()
  public collectionLinkTypes: LinkType[];

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public document: DocumentModel;

  @Output()
  public attributeValueChange = new EventEmitter<{attributeId: string; dataValue: DataValue}>();

  public templateColumns: string;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.row || changes.editable) {
      this.computeTemplateColumns();
    }
  }

  private computeTemplateColumns() {
    this.templateColumns = filterValidFormCells(this.row?.cells)
      .map(cell => `minmax(0, ${cell.span}fr)`)
      .join(' ');
  }

  public trackByCell(index: number, cell: FormCell): string {
    return cell.id;
  }
}