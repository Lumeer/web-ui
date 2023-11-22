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

import {DocumentLinksDto} from '../../dto/document-links.dto';
import {LinkInstanceDto, LinkInstanceDuplicateDto} from '../../dto/link-instance.dto';
import {Workspace} from '../../store/navigation/workspace';

export abstract class LinkInstanceService {
  public abstract getLinkInstance(
    linkTypeId: string,
    linkInstanceId: string,
    workspace?: Workspace
  ): Observable<LinkInstanceDto>;

  public abstract getLinkInstances(linkInstanceIds: string[], workspace?: Workspace): Observable<LinkInstanceDto[]>;

  public abstract updateLinkInstance(linkInstance: LinkInstanceDto, workspace?: Workspace): Observable<LinkInstanceDto>;

  public abstract createLinkInstance(linkInstance: LinkInstanceDto, workspace?: Workspace): Observable<LinkInstanceDto>;

  public abstract patchLinkInstanceData(
    linkInstanceId: string,
    data: Record<string, any>,
    workspace?: Workspace
  ): Observable<LinkInstanceDto>;

  public abstract updateLinkInstanceData(
    linkInstanceDto: LinkInstanceDto,
    workspace?: Workspace
  ): Observable<LinkInstanceDto>;

  public abstract deleteLinkInstance(id: string, workspace?: Workspace): Observable<string>;

  public abstract setDocumentLinks(
    linkTypeId: string,
    dto: DocumentLinksDto,
    workspace?: Workspace
  ): Observable<LinkInstanceDto[]>;

  public abstract duplicateLinkInstances(
    linkInstanceDuplicate: LinkInstanceDuplicateDto,
    workspace?: Workspace
  ): Observable<LinkInstanceDto[]>;

  public abstract runRule(
    linkTypeId: string,
    linkInstanceId: string,
    attributeId: string,
    actionName?: string,
    workspace?: Workspace
  ): Observable<any>;
}
