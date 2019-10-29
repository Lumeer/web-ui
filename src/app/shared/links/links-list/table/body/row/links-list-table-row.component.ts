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
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  OnChanges,
  SimpleChanges,
  SimpleChange,
} from '@angular/core';
import {LinkColumn} from '../../../model/link-column';
import {ConstraintData, ConstraintType} from '../../../../../../core/model/data/constraint';
import {LinkRow} from '../../../model/link-row';
import {DataRowComponent} from '../../../../../data/data-row-component';
import {BehaviorSubject, Subscription} from 'rxjs';
import {isNotNullOrUndefined, isNumeric, toNumber} from '../../../../../utils/common.utils';
import {distinctUntilChanged, filter} from 'rxjs/operators';
import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';
import {DocumentHintsComponent} from '../../../../../document-hints/document-hints.component';
import {isKeyPrintable, KeyCode} from '../../../../../key-code';
import {Direction} from '../../../../../direction';

@Component({
  selector: '[links-list-table-row]',
  templateUrl: './links-list-table-row.component.html',
  styleUrls: ['./links-list-table-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksListTableRowComponent implements DataRowComponent, OnInit, OnDestroy, OnChanges {
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
  public unLink = new EventEmitter();

  @Output()
  public detail = new EventEmitter();

  @Output()
  public newLink = new EventEmitter<{data: Record<string, any>; correlationId: string}>();

  @ViewChild(DocumentHintsComponent, {static: false})
  public suggestions: DocumentHintsComponent;

  public readonly booleanConstraintType = ConstraintType.Boolean;

  public columnEditing$ = new BehaviorSubject<number>(null);
  public columnFocused$ = new BehaviorSubject<number>(null);
  public suggesting$ = new BehaviorSubject<any>(null);

  public initialValue: any;
  public focusSubscription = new Subscription();

  private savingDisabled = false;
  private creatingNewRow = false;

  constructor(public element: ElementRef) {}

  public ngOnInit() {
    this.focusSubscription.add(
      this.columnFocused$
        .asObservable()
        .pipe(
          distinctUntilChanged(),
          filter(index => isNotNullOrUndefined(index))
        )
        .subscribe(index => this.columnFocus.emit(index))
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.checkNewRowChanged(changes.row);
  }

  private checkNewRowChanged(change: SimpleChange) {
    if (
      change &&
      change.previousValue &&
      change.currentValue &&
      change.previousValue.correlationId !== change.currentValue.correlationId
    ) {
      this.creatingNewRow = false;
    }
  }

  public endColumnEditing(column: number) {
    if (this.columnEditing$.value === column) {
      this.endRowEditing();
    }
  }

  public endRowEditing() {
    this.initialValue = null;
    this.suggesting$.next(null);
    this.columnEditing$.next(null);
  }

  public focusColumn(column: number) {
    this.columnFocused$.next(column);
  }

  public startColumnEditing(column: number, value?: any): boolean {
    if (this.isColumnEditable(column)) {
      if (this.shouldDirectEditValue(column)) {
        this.onNewValue(column, this.computeDirectEditValue(column));
      } else {
        this.initialValue = this.modifyInitialValue(column, value);
        this.suggesting$.next(this.initialValue);
        this.columnEditing$.next(column);
        return true;
      }
    }
    return false;
  }

  private shouldDirectEditValue(column: number): boolean {
    return this.columnConstraintType(column) === ConstraintType.Boolean;
  }

  private columnConstraintType(column: number): ConstraintType {
    const attribute = this.columns[column].attribute;
    return attribute && attribute.constraint && attribute.constraint.type;
  }

  private isColumnEditable(column: number): boolean {
    return this.permissions && this.permissions.writeWithView && this.columns[column].editable;
  }

  private computeDirectEditValue(column: number): any {
    if (this.columnConstraintType(column) === ConstraintType.Boolean) {
      return !this.columnValue(column);
    }

    return null;
  }

  private modifyInitialValue(index: number, value: any): any {
    if (!value) {
      return value;
    }

    switch (this.columnConstraintType(index)) {
      case ConstraintType.Percentage:
        return isNumeric(value) ? toNumber(value) / 100 : value;
      default:
        return value;
    }
  }

  private columnValue(index: number): any {
    const column = this.columns[index];
    if (column && column.collectionId) {
      return ((this.row.linkInstance && this.row.document.data) || {})[column.attribute.id];
    } else if (column && column.linkTypeId) {
      return ((this.row.linkInstance && this.row.linkInstance.data) || {})[column.attribute.id];
    }
    return null;
  }

  public unFocusRow() {
    this.columnFocused$.next(null);
  }

  public onNewValue(column: number, value: any) {
    if (this.suggestions && this.suggestions.isSelected()) {
      this.suggestions.useSelection();
    } else {
      this.saveData(column, value);
    }
    this.onDataInputCancel(column);
  }

  private saveData(column: number, value: any) {
    if (this.savingDisabled) {
      this.savingDisabled = false;
      return;
    }

    if (this.creatingNewLink()) {
      this.createNewLink(column, value);
    } else {
      const currentValue = this.columnValue(column);
      if (currentValue !== value) {
        this.newValue.emit({column, value});
      }
    }
  }

  private createNewLink(column: number, value: any) {
    if (!this.creatingNewRow && isNotNullOrUndefined(value) && String(value).trim() !== '') {
      this.creatingNewRow = true;
      const attribute = this.columns[column].attribute;
      this.newLink.emit({data: {[attribute.id]: value}, correlationId: this.row.correlationId});
    }
  }

  private creatingNewLink(): boolean {
    return !this.row.document && !this.row.linkInstance;
  }

  public onDataInputDblClick(column: number, event: MouseEvent) {
    event.preventDefault();
    this.onEdit.emit(column);
  }

  public onDataInputCancel(column: number) {
    this.resetFocusAndEdit.emit(column);
  }

  public onDataInputFocus(column: number) {
    this.onFocus.emit(column);
  }

  public trackByColumn(index: number, column: LinkColumn): string {
    return `${column.collectionId || column.linkTypeId}:${column.attribute.id}`;
  }

  public ngOnDestroy() {
    this.focusSubscription.unsubscribe();
  }

  public onDetail() {
    this.detail.emit();
  }

  public onUnlink() {
    this.unLink.emit();
  }

  public onValueChange(index: number, value: any) {
    this.suggesting$.next(value);
  }

  public onDataInputKeyDown(event: KeyboardEvent) {
    event.stopPropagation();

    switch (event.code) {
      case KeyCode.ArrowDown:
        event.preventDefault();
        return this.suggestions && this.suggestions.moveSelection(Direction.Down);
      case KeyCode.ArrowUp:
        event.preventDefault();
        return this.suggestions && this.suggestions.moveSelection(Direction.Up);
    }

    if (isKeyPrintable(event) && this.suggestions) {
      return this.suggestions.clearSelection();
    }
  }

  public onUseHint() {
    this.savingDisabled = true;
  }
}
