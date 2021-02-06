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
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {LinkColumn} from '../../../model/link-column';
import {LinkRow} from '../../../model/link-row';
import {DataRowComponent} from '../../../../../data/data-row-component';
import {BehaviorSubject, Subscription} from 'rxjs';
import {isNotNullOrUndefined} from '../../../../../utils/common.utils';
import {distinctUntilChanged, filter} from 'rxjs/operators';
import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';
import {DocumentHintsComponent} from '../../../../../document-hints/document-hints.component';
import {isKeyPrintable, KeyCode} from '../../../../../key-code';
import {Direction} from '../../../../../direction';
import {DataInputConfiguration} from '../../../../../data-input/data-input-configuration';
import {ConstraintData, DataValue, UnknownConstraint} from '@lumeer/data-filters';

@Component({
  selector: '[links-list-table-row]',
  templateUrl: './links-list-table-row.component.html',
  styleUrls: ['./links-list-table-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksListTableRowComponent implements DataRowComponent, OnInit, OnDestroy {
  @Input()
  public columns: LinkColumn[];

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public row: LinkRow;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public linkTypeId: string;

  @Input()
  public collectionId: string;

  @Input()
  public documentId: string;

  @Input()
  public allowSelectDocument: boolean;

  @Input()
  public attributeEditing: {documentId?: string; attributeId?: string};

  @Input()
  public preventEventBubble: boolean;

  @Output()
  public onFocus = new EventEmitter<number>();

  @Output()
  public onEdit = new EventEmitter<number>();

  @Output()
  public resetFocusAndEdit = new EventEmitter<number>();

  @Output()
  public newValue = new EventEmitter<{column: number; value: any}>();

  @Output()
  public columnFocus = new EventEmitter<number>();

  @Output()
  public columnEdit = new EventEmitter<number>();

  @Output()
  public unLink = new EventEmitter();

  @Output()
  public detail = new EventEmitter();

  @Output()
  public newLink = new EventEmitter<{column: LinkColumn; value: any; correlationId: string}>();

  @ViewChild(DocumentHintsComponent)
  public suggestions: DocumentHintsComponent;

  public readonly configuration: DataInputConfiguration = {
    common: {allowRichText: true, delaySaveAction: true},
    boolean: {center: true},
    user: {allowCenterOnlyIcon: true},
    action: {center: true},
  };

  public columnEditing$ = new BehaviorSubject<number>(null);
  public columnFocused$ = new BehaviorSubject<number>(null);
  public suggesting$ = new BehaviorSubject<DataValue>(null);

  public editedValue: DataValue;
  public subscriptions = new Subscription();

  constructor(public element: ElementRef) {}

  public ngOnInit() {
    this.subscriptions.add(
      this.columnFocused$
        .asObservable()
        .pipe(
          distinctUntilChanged(),
          filter(index => isNotNullOrUndefined(index))
        )
        .subscribe(index => this.columnFocus.emit(index))
    );

    this.subscriptions.add(
      this.columnEditing$
        .asObservable()
        .pipe(distinctUntilChanged())
        .subscribe(index => this.columnEdit.emit(index))
    );
  }

  public endColumnEditing(column: number) {
    if (this.columnEditing$.value === column) {
      this.endRowEditing();
    }
  }

  public endRowEditing() {
    this.editedValue = null;
    this.suggesting$.next(null);
    this.columnEditing$.next(null);
  }

  public focusColumn(column: number) {
    this.columnFocused$.next(column);
  }

  public startColumnEditing(column: number, value?: any): boolean {
    this.editedValue = null;
    if (this.isColumnEditable(column)) {
      this.editedValue = this.createDataValue(column, value, true);
      this.suggesting$.next(this.editedValue);
      this.columnEditing$.next(column);
      return true;
    }
    return false;
  }

  private createDataValue(column: number, value?: any, typed?: boolean): DataValue {
    const attribute = this.columns[column].attribute;
    const constraint = attribute?.constraint || new UnknownConstraint();
    if (typed) {
      return constraint.createInputDataValue(value, this.columnValue(column), this.constraintData);
    }
    const initialValue = isNotNullOrUndefined(value) ? value : this.columnValue(column);
    return constraint.createDataValue(initialValue, this.constraintData);
  }

  private isColumnEditable(column: number): boolean {
    return this.permissions?.writeWithView && this.columns[column].editable;
  }

  private columnValue(index: number): any {
    const column = this.columns[index];
    if (column?.collectionId) {
      return (this.row.document?.data || {})[column.attribute.id];
    } else if (column?.linkTypeId) {
      return (this.row.linkInstance?.data || {})[column.attribute.id];
    }
    return null;
  }

  public unFocusRow() {
    this.columnFocused$.next(null);
  }

  public onNewValue(column: number, dataValue: DataValue) {
    if (!this.columns?.[column]?.editable) {
      return;
    }

    this.editedValue = null;
    if (this.suggestions?.isSelected()) {
      this.suggestions.useSelection();
    } else {
      this.saveData(column, dataValue);
    }
    this.onDataInputCancel(column);
  }

  private saveData(column: number, dataValue: DataValue) {
    if (this.creatingNewLink()) {
      this.createNewLink(column, dataValue);
    } else {
      const value = dataValue.serialize();
      const currentValue = this.columnValue(column);
      if (currentValue !== value) {
        this.newValue.emit({column, value});
      }
    }
  }

  private createNewLink(index: number, dataValue: DataValue) {
    const value = dataValue.serialize();
    if (isNotNullOrUndefined(value) && String(value).trim() !== '') {
      const column = this.columns[index];
      this.newLink.emit({column, value, correlationId: this.row.correlationId});
    }
  }

  private creatingNewLink(): boolean {
    return !this.row.document && !this.row.linkInstance;
  }

  public onDataInputDblClick(column: number, event: MouseEvent) {
    if (this.columnEditing$.value !== column) {
      event.preventDefault();
      this.onEdit.emit(column);
    }
  }

  public onDataInputCancel(column: number) {
    this.editedValue = null;
    this.resetFocusAndEdit.emit(column);
  }

  public onDataInputFocus(column: number, event: MouseEvent) {
    if (this.columnEditing$.value !== column) {
      this.onFocus.emit(column);
    }
  }

  public trackByColumn(index: number, column: LinkColumn): string {
    return `${column.collectionId || column.linkTypeId}:${column.attribute.id}`;
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onDetail() {
    this.detail.emit();
  }

  public onUnlink() {
    this.unLink.emit();
  }

  public onValueChange(index: number, dataValue: DataValue) {
    this.suggesting$.next(dataValue);
  }

  public onDataInputKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.ArrowDown:
        event.preventDefault();
        this.suggestions?.moveSelection(Direction.Down);
        return;
      case KeyCode.ArrowUp:
        event.preventDefault();
        this.suggestions?.moveSelection(Direction.Up);
        return;
    }

    if (isKeyPrintable(event) && this.suggestions) {
      return this.suggestions.clearSelection();
    }
  }

  public onUseHint() {
    this.endRowEditing();
  }

  public onEnterInvalid() {
    if (this.suggestions && this.suggestions.isSelected()) {
      this.suggestions.useSelection();
      this.endRowEditing();
    }
  }
}
