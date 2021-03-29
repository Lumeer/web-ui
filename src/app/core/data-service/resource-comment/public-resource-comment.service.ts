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

import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable, of} from 'rxjs';
import {AppState} from '../../store/app.state';
import {generateId} from '../../../shared/utils/resource.utils';
import {ResourceCommentService} from './resource-comment.service';
import {ResourceCommentDto} from '../../dto/resource-comment.dto';
import {ResourceType} from '../../model/resource-type';

@Injectable()
export class PublicResourceCommentService implements ResourceCommentService {
  constructor(private store$: Store<AppState>) {}

  public createComment(comment: ResourceCommentDto): Observable<ResourceCommentDto> {
    return of({...comment, id: generateId(), creationDate: new Date().getTime()});
  }

  public updateComment(comment: ResourceCommentDto): Observable<ResourceCommentDto> {
    return of({...comment, updateDate: new Date().getTime()});
  }

  public removeComment(comment: ResourceCommentDto): Observable<any> {
    return of(comment.id);
  }

  public getComments(
    resourceType: ResourceType,
    resourceId: string,
    pageStart?: number,
    pageLength?: number
  ): Observable<ResourceCommentDto[]> {
    return of([]);
  }
}
