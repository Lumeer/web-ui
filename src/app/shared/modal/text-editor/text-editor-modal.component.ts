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
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import {DialogType} from '../dialog-type';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {Subject} from 'rxjs';
import {KeyCode} from '../../key-code';
import {isMacOS} from '../../utils/system.utils';
import {defaultTextEditorOptions} from './text-editor.utils';
import {ContentChange, QuillEditorComponent} from 'ngx-quill';
import {stripTextHtmlTags} from '../../utils/data.utils';

export interface TextEditorChanged {
  html: string;
  text: string;
}

@Component({
  selector: 'text-editor-modal',
  templateUrl: './text-editor-modal.component.html',
  styleUrls: ['./text-editor-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextEditorModalComponent implements OnInit, AfterViewInit {
  @Input()
  public readonly = false;

  @Input()
  public content: string;

  @Input()
  public maxLength: number;

  @Input()
  public minLength: number;

  @ViewChild('dialogBody')
  public dialogBody: ElementRef;

  @ViewChild(QuillEditorComponent)
  public quillEditorComponent: QuillEditorComponent;

  public onSave$ = new Subject<string>();
  public onCancel$ = new Subject();
  public onContentChanged$ = new Subject<TextEditorChanged>();

  public valid = true;

  public readonly macOS = isMacOS();
  public readonly defaultOptions = defaultTextEditorOptions;
  public readonly dialogType = DialogType;
  public insertTextPlaceholder: string;

  constructor(private bsModalRef: BsModalRef, private element: ElementRef<HTMLElement>) {}

  private hideDialog() {
    this.bsModalRef.hide();
  }

  public submitDialog() {
    this.onSave$.next(this.getSaveContent());
    this.hideDialog();
  }

  private getSaveContent(): string {
    if (this.containsOnlyBrTags()) {
      return null;
    }
    return this.content;
  }

  private containsOnlyBrTags(): boolean {
    if (!this.content) {
      return false;
    }

    const content = this.content
      .replace(/<br>/g, '')
      .replace(/<p>\s*?<\/p>/g, '')
      .trim();
    return !content;
  }

  public cancelDialog() {
    this.onCancel$.next();
    this.hideDialog();
  }

  public contentChanged(event: ContentChange) {
    this.checkValid(event.text);
    this.onContentChanged$.next({html: event.html, text: event.text});
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
      setTimeout(() => this.editorHeight());
    }
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.editorHeight();
  }

  private editorHeight() {
    const toolbar = this.dialogBody.nativeElement.querySelector('.ql-toolbar');
    const toolbarHeight = toolbar ? +toolbar.clientHeight : 0;
    const warning = this.valid ? null : this.dialogBody.nativeElement.querySelector('#invalid-warning');
    const warningHeight = warning ? +warning.clientHeight : 0;
    const height = +this.dialogBody.nativeElement.parentElement.clientHeight - toolbarHeight - warningHeight - 2;

    this.element.nativeElement.style.setProperty('--editor-height', `${height}px`);
  }

  public ngOnInit() {
    this.checkValid(stripTextHtmlTags(this.content));

    this.insertTextPlaceholder = $localize`:@@textEditor.insertTextPlaceholder:Insert text here...`;
  }

  public ngAfterViewInit() {
    setTimeout(() => {
      this.editorHeight();
      if (this.quillEditorComponent?.quillEditor) {
        (<any>this.quillEditorComponent.quillEditor).scrollingContainer.scrollTop = Number.MAX_SAFE_INTEGER;
      }
    });
  }

  @HostListener('click', ['$event'])
  public onClick(event: MouseEvent) {
    event.stopImmediatePropagation();
  }

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (this.valid && event.code === KeyCode.Enter && (event.metaKey || event.ctrlKey)) {
      this.submitDialog();
    }

    if (event.code !== KeyCode.Escape) {
      event.stopPropagation();
    }

    if (event.code === KeyCode.Escape) {
      this.cancelDialog();
    }
  }

  public focusEditor(editor: any) {
    setTimeout(() => {
      editor.setSelection({index: Number.MAX_SAFE_INTEGER, length: 1});
      editor.scrollingContainer.scrollTop = Number.MAX_SAFE_INTEGER;
    }, 200);
  }
}
