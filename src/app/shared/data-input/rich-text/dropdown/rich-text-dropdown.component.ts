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
import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';

import {ContentChange, QuillEditorComponent} from 'ngx-quill';

import {ModalData} from '../../../../core/model/modal-data';
import {FullscreenDropdownDirective} from '../../../dropdown/fullscreen/fullscreen-dropdown.directive';
import {KeyCode, keyboardEventCode} from '../../../key-code';
import {defaultTextEditorOptions} from '../../../modal/text-editor/text-editor.utils';
import {textContainsOnlyBrTags} from '../../../utils/string.utils';
import {isMacOS} from '../../../utils/system.utils';

@Component({
  selector: 'rich-text-dropdown',
  templateUrl: './rich-text-dropdown.component.html',
  styleUrls: ['./rich-text-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RichTextDropdownComponent extends FullscreenDropdownDirective {
  @Input()
  public modalData: ModalData;

  @Input()
  public readonly = false;

  @Input()
  public content: string;

  @Input()
  public maxLength: number;

  @Input()
  public minLength: number;

  @Input()
  public origin: ElementRef | HTMLElement;

  @Output()
  public save = new EventEmitter<string>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public dataChange = new EventEmitter<ModalData>();

  @ViewChild(QuillEditorComponent)
  public quillEditorComponent: QuillEditorComponent;

  public readonly defaultOptions = defaultTextEditorOptions;
  public readonly macOS = isMacOS();

  public valid = true;

  private keyboardEventListener = (event: KeyboardEvent) => {
    const code = keyboardEventCode(event);
    if (this.isOpen() && this.valid && code === KeyCode.Enter && (event.metaKey || event.ctrlKey)) {
      this.onSave();
    }
  };

  public contentChanged(event: ContentChange) {
    this.checkValid(event.text);
  }

  private checkValid(text: string) {
    const filterText = text.replace('\n', '').trim();
    let newValid = true;

    if (this.minLength) {
      newValid = filterText.length >= this.minLength;
    }

    if (this.maxLength) {
      newValid = newValid && filterText.length <= this.maxLength;
    }

    if (newValid !== this.valid) {
      this.valid = newValid;
    }
  }

  public focusEditor(editor: any) {
    setTimeout(() => {
      editor.setSelection({index: Number.MAX_SAFE_INTEGER, length: 1});
      editor.scrollingContainer.scrollTop = Number.MAX_SAFE_INTEGER;
    }, 200);
  }

  public onCancel() {
    this.close();
    this.cancel.emit();
  }

  public onSave() {
    this.close();
    if (!this.readonly) {
      this.save.emit(this.getSaveContent());
    }
  }

  private getSaveContent(): string {
    return textContainsOnlyBrTags(this.content) ? null : this.content;
  }

  public onEditorMouseDown(event: MouseEvent) {
    const target = <HTMLElement>event.target;
    if (!target?.classList.contains('ql-toolbar')) {
      event.stopPropagation();
    }
  }

  public open() {
    super.open();
    document.addEventListener('keydown', this.keyboardEventListener, {capture: true});
  }

  public close() {
    super.close();
    document.removeEventListener('keydown', this.keyboardEventListener, {capture: true});
  }
}
