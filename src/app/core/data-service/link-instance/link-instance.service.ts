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
import {LinkInstanceDto, LinkInstanceDuplicateDto} from '../../dto/link-instance.dto';
import {DocumentLinksDto} from '../../dto/document-links.dto';

export abstract class LinkInstanceService {
  public abstract getLinkInstance(linkTypeId: string, linkInstanceId: string): Observable<LinkInstanceDto>;

  public abstract getLinkInstances(linkInstanceIds: string[]): Observable<LinkInstanceDto[]>;

  public abstract updateLinkInstance(linkInstance: LinkInstanceDto): Observable<LinkInstanceDto>;

  public abstract createLinkInstance(linkInstance: LinkInstanceDto): Observable<LinkInstanceDto>;

  public abstract patchLinkInstanceData(linkInstanceId: string, data: Record<string, any>): Observable<LinkInstanceDto>;

  public abstract updateLinkInstanceData(linkInstanceDto: LinkInstanceDto): Observable<LinkInstanceDto>;

  public abstract deleteLinkInstance(id: string): Observable<string>;

  public abstract setDocumentLinks(linkTypeId: string, dto: DocumentLinksDto): Observable<LinkInstanceDto[]>;

  public abstract duplicateLinkInstances(
    linkInstanceDuplicate: LinkInstanceDuplicateDto
  ): Observable<LinkInstanceDto[]>;

  public abstract runRule(
    linkTypeId: string,
    linkInstanceId: string,
    attributeId: string,
    actionName?: string
  ): Observable<any>;
}
