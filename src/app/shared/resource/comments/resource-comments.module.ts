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

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {GravatarModule} from 'ngx-gravatar';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {QuillModule} from 'ngx-quill';
import {UserAvatarComponent} from './user-avatar/user-avatar.component';
import {ShortDateComponent} from './comment-item/short-date/short-date.component';
import {CommentItemComponent} from './comment-item/comment-item.component';
import {NewCommentComponent} from './new-comment/new-comment.component';
import {ResourceCommentsComponent} from './resource-comments.component';
import {ProgressCircleComponent} from './new-comment/progress-circle/progress-circle.component';
import {CommentsCountComponent} from './comments-count/comments-count.component';
import {PipesModule} from '../../pipes/pipes.module';

@NgModule({
  declarations: [
    UserAvatarComponent,
    ShortDateComponent,
    CommentItemComponent,
    NewCommentComponent,
    ResourceCommentsComponent,
    ProgressCircleComponent,
    CommentsCountComponent,
  ],
  imports: [CommonModule, GravatarModule, TooltipModule, PipesModule, FormsModule, QuillModule.forRoot()],
  exports: [
    CommentItemComponent,
    UserAvatarComponent,
    ShortDateComponent,
    NewCommentComponent,
    ResourceCommentsComponent,
    CommentsCountComponent,
  ],
})
export class ResourceCommentsModule {}
