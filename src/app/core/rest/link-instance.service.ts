/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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
import {Observable} from 'rxjs/Observable';
import {LocalStorage} from '../../shared/utils/local-storage';
import {LinkInstance} from '../dto/link-instance';
import {Query} from '../dto/query';

const LINK_INSTANCES = 'linkInstances';

@Injectable()
export class LinkInstanceService {

  public createLinkInstance(linkInstance: LinkInstance): Observable<LinkInstance> {
    const linkInstances = LocalStorage.get(LINK_INSTANCES) || {};

    linkInstance.id = String(Math.floor(Math.random() * 1000000000000000) + 1);
    linkInstances[linkInstance.id] = linkInstance;

    LocalStorage.set(LINK_INSTANCES, linkInstances);

    return Observable.of(linkInstance);
  }

  public updateLinkInstance(id: string, linkInstance: LinkInstance): Observable<LinkInstance> {
    const linkInstances = LocalStorage.get(LINK_INSTANCES) || {};

    linkInstances[id] = linkInstance;

    LocalStorage.set(LINK_INSTANCES, linkInstances);

    return Observable.of(linkInstance);
  }

  public deleteLinkInstance(id: string): Observable<string> {
    const linkInstances = LocalStorage.get(LINK_INSTANCES) || {};

    delete linkInstances[id];

    LocalStorage.set(LINK_INSTANCES, linkInstances);

    return Observable.of(id);
  }

  public getLinkInstances(query: Query): Observable<LinkInstance[]> {
    const linkInstancesMap: { [id: string]: LinkInstance } = LocalStorage.get(LINK_INSTANCES) || {};
    let linkInstances = Object.values(linkInstancesMap);

    if (query && query.linkTypeIds && query.linkTypeIds.length) {
      linkInstances = linkInstances.filter(linkInstance => query.linkTypeIds.includes(linkInstance.linkTypeId));
    }

    if (query && query.documentIds && query.documentIds.length) {
      linkInstances = linkInstances.filter(linkInstance => linkInstance.documentIds.some(id => query.documentIds.includes(id)));
    }

    return Observable.of(linkInstances);
  }

}
