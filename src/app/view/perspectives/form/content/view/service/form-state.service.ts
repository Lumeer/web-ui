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
import {Injectable} from '@angular/core';

import {BehaviorSubject, Observable} from 'rxjs';
import {distinctUntilChanged} from 'rxjs/operators';

import {ConstraintType} from '@lumeer/data-filters';
import {isNotNullOrUndefined} from '@lumeer/utils';

import {Collection} from '../../../../../../core/store/collections/collection';
import {findAttribute} from '../../../../../../core/store/collections/collection.util';
import {
  FormAttributeCellConfig,
  FormCell,
  FormCellType,
  FormConfig,
  FormLinkCellConfig,
  FormRow,
} from '../../../../../../core/store/form/form-model';
import {DataInputSaveAction} from '../../../../../../shared/data-input/data-input-save-action';
import {filterValidFormCells} from '../../../form-utils';
import {FormCoordinates, formCoordinatesAreSame} from '../model/form-coordinates';
import {FormLinkData} from '../model/form-link-data';

@Injectable()
export class FormStateService {
  public editedCell$: Observable<FormCoordinates>;

  private editedCellSubject$ = new BehaviorSubject<FormCoordinates>(null);

  private config: FormConfig;
  private collection: Collection;
  private linkData: Record<string, FormLinkData>;

  constructor() {
    this.editedCell$ = this.editedCellSubject$.pipe(distinctUntilChanged((a, b) => formCoordinatesAreSame(a, b)));
  }

  public setConfig(config: FormConfig) {
    this.config = config;
  }

  public setCollection(collection: Collection) {
    this.collection = collection;
  }

  public setLinkData(data: Record<string, FormLinkData>) {
    this.linkData = data;
  }

  public onValueSave(coordinate: FormCoordinates, action: DataInputSaveAction) {
    switch (action) {
      case DataInputSaveAction.Enter:
      case DataInputSaveAction.Tab:
        this.editNextCell(coordinate);
        break;
      default:
        this.clearEditedCell();
    }
  }

  private editNextCell(coordinate: FormCoordinates) {
    const sectionIndex = this.config?.sections?.findIndex(section => section.id === coordinate.sectionId);
    if (sectionIndex === -1) {
      return;
    }
    const section = this.config.sections[sectionIndex];

    const rowIndex = section.rows?.findIndex(row => row.id === coordinate.rowId);
    if (rowIndex === -1) {
      return;
    }
    const row = section.rows[rowIndex];
    const cells = this.filterValidCells(row.cells);
    const cellIndex = cells.findIndex(cell => cell.id === coordinate.cellId);
    if (cellIndex === -1) {
      return;
    }

    // first we try to select cell in the same row
    const possibleNextCell = cells[cellIndex + 1];
    if (possibleNextCell) {
      this.setEditedCell({...coordinate, cellId: possibleNextCell.id});
      return;
    }

    // then we try to find some row with valid cell in current section
    const possibleNextRow = this.findPossibleNextRow(section.rows.slice(rowIndex + 1));
    if (possibleNextRow) {
      const cell = this.filterValidCells(possibleNextRow.cells)[0];
      this.setEditedCell({...coordinate, rowId: possibleNextRow.id, cellId: cell.id});
      return;
    }

    const possibleNextSection = this.config.sections
      .slice(sectionIndex + 1)
      .find(section => !!this.findPossibleNextRow(section.rows));
    if (possibleNextSection) {
      const row = this.findPossibleNextRow(possibleNextSection.rows);
      const cell = this.filterValidCells(row.cells)[0];
      this.setEditedCell({sectionId: possibleNextSection.id, rowId: row.id, cellId: cell.id});
      return;
    }

    // when we do not find any cell to select, we should remove editing from current cell
    if (this.isEditingCell(coordinate)) {
      this.clearEditedCell();
    }
  }

  private findPossibleNextRow(rows: FormRow[]): FormRow {
    return (rows || []).find(pr => this.filterValidCells(pr.cells).length > 0);
  }

  private filterValidCells(cells: FormCell[]): FormCell[] {
    return filterValidFormCells(cells).filter(cell => this.cellHasValidData(cell));
  }

  private cellHasValidData(cell: FormCell): boolean {
    switch (cell.type) {
      case FormCellType.Attribute:
        return this.attributeCellHasValidData(cell);
      case FormCellType.Link:
        return this.linkCellHasValidData(cell);
    }
    return false;
  }

  private attributeCellHasValidData(cell: FormCell): boolean {
    const config = <FormAttributeCellConfig>cell.config || {};
    const attribute = findAttribute(this.collection?.attributes, config?.attributeId);
    if (!attribute) {
      return false;
    }
    return attribute.constraint?.type !== ConstraintType.Boolean;
  }

  private linkCellHasValidData(cell: FormCell): boolean {
    const config = <FormLinkCellConfig>cell.config || {};
    return !!this.linkData?.[config?.linkTypeId]?.linkType;
  }

  private setEditedCell(coordinate: FormCoordinates) {
    this.editedCellSubject$.next(coordinate);
  }

  private clearEditedCell() {
    this.editedCellSubject$.next(null);
  }

  public onEditCancel(coordinate: FormCoordinates) {
    if (formCoordinatesAreSame(this.editedCellSubject$.value, coordinate)) {
      this.clearEditedCell();
    }
  }

  public onEditStart(coordinate: FormCoordinates) {
    this.setEditedCell(coordinate);
  }

  private isEditingCell(coordinate: FormCoordinates): boolean {
    if (isNotNullOrUndefined(this.editedCellSubject$.value)) {
      return formCoordinatesAreSame(coordinate, this.editedCellSubject$.value);
    }
    return false;
  }
}
