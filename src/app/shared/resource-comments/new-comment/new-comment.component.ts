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
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {isMacOS} from '../../utils/system.utils';
import {KeyCode} from '../../key-code';
import {User} from '../../../core/store/users/user';
import {ResourceCommentModel} from '../../../core/store/resource-comments/resource-comment.model';
import {generateId} from '../../utils/resource.utils';
import {ClipboardService} from '../../../core/service/clipboard.service';
import {stripTextHtmlTags} from '../../utils/data.utils';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'new-comment',
  templateUrl: './new-comment.component.html',
  styleUrls: ['./new-comment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewCommentComponent implements OnChanges, OnInit, AfterViewChecked {
  @Output()
  public onNewComment = new EventEmitter<Partial<ResourceCommentModel>>();

  @Output()
  public onCancel = new EventEmitter();

  @Input()
  public sending: boolean = false;

  @Input()
  public user: User;

  @Input()
  public initialComment: ResourceCommentModel;

  @ViewChild('commentInput')
  public commentInput: ElementRef;

  public editing$ = new BehaviorSubject<boolean>(false);
  public commentText$ = new BehaviorSubject<string>('');

  public readonly macOS = isMacOS();

  private firstCheck = true;

  public ngOnInit() {
    if (this.initialComment) {
      this.commentText$.next(this.initialComment.comment);
      this.editing$.next(true);
    }
  }

  public ngAfterViewChecked() {
    if (this.initialComment && this.firstCheck) {
      this.editComment();
      this.firstCheck = false;
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.sending && changes.sending.currentValue === false && changes.sending.previousValue === true) {
      this.commentText$.next('');
      this.commentInput.nativeElement.innerHTML = '';
    }
  }

  public editComment() {
    this.editing$.next(true);
    this.commentInput.nativeElement.innerHTML = this.commentText$.getValue();
    setTimeout(() => {
      this.commentInput.nativeElement.focus();
    }, 200);
  }

  public updateCommentInput() {
    const originalText = this.commentInput.nativeElement.innerHTML.replace(/<div>/g, '<br/>').replace(/<\/div>/g, '');
    const text = stripTextHtmlTags(originalText, true);
    this.commentText$.next(text);

    if (text !== originalText) {
      this.commentInput.nativeElement.innerHTML = text;
    }
  }

  public cancelEditComment() {
    this.editing$.next(false);
    this.commentText$.next('');
    this.commentInput.nativeElement.innerHTML = '';
    this.onCancel.emit();
  }

  public sendComment() {
    let comment: Partial<ResourceCommentModel>;
    if (this.initialComment) {
      comment = {...this.initialComment, updateDate: new Date(), comment: this.commentText$.getValue()};
    } else {
      comment = {
        correlationId: generateId(),
        creationDate: new Date(),
        comment: this.commentText$.getValue(),
        author: this.user.id,
        authorName: this.user.name,
        authorEmail: this.user.email,
      };
    }
    this.onNewComment.emit(comment);
    this.editing$.next(false);
  }

  public onKeyDown(event: KeyboardEvent) {
    if (this.editing$.getValue()) {
      this.updateCommentInput();
    }

    if (this.commentText$.getValue() && event.code === KeyCode.Enter && (event.metaKey || event.ctrlKey)) {
      this.sendComment();
    }

    if (event.code === KeyCode.Escape) {
      this.cancelEditComment();
    }
  }

  public pastedContent($event: ClipboardEvent) {
    $event.preventDefault();
    const data = $event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, data);
  }
}
