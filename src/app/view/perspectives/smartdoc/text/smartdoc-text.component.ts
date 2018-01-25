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

import {Component, EventEmitter, HostListener, Input, Output} from '@angular/core';
import QuillEditor, {DeltaOperation, DeltaStatic, Quill, RangeStatic} from 'quill';
import * as QuillDeltaToHtmlConverter from 'quill-delta-to-html';
import {AttributeModel, CollectionModel} from '../../../../core/store/collections/collection.model';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {SmartDocPartModel} from '../../../../core/store/smartdoc/smartdoc.model';
import {AttributeBlot} from './attribute.blot';

const Delta = QuillEditor.import('delta');
QuillEditor.register(AttributeBlot);

@Component({
  selector: 'smartdoc-text',
  templateUrl: './smartdoc-text.component.html',
  styleUrls: ['./smartdoc-text.component.scss']
})
export class SmartDocTextComponent {

  @Input()
  public collection: CollectionModel;

  @Input()
  public document: DocumentModel;

  @Input()
  public path: number[];

  @Input()
  public part: SmartDocPartModel;

  @Output()
  public partChange = new EventEmitter<SmartDocPartModel>();

  public editorShown: boolean;
  private editor: Quill;
  private editorInitializing: boolean;
  private contentChanged: boolean;
  private lastSelection: RangeStatic;

  @HostListener('dblclick')
  public onDoubleClick(): void {
    this.editorShown = true;
  }

  public onClickOutside(): void {

    if (this.contentChanged) {
      this.updateTemplateText();
    } else {
      this.editorShown = false;
    }
  }

  public onEditorCreated(editor: Quill) {
    this.editorInitializing = true;
    this.editor = editor;

    const delta: DeltaStatic = this.part.textData || new Delta();
    this.editor.setContents(this.addDataToDeltaForEdit(delta), 'api');

    this.editor.focus();
  }

  private addDataToDeltaForEdit(delta: DeltaStatic): DeltaStatic {
    const ops: DeltaOperation[] = delta.ops.map((op: DeltaOperation) => {
      if (op.insert && op.insert.attribute) {
        return {
          insert: {
            attribute: {
              id: op.insert.attribute.id,
              value: this.document.data[op.insert.attribute.id]
            }
          },
          attributes: {
            color: '#18bc9c'
          }
        };
      }
      return op;
    });
    return new Delta(ops);
  }

  public addDataToDeltaForRead(delta: DeltaStatic): DeltaStatic {
    const ops: DeltaOperation[] = delta.ops.map((op: DeltaOperation) => {
      if (op.insert && op.insert.attribute) {
        return {
          insert: this.document.data[op.insert.attribute.id]
        };
      }
      return op;
    });
    return new Delta(ops);
  }

  private removeValuesFromDelta(delta: DeltaStatic): DeltaStatic {
    const ops: DeltaOperation[] = delta.map<DeltaOperation>((op: DeltaOperation) => {
      if (op.insert && op.insert.attribute) {
        return {insert: {attribute: {id: op.insert.attribute.id}}};
      }
      return op;
    });
    return new Delta(ops);
  }

  public onContentChanged(event: { delta: DeltaStatic }) {
    this.contentChanged = true;
  }

  public onSelectionChanged(event: { range }) {
    this.lastSelection = event.range ? event.range : this.lastSelection;
  }

  private updateTemplateText() {
    const textData = this.removeValuesFromDelta(this.editor.getContents());
    const templatePart: SmartDocPartModel = {...this.part, textData};
    this.partChange.emit(templatePart);
  }

  public documentAttributes(): AttributeModel[] {
    const documentAttributeIds = Object.keys(this.document.data);
    return this.collection.attributes.filter(attr => documentAttributeIds.includes(attr.id));
  }

  public onAddAttribute(id: string) {
    const index = this.lastSelection ? this.lastSelection.index : 0;
    const value = this.document.data[id];
    this.editor.insertEmbed(index, 'attribute', {id, value});
    this.editor.setSelection(index + 1, 0);
  }

  public getHtmlContent() {
    if (!this.part.textData) {
      return '';
    }

    const delta: DeltaStatic = this.part.textData || new Delta();
    const converter = new QuillDeltaToHtmlConverter(this.addDataToDeltaForRead(delta).ops, {});
    return converter.convert();
  }

}
