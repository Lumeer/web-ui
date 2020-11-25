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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {ResourceType} from '../../../core/model/resource-type';
import {AppState} from '../../../core/store/app.state';
import {Action, select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable} from 'rxjs';
import {User} from '../../../core/store/users/user';
import {selectCurrentUser} from '../../../core/store/users/users.state';
import {ResourceCommentsAction} from '../../../core/store/resource-comments/resource-comments.action';
import {ResourceCommentModel} from '../../../core/store/resource-comments/resource-comment.model';
import {selectResourceCommentsByResource} from '../../../core/store/resource-comments/resource-comments.state';
import {generateId} from '../../utils/resource.utils';
import {NotificationsAction} from '../../../core/store/notifications/notifications.action';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {CollectionsAction} from '../../../core/store/collections/collections.action';

@Component({
  selector: 'comments-panel',
  templateUrl: './comments-panel.component.html',
  styleUrls: ['./comments-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentsPanelComponent implements OnInit, OnChanges {
  @Input()
  public resourceType: ResourceType;

  @Input()
  public resourceId: string;

  public user$: Observable<User>;

  public comments$: Observable<ResourceCommentModel[]>;

  public sending$ = new BehaviorSubject<boolean>(false);

  public constructor(private store$: Store<AppState>, private i18n: I18n) {}

  public ngOnInit(): void {
    this.user$ = this.store$.pipe(select(selectCurrentUser));
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.resourceType || changes.resourceId) {
      this.store$.dispatch(
        new ResourceCommentsAction.Get({resourceType: this.resourceType, resourceId: this.resourceId})
      );
      this.comments$ = this.store$.pipe(select(selectResourceCommentsByResource(this.resourceType, this.resourceId)));
    }
  }

  public newComment(partialComment: Partial<ResourceCommentModel>) {
    const comment: ResourceCommentModel = {
      ...partialComment,
      resourceType: this.resourceType,
      resourceId: this.resourceId,
    };

    this.sending$.next(true);
    this.store$.dispatch(
      new ResourceCommentsAction.Create({
        comment,
        onSuccess: commentId => this.sending$.next(false),
      })
    );
  }

  public removeComment(comment: ResourceCommentModel) {
    const removeAction = new ResourceCommentsAction.Delete({comment});
    const confirmAction = this.createConfirmAction(removeAction);
    this.store$.dispatch(confirmAction);
  }

  private createConfirmAction(action: Action): NotificationsAction.Confirm {
    const title = this.i18n({id: 'document.detail.comments.commentRemove.title', value: 'Delete this comment?'});
    const message = this.i18n({
      id: 'document.detail.comments.commentRemove.message',
      value: 'Do you really want to delete this comment?',
    });

    return new NotificationsAction.Confirm({title, message, type: 'danger', action});
  }

  public updateComment($event: ResourceCommentModel) {
    this.store$.dispatch(new ResourceCommentsAction.Update({comment: $event}));
  }
}
