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
import {filterValidFormCells} from '../../../form-utils';
import {ConstraintData, DataValue} from '@lumeer/data-filters';
import {FormError} from '../validation/form-validation';
import {FormLinkData, FormLinkSelectedData} from '../model/form-link-data';
import {DataInputSaveAction} from '../../../../../../shared/data-input/data-input-save-action';
import {FormCoordinates} from '../model/form-coordinates';
import {DocumentModel} from '../../../../../../core/store/documents/document.model';

@Component({
  selector: 'form-view-row',
  templateUrl: './form-view-row.component.html',
  styleUrls: ['./form-view-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormViewRowComponent implements OnChanges {
  @Input()
  public sectionId: string;

  @Input()
  public row: FormRow;

  @Input()
  public collection: Collection;

  @Input()
  public dataValues: Record<string, DataValue>;

  @Input()
  public linkValues: Record<string, FormLinkData>;

  @Input()
  public documentId: string;

  @Input()
  public documentEditable: boolean;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public originalDocument: DocumentModel;

  @Input()
  public editedCell: FormCoordinates;

  @Input()
  public formErrors: FormError[];

  @Output()
  public attributeValueChange = new EventEmitter<{
    attributeId: string;
    dataValue: DataValue;
    cellId: string;
    action?: DataInputSaveAction;
  }>();

  @Output()
  public linkValueChange = new EventEmitter<{
    linkTypeId: string;
    selectedData: FormLinkSelectedData;
    cellId: string;
    action?: DataInputSaveAction;
  }>();

  @Output()
  public editStart = new EventEmitter<{cellId: string}>();

  @Output()
  public editCancel = new EventEmitter<{cellId: string}>();

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

  public onAttributeValueChange(
    data: {attributeId: string; dataValue: DataValue; action?: DataInputSaveAction},
    cellId: string
  ) {
    this.attributeValueChange.emit({...data, cellId});
  }

  public onLinkValueChange(
    data: {linkTypeId: string; selectedData: FormLinkSelectedData; action?: DataInputSaveAction},
    cellId: string
  ) {
    this.linkValueChange.emit({...data, cellId});
  }

  public onEditCancel(cellId: string) {
    this.editCancel.emit({cellId});
  }

  public onEditStart(cellId: string) {
    this.editStart.emit({cellId});
  }
}
