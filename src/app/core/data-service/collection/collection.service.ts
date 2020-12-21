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
import {AttributeDto, CollectionDto} from '../../dto';
import {Workspace} from '../../store/navigation/workspace';
import {PermissionService} from '../common/permission.service';

export abstract class CollectionService extends PermissionService {
  public abstract createCollection(collection: CollectionDto): Observable<CollectionDto>;

  public abstract updateCollection(collection: CollectionDto): Observable<CollectionDto>;

  public abstract removeCollection(collectionId: string): Observable<string>;

  public abstract addFavorite(collectionId: string, workspace?: Workspace): Observable<any>;

  public abstract removeFavorite(collectionId: string, workspace?: Workspace): Observable<any>;

  public abstract getCollection(collectionId: string): Observable<CollectionDto>;

  public abstract getCollections(workspace?: Workspace): Observable<CollectionDto[]>;

  public abstract setDefaultAttribute(collectionId: string, attributeId: string): Observable<any>;

  public abstract createAttribute(collectionId: string, attribute: AttributeDto): Observable<AttributeDto>;

  public abstract createAttributes(collectionId: string, attributes: AttributeDto[]): Observable<AttributeDto[]>;

  public abstract updateAttribute(collectionId: string, id: string, attribute: AttributeDto): Observable<AttributeDto>;

  public abstract removeAttribute(collectionId: string, id: string): Observable<any>;

  public abstract runRule(collectionId: string, ruleId: string): Observable<any>;
}
