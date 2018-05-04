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

import {Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import {Attribute, Document} from '../../../../core/dto';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {DocumentConverter} from '../../../../core/store/documents/document.converter';
import {KeyCode} from '../../../../shared/key-code';
import {HtmlModifier} from '../../../../shared/utils/html-modifier';
import {isKeyPrintable} from '../../../../shared/utils/key-code.helper';
import {Direction} from '../../post-it/document-data/direction';
import {DataChangeEvent, LinkInstanceEvent, TableCursorEvent} from '../event';

import {TableRow} from '../model/table-row';
import {TableManagerService} from '../util/table-manager.service';

@Component({
  selector: 'table-body-cell',
  templateUrl: './table-body-cell.component.html',
  styleUrls: ['./table-body-cell.component.scss']
})
export class TableBodyCellComponent implements OnChanges {

  @Input()
  public row: TableRow;

  @Input()
  public attribute: Attribute;

  @Input()
  public editedCell: { row: TableRow, attribute: Attribute };

  @Output()
  public editedCellChange = new EventEmitter<{ row: TableRow, attribute: Attribute }>();

  @Input()
  public selectedCell: { row: TableRow, attribute: Attribute };

  @Output()
  public selectedCellChange = new EventEmitter<{ row: TableRow, attribute: Attribute }>();

  @Output()
  public moveCursor: EventEmitter<TableCursorEvent> = new EventEmitter();

  @Output()
  public dataChange = new EventEmitter<DataChangeEvent>();

  @Output()
  public deleteDocument = new EventEmitter();

  @Output()
  public expand = new EventEmitter();

  @Output()
  public createLinkInstance = new EventEmitter<LinkInstanceEvent>();

  @Output()
  public deleteLinkInstance = new EventEmitter<string>();

  @ViewChild('dataCell')
  public dataCell: ElementRef;

  public editMode = false;
  public highlighted = false;

  public constructor(private notificationService: NotificationService,
                     private tableManagerService: TableManagerService) {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('selectedCell') && this.isSelected()) {
      this.dataCell.nativeElement.focus();
    }
    if (changes.hasOwnProperty('editedCell')) {
      this.highlighted = this.editedCell
        && this.editedCell.attribute === this.attribute
        && this.row.documents.includes(this.editedCell.row.documents[0]);
    }
    if (changes.hasOwnProperty('row') && this.row.documents.length === 0) {
      const doc = new Document();
      doc.collectionId = this.row.part.collection.id;
      doc.data = {};
      this.row.documents.push(doc);
    }
  }

  public isSelected(): boolean {
    return this.selectedCell && this.selectedCell.row === this.row && this.selectedCell.attribute === this.attribute;
  }

  public switchEditMode(editable: boolean) {
    this.editMode = editable;

    if (editable) {
      setTimeout(() => HtmlModifier.setCursorAtTextContentEnd(this.dataCell.nativeElement));
      this.editedCellChange.emit({row: this.row, attribute: this.attribute});
      return;
    }

    if (this.row.documents[0].id || this.dataCell.nativeElement.textContent) {
      this.saveDataChanges();
    }

    this.editedCellChange.emit(null);
  }

  private saveDataChanges() {
    const oldValue = this.row.documents.length > 0 ? this.row.documents[0].data[this.attribute.name] : null;
    const newValue = this.dataCell.nativeElement.textContent.trim();

    // TODO validate new value based on constraints

    const linkedDocument: Document = this.row.part.linkedDocument ? DocumentConverter.toDto(this.row.part.linkedDocument) : null;

    if (newValue !== oldValue) {
      this.dataChange.emit({
        collection: this.row.part.collection,
        document: this.row.documents[0],
        attribute: this.attribute,
        value: newValue,
        linkedDocument: this.row.previousLinkedRow ? this.row.previousLinkedRow.documents[0] : linkedDocument,
        linkType: this.row.part.linkType
      });
    }
  }

  public onBlur() {
    if (this.editMode) {
      this.switchEditMode(false);
    }
  }

  public onFocus() {
    this.setSelectedCell();
    setTimeout(() => this.initNextColumn());
    setTimeout(() => this.initNextRow());
  }

  private setSelectedCell() {
    if (!this.isSelected()) {
      this.selectedCellChange.emit({row: this.row, attribute: this.attribute});
    }
  }

  private initNextColumn() {
    if (this.isSinglePart() && this.isLastAttribute()) {
      this.tableManagerService.addColumn(this.row.part, this.attribute);
    }
  }

  private isSinglePart() {
    return this.row.part.index === 0 && !this.row.part.nextPart;
  }

  private isLastAttribute() {
    return this.row.part.shownAttributes.indexOf(this.attribute) === this.row.part.shownAttributes.length - 1;
  }

  private initNextRow() {
    if (this.isSinglePart() && this.isLastRow()) {
      this.tableManagerService.addRow(this.row);
    }
  }

  private isLastRow(): boolean {
    return this.row.part.rows.indexOf(this.row) === this.row.part.rows.length - 1;
  }

  public onKeyDown(event: KeyboardEvent, unchangeable?: boolean) {
    if (this.editMode) {
      this.onKeyDownInEditMode(event);
    } else {
      this.onKeyDownInSelectionMode(event, unchangeable);
    }
  }

  private onKeyDownInEditMode(event: KeyboardEvent) {
    switch (event.keyCode) {
      case KeyCode.Enter:
      case KeyCode.Escape:
        this.switchEditMode(false);
        event.preventDefault();
        return;
    }
  }

  private onKeyDownInSelectionMode(event: KeyboardEvent, unchangeable?: boolean) {
    switch (event.keyCode) {
      case KeyCode.LeftArrow:
        return this.moveCursor.emit({direction: Direction.Left, row: this.row, attribute: this.attribute});
      case KeyCode.UpArrow:
        return this.moveCursor.emit({direction: Direction.Up, row: this.row, attribute: this.attribute});
      case KeyCode.RightArrow:
        return this.moveCursor.emit({direction: Direction.Right, row: this.row, attribute: this.attribute});
      case KeyCode.DownArrow:
        return this.moveCursor.emit({direction: Direction.Down, row: this.row, attribute: this.attribute});
      case KeyCode.Enter:
      case KeyCode.Backspace:
        if (!unchangeable) {
          this.switchEditMode(true);
        }
        event.preventDefault();
        return;
      case KeyCode.Delete:
        this.dataCell.nativeElement.textContent = '';
        this.saveDataChanges();
        return;
      default:
        if (!isKeyPrintable(event.keyCode)) {
          return;
        }

        event.preventDefault();
        if (!unchangeable) {
          this.switchEditMode(true);
        }
        if (!this.dataCell.nativeElement.textContent) {
          this.dataCell.nativeElement.textContent = event.key;
        }
    }
  }

  public addNewRow() {
    const newRow = this.tableManagerService.addRow(this.row);
    setTimeout(() => this.selectedCellChange.emit({row: newRow, attribute: newRow.part.shownAttributes[0]}));
  }

  public addLinkedRow() {
    const newRow = this.tableManagerService.addLinkedRow(this.row);
    setTimeout(() => this.selectedCell = {row: newRow, attribute: newRow.part.shownAttributes[0]});
  }

  public confirmUnlink() {
    this.notificationService.confirm(
      'Unlinking a row will permanently delete the link between the data records.',
      'Delete this link?',
      [
        {text: 'Yes', action: () => this.onUnlinkRow(), bold: false},
        {text: 'No'}
      ]
    );
  }

  public confirmRemove() {
    this.notificationService.confirm(
      'Deleting a row will permanently remove the record from the file',
      'Delete this record?',
      [
        {text: 'Yes', action: () => this.onDeleteDocument(), bold: false},
        {text: 'No'}
      ]
    );
  }

  public onUnlinkRow() {
    this.tableManagerService.removeRow(this.row);

    this.deleteLinkInstance.emit(this.getLinkInstanceId());
  }

  public onRemoveRow() {
    if (this.row.documents[0].id) {
      return this.confirmRemove();
    }

    this.tableManagerService.removeRow(this.row);
  }

  public onDeleteDocument() {
    const doc = this.row.documents[0];
    this.tableManagerService.removeRow(this.row);
    this.tableManagerService.removeDocumentFromRows(this.row.part, doc);
    this.deleteDocument.emit(doc);
  }

  public onExpand() {
    this.expand.emit();
  }

  public suggestLinkedDocuments(prefix: string): Document[] {
    const usedDocuments: Document[] = [].concat.apply([], this.row.previousLinkedRow.nextLinkedRows.map(row => row.documents));

    // TODO use document service instead
    return this.tableManagerService.documents.filter(doc => doc.collectionId === this.row.part.collection.id && !usedDocuments.includes(doc));
    // && doc.data[this.attribute.fullName] && doc.data[this.attribute.fullName].toLowerCase().startsWith(prefix.toLowerCase()));
  }

  public linkExistingDocument(doc: Document) {
    this.row.documents = [doc];

    this.createLinkInstance.emit({
      linkType: this.row.part.linkType,
      documents: [this.row.previousLinkedRow.documents[0], doc]
    });
  }

  public getLinkInstanceId(): string {
    return this.tableManagerService.linkInstances.find(linkInstance => linkInstance.linkTypeId === this.row.part.linkType.id &&
      linkInstance.documentIds.every(id => id === this.row.documents[0].id || id === this.row.previousLinkedRow.documents[0].id)).id;
  }

}
