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
  AfterViewChecked,
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
import {TABLE_ROW_MIN_HEIGHT} from '../../../view/perspectives/table/body/table-body.component';
import {KeyCode} from '../../key-code';
import {StripHtmlPipe} from '../../pipes/strip-html.pipe';

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
export class TextEditorModalComponent implements AfterViewInit {
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

  constructor(
    private bsModalRef: BsModalRef,
    private element: ElementRef<HTMLElement>,
    private stripHtml: StripHtmlPipe
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
    //console.log({txt: 'validuju', text});
    this.valid = true;

    if (this.minLength) {
      this.valid = text.length >= this.minLength;
    }

    if (this.maxLength) {
      this.valid = this.valid && text.length <= this.maxLength;
    }
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.editoreHeight();
  }

  private editoreHeight() {
    const toolbar = +this.dialogBody.nativeElement.querySelector('.ql-toolbar').clientHeight;
    const height = +this.dialogBody.nativeElement.parentElement.clientHeight - toolbar - 2;

    this.element.nativeElement.style.setProperty('--editor-height', `${height}px`);
  }

  public ngAfterViewInit(): void {
    setTimeout(() => {
      this.editoreHeight();
      this.checkValid(this.stripHtml.transform(this.content));
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
  }
}
