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

import {select, Store} from '@ngrx/store';
import {Observable, of} from 'rxjs';
import {map, take} from 'rxjs/operators';
import {LinkInstanceService} from './link-instance.service';
import {AppState} from '../../store/app.state';
import {LinkInstanceDto} from '../../dto';
import {LinkInstanceDuplicateDto} from '../../dto/link-instance.dto';
import {generateId} from '../../../shared/utils/resource.utils';
import {selectLinkInstanceById, selectLinkInstancesByIds} from '../../store/link-instances/link-instances.state';
import {convertLinkInstanceModelToDto} from '../../store/link-instances/link-instance.converter';
import {LinkInstance} from '../../store/link-instances/link.instance';
import {DocumentLinksDto} from '../../dto/document-links.dto';

@Injectable()
export class PublicLinkInstanceService implements LinkInstanceService {
  constructor(private store$: Store<AppState>) {}

  public getLinkInstance(linkTypeId: string, linkInstanceId: string): Observable<LinkInstanceDto> {
    return of(null);
  }

  public getLinkInstances(linkInstanceIds: string[]): Observable<LinkInstanceDto[]> {
    return this.store$.pipe(
      select(selectLinkInstancesByIds(linkInstanceIds)),
      take(1),
      map(linkInstances => linkInstances.map(linkInstance => this.convertLinkInstanceModelToDto(linkInstance)))
    );
  }

  public updateLinkInstance(linkInstance: LinkInstanceDto): Observable<LinkInstanceDto> {
    return of(linkInstance);
  }

  public createLinkInstance(linkInstance: LinkInstanceDto): Observable<LinkInstanceDto> {
    return of({...linkInstance, id: generateId()});
  }

  public patchLinkInstanceData(linkInstanceId: string, data: Record<string, any>): Observable<LinkInstanceDto> {
    return this.getLinkInstanceFromStore$(linkInstanceId).pipe(
      map(linkInstance => ({
        ...linkInstance,
        data: {...linkInstance.data, ...data},
      }))
    );
  }

  public updateLinkInstanceData(linkInstanceDto: LinkInstanceDto): Observable<LinkInstanceDto> {
    return this.getLinkInstanceFromStore$(linkInstanceDto.id).pipe(
      map(linkInstance => ({
        ...linkInstance,
        data: linkInstanceDto.data,
      }))
    );
  }

  private getLinkInstanceFromStore$(id: string): Observable<LinkInstanceDto> {
    return this.store$.pipe(
      select(selectLinkInstanceById(id)),
      take(1),
      map(model => this.convertLinkInstanceModelToDto(model))
    );
  }

  public deleteLinkInstance(id: string): Observable<string> {
    return of(id);
  }

  public duplicateLinkInstances(linkInstanceDuplicate: LinkInstanceDuplicateDto): Observable<LinkInstanceDto[]> {
    return this.store$.pipe(
      select(selectLinkInstancesByIds(linkInstanceDuplicate.linkInstanceIds)),
      take(1),
      map(linkInstances =>
        linkInstances.map(linkInstance => {
          const documentIds = [...linkInstance.documentIds].map(documentId =>
            documentId === linkInstanceDuplicate.originalDocumentId
              ? linkInstanceDuplicate.newDocumentId
              : linkInstanceDuplicate[documentId] || documentId
          ) as [string, string];

          const newLinkInstance = {...linkInstance, id: generateId(), documentIds};
          return this.convertLinkInstanceModelToDto(newLinkInstance);
        })
      )
    );
  }

  public setDocumentLinks(linkTypeId: string, dto: DocumentLinksDto): Observable<LinkInstanceDto[]> {
    return of(dto.createdLinkInstances.map(linkInstance => ({...linkInstance, id: generateId()})));
  }

  private convertLinkInstanceModelToDto(model: LinkInstance): LinkInstanceDto {
    return (
      model && {
        ...convertLinkInstanceModelToDto(model),
        creationDate: model.creationDate?.getTime(),
        dataVersion: model.dataVersion || 0,
        updateDate: model.updateDate?.getTime(),
      }
    );
  }

  public runRule(
    linkTypeId: string,
    linkInstanceId: string,
    attributeId: string,
    actionName?: string
  ): Observable<any> {
    return of(true);
  }
}
