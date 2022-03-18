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
import {AttributeDto, LinkTypeDto} from '../../dto';
import {Workspace} from '../../store/navigation/workspace';
import {RuleDto} from '../../dto/rule.dto';

export abstract class LinkTypeService {
  public abstract createLinkType(linkType: LinkTypeDto, workspace?: Workspace): Observable<LinkTypeDto>;

  public abstract getLinkType(id: string, workspace?: Workspace): Observable<LinkTypeDto>;

  public abstract updateLinkType(id: string, linkType: LinkTypeDto, workspace?: Workspace): Observable<LinkTypeDto>;

  public abstract upsertRule(
    collectionId: string,
    ruleId: string,
    ruleDto: RuleDto,
    workspace?: Workspace
  ): Observable<LinkTypeDto>;

  public abstract deleteLinkType(id: string): Observable<string>;

  public abstract getLinkTypes(workspace?: Workspace): Observable<LinkTypeDto[]>;

  public abstract createAttributes(linkTypeId: string, attributes: AttributeDto[]): Observable<AttributeDto[]>;

  public abstract updateAttribute(
    linkTypeId: string,
    id: string,
    attribute: AttributeDto,
    workspace?: Workspace
  ): Observable<AttributeDto>;

  public abstract deleteAttribute(linkTypeId: string, id: string): Observable<any>;
}
