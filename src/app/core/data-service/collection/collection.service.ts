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
  abstract createCollection(collection: CollectionDto): Observable<CollectionDto>;

  abstract updateCollection(collection: CollectionDto): Observable<CollectionDto>;

  abstract removeCollection(collectionId: string): Observable<string>;

  abstract addFavorite(collectionId: string, workspace?: Workspace): Observable<any>;

  abstract removeFavorite(collectionId: string, workspace?: Workspace): Observable<any>;

  abstract getCollection(collectionId: string): Observable<CollectionDto>;

  abstract getCollections(workspace?: Workspace): Observable<CollectionDto[]>;

  abstract setDefaultAttribute(collectionId: string, attributeId: string): Observable<any>;

  abstract createAttribute(collectionId: string, attribute: AttributeDto): Observable<AttributeDto>;

  abstract createAttributes(collectionId: string, attributes: AttributeDto[]): Observable<AttributeDto[]>;

  abstract updateAttribute(collectionId: string, id: string, attribute: AttributeDto): Observable<AttributeDto>;

  abstract removeAttribute(collectionId: string, id: string): Observable<any>;
}
