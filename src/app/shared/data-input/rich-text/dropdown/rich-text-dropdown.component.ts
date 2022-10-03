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

import {Component, ChangeDetectionStrategy, Input, ViewChild} from '@angular/core';
import {ContentChange, QuillEditorComponent} from 'ngx-quill';
import {defaultTextEditorOptions} from '../../../modal/text-editor/text-editor.utils';
import {FullscreenDropdownDirective} from '../../../dropdown/fullscreen/fullscreen-dropdown.directive';

@Component({
  selector: 'rich-text-dropdown',
  templateUrl: './rich-text-dropdown.component.html',
  styleUrls: ['./rich-text-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RichTextDropdownComponent extends FullscreenDropdownDirective {
  @Input()
  public readonly = false;

  @Input()
  public content: string;

  @Input()
  public maxLength: number;

  @Input()
  public minLength: number;

  @ViewChild(QuillEditorComponent)
  public quillEditorComponent: QuillEditorComponent;

  public valid = true;
  public readonly defaultOptions = defaultTextEditorOptions;

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
}
