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
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  SimpleChanges,
  EventEmitter,
  Output,
  SimpleChange,
  OnDestroy,
  ViewChildren,
  QueryList,
  HostListener,
  ViewChild,
} from '@angular/core';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {DataRow, DataRowService} from '../../../data/data-row.service';
import {Query} from '../../../../core/store/navigation/query/query';
import {DocumentDataRowComponent} from './row/document-data-row.component';
import {filterUnusedAttributes} from '../../../utils/attribute.utils';
import {DocumentDetailHiddenInputComponent} from '../hidden-input/document-detail-hidden-input.component';
import {DataRowFocusService} from '../../../data/data-row-focus-service';

@Component({
  selector: 'document-data',
  templateUrl: './document-data.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DataRowService],
})
export class DocumentDataComponent implements OnChanges, OnDestroy {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public defaultAttribute: Attribute;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public query: Query;

  @Output()
  public attributeTypeClick = new EventEmitter<Attribute>();

  @Output()
  public attributeFunctionCLick = new EventEmitter<Attribute>();

  @ViewChildren(DocumentDataRowComponent)
  public rows: QueryList<DocumentDataRowComponent>;

  @ViewChild(DocumentDetailHiddenInputComponent, {static: false})
  public hiddenInputComponent: DocumentDetailHiddenInputComponent;

  public unusedAttributes: Attribute[] = [];

  private dataRowFocusService: DataRowFocusService;

  constructor(public dataRowService: DataRowService) {
    this.dataRowFocusService = new DataRowFocusService(
      () => this.dataRowService.rows$.value.length,
      () => this.rows.toArray(),
      () => this.hiddenInputComponent
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (this.objectChanged(changes.collection) || this.objectChanged(changes.document)) {
      if (this.collection && this.document) {
        this.dataRowService.init(this.collection, this.document);
      }
    }
    if (changes.collection || changes.document) {
      this.unusedAttributes = filterUnusedAttributes(
        this.collection && this.collection.attributes,
        this.document && this.document.data
      );
    }
  }

  private objectChanged(change: SimpleChange): boolean {
    return change && (!change.previousValue || change.previousValue.id !== change.currentValue.id);
  }

  public onNewKey(value: string, index: number) {
    this.dataRowService.updateRow(index, value);
  }

  public onNewValue(value: any, row: DataRow, index: number) {
    this.dataRowService.updateRow(index, null, value);
  }

  public ngOnDestroy() {
    this.dataRowService.destroy();
  }

  public onRemoveRow(index: number) {
    this.dataRowService.deleteRow(index);
  }

  public onCreateRow() {
    this.dataRowService.addRow();
  }

  public onAttributeFunction(row: DataRow) {
    if (row.attribute) {
      this.attributeFunctionCLick.emit(row.attribute);
    }
  }

  public onAttributeType(row: DataRow) {
    if (row.attribute) {
      this.attributeTypeClick.emit(row.attribute);
    }
  }

  public onFocus(row: number, column: number) {
    this.dataRowFocusService.focus(row, column);
  }

  public onResetFocusAndEdit(row: number, column: number) {
    this.dataRowFocusService.resetFocusAndEdit(row, column);
  }

  public onEdit(row: number, column: number) {
    this.dataRowFocusService.edit(row, column);
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    this.dataRowFocusService.onKeyDown(event);
  }

  public trackByRow(index: number, row: DataRow): string {
    return row.id;
  }

  public onNewHiddenInput(value: string) {
    this.dataRowFocusService.newHiddenInput(value);
  }
}
