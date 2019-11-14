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
import {BsModalRef} from 'ngx-bootstrap';
import {Subject} from 'rxjs';
import {KeyCode} from '../../key-code';
import {StripHtmlPipe} from '../../pipes/strip-html.pipe';
import {isMacOS} from '../../utils/system.utils';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {defaultTextEditorOptions} from './text-editor.utils';

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
  public readonly dialogType = DialogType;

  @Input()
  public readonly = false;

  @Input()
  public content: string;

  @Input()
  public maxLength: number;

  @Input()
  public minLength: number;

  public onSave = new Subject<string>();
  public onCancel = new Subject();
  public onContentChanged = new Subject<TextEditorChanged>();

  @ViewChild('dialogBody', {static: false})
  public dialogBody: ElementRef;

  public valid = true;

  public readonly macOS = isMacOS();
  public readonly defaultOptions = defaultTextEditorOptions;
  public insertTextPlaceholder: string;

  constructor(
    private bsModalRef: BsModalRef,
    private element: ElementRef<HTMLElement>,
    private stripHtml: StripHtmlPipe,
    private i18n: I18n
  ) {}

  private hideDialog() {
    this.bsModalRef.hide();
  }

  public submitDialog(content: string) {
    this.onSave.next(content);
    this.hideDialog();
  }

  public cancelDialog() {
    this.onCancel.next();
    this.hideDialog();
  }

  public contentChanged($event: {
    content: any;
    delta: any;
    editor: any;
    html: string | null;
    oldDelta: any;
    source: string;
    text: string;
  }) {
    this.checkValid($event.text);
    this.onContentChanged.next({html: $event.html, text: $event.text});
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
      setTimeout(() => this.editoreHeight());
    }
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.editoreHeight();
  }

  private editoreHeight() {
    const toolbar = +this.dialogBody.nativeElement.querySelector('.ql-toolbar').clientHeight;
    const warning = this.valid ? 0 : +this.dialogBody.nativeElement.querySelector('#invalid-warning').clientHeight;
    const height = +this.dialogBody.nativeElement.parentElement.clientHeight - toolbar - warning - 2;

    this.element.nativeElement.style.setProperty('--editor-height', `${height}px`);
  }

  public ngOnInit(): void {
    this.checkValid(this.stripHtml.transform(this.content));

    this.insertTextPlaceholder = this.i18n({
      id: 'textEditor.insertTextPlaceholder',
      value: 'Insert text here...',
    });
  }

  public ngAfterViewInit(): void {
    setTimeout(() => {
      this.editoreHeight();
    });
  }

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (this.valid && event.code === KeyCode.Enter && (event.metaKey || event.ctrlKey)) {
      this.submitDialog(this.content);
    }

    if (event.code !== KeyCode.Escape) {
      event.stopPropagation();
    }

    if (event.code === KeyCode.Escape) {
      this.cancelDialog();
    }
  }
}
