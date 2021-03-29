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
  EventEmitter,
  Input,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {isMacOS} from '../../utils/system.utils';
import {isKeyPrintable, KeyCode} from '../../key-code';
import {User} from '../../../core/store/users/user';
import {ResourceCommentModel} from '../../../core/store/resource-comments/resource-comment.model';
import {generateId} from '../../utils/resource.utils';
import {objectValues, preventEvent} from '../../utils/common.utils';
import {ContentChange} from 'ngx-quill';

import * as QuillNamespace from 'quill';
import QuillMention from 'quill-mention';

@Component({
  selector: 'new-comment',
  templateUrl: './new-comment.component.html',
  styleUrls: ['./new-comment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewCommentComponent implements OnInit, AfterViewChecked {
  @Input()
  public bottomBorder = true;

  @Input()
  public currentUser: User;

  @Input()
  public initialComment: ResourceCommentModel;

  @Input()
  public startEditing = false;

  @Input()
  public usersMap: Record<string, User>;

  @Output()
  public onNewComment = new EventEmitter<Partial<ResourceCommentModel>>();

  @Output()
  public onCancel = new EventEmitter();

  @Output()
  public onEdit = new EventEmitter();

  public editing$ = new BehaviorSubject<boolean>(false);

  public progress = 0;

  //public readonly atValues = this.users.map(u => ({ id: u.id, value: u.name || u.email, target: u.email}));

  public readonly macOS = isMacOS();
  public readonly minLength = 2;
  public readonly maxLength = 2048;
  public readonly modules = {
    toolbar: [['bold', 'italic', 'underline', 'strike', {script: 'sub'}, {script: 'super'}, 'clean']],
    mention: {
      allowedChars: /^.*$/,
      mentionDenotationChars: ['@'],
      source: this.mentionsSource.bind(this),
    },
  };
  public readonly formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'indent',
    'script',
    'mention',
  ];

  private firstCheck = true;
  public commentText = '';

  constructor(private _sourceRenderer: Renderer2) {}

  public ngOnInit() {
    const Quill: any = QuillNamespace;
    Quill.register({'modules/mention': QuillMention}, true);

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

  public mentionsSource(searchTerm: string, renderItem, mentionChar) {
    const values = objectValues(this.usersMap).map(u => ({id: u.id, value: u.name || u.email, target: u.email}));
    if (searchTerm.length === 0) {
      renderItem(values, searchTerm);
    } else {
      const matches = [];
      for (let i = 0; i < values.length; i++) {
        if (
          ~values[i].value.toLowerCase().indexOf(searchTerm.toLowerCase()) ||
          ~values[i].target.toLowerCase().indexOf(searchTerm.toLowerCase())
        ) {
          matches.push(values[i]);
        }
      }
      renderItem(matches, searchTerm);
    }
  }

  private setComment(text: string) {
    this.commentText = text;
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
        author: this.currentUser.id,
        authorName: this.currentUser.name,
        authorEmail: this.currentUser.email,
      };
    }
    this.onNewComment.emit(comment);
    this.editing$.next(false);
    this.resetComment();
  }

  public onKeyDown(event: KeyboardEvent) {
    if (this.editing$.value) {
      if (this.commentText?.length >= this.maxLength && isKeyPrintable(event)) {
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

  public focusEditor(editor: any) {
    setTimeout(() => {
      editor.setSelection({index: Number.MAX_SAFE_INTEGER, length: 1});
      editor.scrollingContainer.scrollTop = Number.MAX_SAFE_INTEGER;
    }, 200);
  }

  public contentChanged(event: ContentChange) {
    if (event.editor.getLength() > this.maxLength) {
      event.editor.deleteText(this.maxLength, event.editor.getLength());
      this.updateProgress(event.text.substr(0, this.maxLength));
    } else {
      this.updateProgress(event.text);
    }
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
