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
import {SelectionListDto} from '../../dto/selection-list.dto';

export abstract class SelectionListsService {
  public abstract create(organizationId: string, dto: SelectionListDto): Observable<SelectionListDto>;

  public abstract createSampleLists(organizationId: string, projectId: string): Observable<any>;

  public abstract update(organizationId: string, id: string, dto: SelectionListDto): Observable<SelectionListDto>;

  public abstract delete(organizationId: string, id: string): Observable<string>;

  public abstract get(organizationId: string): Observable<SelectionListDto[]>;

  public abstract getOne(organizationId: string, id: string): Observable<SelectionListDto>;

  public abstract getByProject(organizationId: string, projectId: string): Observable<SelectionListDto[]>;
}
