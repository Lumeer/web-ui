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
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {isMacOS} from '../../utils/system.utils';
import {isKeyPrintable, KeyCode} from '../../key-code';
import {User} from '../../../core/store/users/user';
import {ResourceCommentModel} from '../../../core/store/resource-comments/resource-comment.model';
import {generateId} from '../../utils/resource.utils';
import {stripTextHtmlTags} from '../../utils/data.utils';
import DOMPurify from 'dompurify';
import {preventEvent} from '../../utils/common.utils';

@Component({
  selector: 'new-comment',
  templateUrl: './new-comment.component.html',
  styleUrls: ['./new-comment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewCommentComponent implements OnInit, AfterViewChecked {
  @Output()
  public onNewComment = new EventEmitter<Partial<ResourceCommentModel>>();

  @Output()
  public onCancel = new EventEmitter();

  @Output()
  public onEdit = new EventEmitter();

  @Input()
  public bottomBorder = true;

  @Input()
  public user: User;

  @Input()
  public initialComment: ResourceCommentModel;

  @Input()
  public startEditing = false;

  @ViewChild('commentInput')
  public commentInput: ElementRef;

  public editing$ = new BehaviorSubject<boolean>(false);

  public progress = 0;

  public readonly macOS = isMacOS();
  public readonly maxLength = 2048;

  private firstCheck = true;
  private commentText = '';

  constructor(private _sourceRenderer: Renderer2) {}

  public ngOnInit() {
    if (this.initialComment || this.startEditing) {
      this.commentText = this.initialComment.comment;
      this.editing$.next(true);
    }
  }

  public ngAfterViewChecked() {
    if ((this.initialComment || this.startEditing) && this.firstCheck) {
      this.editComment();
      this.firstCheck = false;
    }
  }

  private setComment(text: string, updateElement = true) {
    this.commentText = text;
    if (updateElement) {
      this._sourceRenderer.setProperty(this.commentInput.nativeElement, 'innerHTML', text);
    }
    this.updateProgress(text);
  }

  private resetComment() {
    this.setComment('');
  }

  private updateProgress(text: string) {
    const cleaned = cleanTextBeforeSave(text);
    this.progress = cleaned?.length ? (cleaned.length / this.maxLength) * 100 : 0;
  }

  public editComment(pageSource?: boolean) {
    if (pageSource) {
      this.onEdit.emit();
    }

    this.editing$.next(true);
    this.setComment(this.commentText);
    setTimeout(() => {
      this.commentInput.nativeElement.focus();
    }, 200);
  }

  public updateCommentInput(value: string) {
    const originalText = value.replace(/<div>/g, '<br>').replace(/<\/div>/g, '');

    const text = DOMPurify.sanitize(stripTextHtmlTags(originalText, true)).substr(0, this.maxLength);
    if (text !== this.commentText) {
      this.setComment(text, text !== originalText);
    }
  }

  public cancelEditComment() {
    this.editing$.next(false);
    this.resetComment();
    this.onCancel.emit();
  }

  public sendComment() {
    let comment: Partial<ResourceCommentModel>;
    if (this.initialComment && !this.startEditing) {
      comment = {...this.initialComment, updateDate: new Date(), comment: this.commentText};
    } else {
      comment = {
        correlationId: generateId(),
        creationDate: new Date(),
        comment: cleanTextBeforeSave(this.commentText),
        author: this.user.id,
        authorName: this.user.name,
        authorEmail: this.user.email,
      };
    }
    this.onNewComment.emit(comment);
    this.resetComment();
  }

  public onKeyDown(event: KeyboardEvent) {
    if (this.editing$.value) {
      if (this.commentText.length >= this.maxLength && isKeyPrintable(event)) {
        preventEvent(event);
      }
    }

    if (this.commentText && event.code === KeyCode.Enter && (event.metaKey || event.ctrlKey)) {
      this.sendComment();
    }

    if (event.code === KeyCode.Escape) {
      this.cancelEditComment();
    }
  }

  public pastedContent(event: ClipboardEvent) {
    event.preventDefault();
    const data = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, data.substr(0, this.maxLength - this.commentText.length));
  }
}

function cleanTextBeforeSave(text: string): string {
  let previousText = text || '';
  let currentText = cleanText(text || '');
  while (currentText !== previousText) {
    previousText = currentText;
    currentText = cleanText(currentText);
  }
  return currentText;
}

function cleanText(text: string): string {
  const withoutNewLines = text.trim().replace(/^(<br\s*\/?>)*|(<br\s*\/?>)*$/gi, '');
  const withoutSpaces = withoutNewLines.trim().replace(/^(&nbsp;\s*)*|(&nbsp;\s*)*$/gi, '');
  return withoutSpaces.trim();
}
