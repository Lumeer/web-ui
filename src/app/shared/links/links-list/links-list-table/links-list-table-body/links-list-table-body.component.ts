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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {CollectionModel} from '../../../../../core/store/collections/collection.model';
import {LinkRowModel} from '../link-row.model';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {DocumentHintColumn} from '../../../../document-hints/document-hint-column';
import {LinkTypeModel} from '../../../../../core/store/link-types/link-type.model';
import {DocumentHintsComponent} from '../../../../document-hints/document-hints.component';
import {Direction} from '../../../../direction';
import {KeyCode} from '../../../../key-code';

@Component({
  selector: '[links-list-table-body]',
  templateUrl: './links-list-table-body.component.html',
  styleUrls: ['links-list-table-body.component.scss', './../links-list-table.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksListTableBodyComponent {
  @ViewChild(DocumentHintsComponent)
  public suggestions: DocumentHintsComponent;

  @Input()
  public document: DocumentModel;

  @Input()
  public linkType: LinkTypeModel;

  @Input()
  public columns: DocumentHintColumn[];

  @Input()
  public usedDocumentIds: string[];

  @Input()
  public otherCollection: CollectionModel;

  @Input()
  public linkRows: LinkRowModel[];

  @Input()
  public readonly: boolean;

  @Output() public select = new EventEmitter<{collection: CollectionModel; document: DocumentModel}>();

  @Output() public unlink = new EventEmitter<string>();

  @Output() public removeLinkRow = new EventEmitter<string>();

  public suggestingAttributeId: string;

  public suggestingValue: string;

  public selectedLinkRowCorrId: string;

  public documentSelected(collection: CollectionModel, linkRow: LinkRowModel) {
    const document = linkRow.document;
    this.select.emit({collection, document});
  }

  public removeEmptyLinkRow(linkRow: LinkRowModel) {
    if (linkRow.correlationId) {
      this.removeLinkRow.emit(linkRow.correlationId);
    }
  }

  public unlinkDocument(linkRow: LinkRowModel) {
    if (linkRow.linkInstance) {
      this.unlink.emit(linkRow.linkInstance.id);
    }
  }

  public trackByLinkRow(index: number, linkRow: LinkRowModel): string {
    return (linkRow.document && (linkRow.correlationId || linkRow.document.id)) || linkRow.correlationId;
  }

  public onFocus(correlationId: string, attributeId: string, value: string) {
    this.setSuggestingValues(correlationId, attributeId, value);
  }

  private setSuggestingValues(correlationId?: string, attributeId?: string, value?: string) {
    this.selectedLinkRowCorrId = correlationId;
    this.suggestingAttributeId = attributeId;
    this.suggestingValue = value;
  }

  public onValueChanged(correlationId: string, attributeId: string, value: string) {
    this.setSuggestingValues(correlationId, attributeId, value);
  }

  public onBlur() {
    this.setSuggestingValues(null, null, null);
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.ArrowDown:
        return this.suggestions && this.suggestions.moveSelection(Direction.Down);
      case KeyCode.ArrowUp:
        return this.suggestions && this.suggestions.moveSelection(Direction.Up);
    }
  }

  public onEnterKeyDown() {
    return this.suggestions && this.suggestions.isSelected() && this.suggestions.useSelection();
  }
}
