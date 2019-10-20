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
  OnInit,
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
import {BehaviorSubject} from 'rxjs';
import {Workspace} from '../../../../core/store/navigation/workspace';

@Component({
  selector: 'document-data',
  templateUrl: './document-data.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DataRowService],
})
export class DocumentDataComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public query: Query;

  @Input()
  public workspace: Workspace;

  @Output()
  public attributeTypeClick = new EventEmitter<Attribute>();

  @Output()
  public attributeFunctionCLick = new EventEmitter<Attribute>();

  @ViewChildren(DocumentDataRowComponent)
  public rows: QueryList<DocumentDataRowComponent>;

  @ViewChild(DocumentDetailHiddenInputComponent, {static: false})
  public hiddenInputComponent: DocumentDetailHiddenInputComponent;

  @Output()
  public switchToTable = new EventEmitter();

  @Output()
  public removeDocument = new EventEmitter();

  public unusedAttributes$ = new BehaviorSubject<Attribute[]>([]);

  private dataRowFocusService: DataRowFocusService;

  constructor(public dataRowService: DataRowService) {
    this.dataRowFocusService = new DataRowFocusService(
      () => this.dataRowService.rows$.value.length,
      () => this.rows.toArray(),
      () => this.hiddenInputComponent
    );
  }

  public ngOnInit() {
    this.dataRowService.rows$.asObservable().subscribe(() => {
      const currentDocument = this.getCurrentDocument();
      const unusedAttributes = filterUnusedAttributes(
        this.collection && this.collection.attributes,
        currentDocument && currentDocument.data
      );
      this.unusedAttributes$.next(unusedAttributes);
    });
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (this.objectChanged(changes.collection) || this.objectChanged(changes.document)) {
      if (this.collection && this.document) {
        this.dataRowService.init(this.collection, this.document);
      }
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

  public getCurrentDocument(): DocumentModel {
    if (!this.document) {
      return null;
    }

    const rows = this.dataRowService.rows$.value;

    const data = rows
      .filter(row => row.attribute && row.attribute.id)
      .reduce((d, row) => {
        if (row.attribute.constraint) {
          d[row.attribute.id] = row.attribute.constraint.createDataValue(row.value, this.constraintData).serialize();
        } else {
          d[row.attribute.id] = row.value;
        }
        return d;
      }, {});

    const currentAttributeNames = (this.collection && this.collection.attributes).map(attr => attr.name);
    const newData = rows
      .filter(row => row.key && (!row.attribute || !row.attribute.id) && !currentAttributeNames.includes(row.key))
      .reduce(
        (d, row) => ({
          ...d,
          [row.key]: row.value,
        }),
        {}
      );

    return {...this.document, data, newData};
  }
}
