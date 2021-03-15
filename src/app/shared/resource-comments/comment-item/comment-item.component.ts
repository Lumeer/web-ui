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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ResourceCommentModel} from '../../../core/store/resource-comments/resource-comment.model';
import {User} from '../../../core/store/users/user';
import {BehaviorSubject, Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {selectAllUsers} from '../../../core/store/users/users.state';

@Component({
  selector: 'comment-item',
  templateUrl: './comment-item.component.html',
  styleUrls: ['./comment-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentItemComponent implements OnInit {
  @Input()
  public user: User;

  @Input()
  public comment: ResourceCommentModel;

  @Output()
  public onRemove = new EventEmitter<ResourceCommentModel>();

  @Output()
  public onUpdate = new EventEmitter<ResourceCommentModel>();

  @Output()
  public onRefresh = new EventEmitter<ResourceCommentModel>();

  public editing$ = new BehaviorSubject<boolean>(false);

  public users$: Observable<User[]>;

  public createdOnMsg = '';
  public createdByMsg = '';
  public updatedOnMsg = '';

  constructor(private store$: Store<AppState>) {
    this.createdOnMsg = $localize`:@@document.detail.header.createdOn:Created on`;
    this.createdByMsg = $localize`:@@document.detail.header.createdBy:Created by`;
    this.updatedOnMsg = $localize`:@@document.detail.header.updatedOn:Updated on`;
  }

  public ngOnInit(): void {
    this.users$ = this.store$.pipe(select(selectAllUsers));
  }

  public editComment(comment: ResourceCommentModel) {
    this.editing$.next(true);
  }

  public onUpdateComment($event: Partial<ResourceCommentModel>) {
    this.editing$.next(false);
    this.onUpdate.emit({...this.comment, ...$event});
  }

  public cancelEdit() {
    this.editing$.next(false);
  }
}
