/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General abstract License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General abstract License for more details.
 *
 * You should have received a copy of the GNU General abstract License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Observable} from 'rxjs';
import {AttributeDto, LinkTypeDto} from '../../dto';
import {Workspace} from '../../store/navigation/workspace';

export abstract class LinkTypeService {
  abstract createLinkType(linkType: LinkTypeDto): Observable<LinkTypeDto>;

  abstract getLinkType(id: string): Observable<LinkTypeDto>;

  abstract updateLinkType(id: string, linkType: LinkTypeDto): Observable<LinkTypeDto>;

  abstract deleteLinkType(id: string): Observable<string>;

  abstract getLinkTypes(workspace?: Workspace): Observable<LinkTypeDto[]>;

  abstract createAttributes(linkTypeId: string, attributes: AttributeDto[]): Observable<AttributeDto[]>;

  abstract updateAttribute(linkTypeId: string, id: string, attribute: AttributeDto): Observable<AttributeDto>;

  abstract deleteAttribute(linkTypeId: string, id: string): Observable<any>;
}
