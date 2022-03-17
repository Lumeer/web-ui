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

import {Observable} from 'rxjs';
import {ResourceCommentDto} from '../../dto/resource-comment.dto';
import {ResourceType} from '../../model/resource-type';
import {Workspace} from '../../store/navigation/workspace';

export abstract class ResourceCommentService {
  public abstract createComment(comment: ResourceCommentDto, workspace?: Workspace): Observable<ResourceCommentDto>;

  public abstract updateComment(comment: ResourceCommentDto, workspace?: Workspace): Observable<ResourceCommentDto>;

  public abstract removeComment(comment: ResourceCommentDto, workspace?: Workspace): Observable<any>;

  public abstract getComments(
    resourceType: ResourceType,
    resourceId: string,
    pageStart?: number,
    pageLength?: number,
    workspace?: Workspace
  ): Observable<ResourceCommentDto[]>;
}
