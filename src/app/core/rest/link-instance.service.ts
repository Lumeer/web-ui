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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {LocalStorage} from '../../shared/utils/local-storage';
import {LinkInstance, Query} from '../dto';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {Workspace} from '../store/navigation/workspace.model';

@Injectable()
export class LinkInstanceService {

  private workspace: Workspace;

  constructor(private httpClient: HttpClient,
              private store: Store<AppState>) {
    this.store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);
  }

  public createLinkInstance(linkInstance: LinkInstance): Observable<LinkInstance> {
    const linkInstances = LocalStorage.get(this.webStorageKey()) || {};

    linkInstance.id = String(Math.floor(Math.random() * 1000000000000000) + 1);
    linkInstances[linkInstance.id] = linkInstance;

    LocalStorage.set(this.webStorageKey(), linkInstances);

    return Observable.of(linkInstance);
  }

  public updateLinkInstance(id: string, linkInstance: LinkInstance): Observable<LinkInstance> {
    const linkInstances = LocalStorage.get(this.webStorageKey()) || {};

    linkInstances[id] = linkInstance;

    LocalStorage.set(this.webStorageKey(), linkInstances);

    return Observable.of(linkInstance);
  }

  public deleteLinkInstance(id: string): Observable<string> {
    const linkInstances = LocalStorage.get(this.webStorageKey()) || {};

    delete linkInstances[id];

    LocalStorage.set(this.webStorageKey(), linkInstances);

    return Observable.of(id);
  }

  public getLinkInstances(query: Query): Observable<LinkInstance[]> {
    const linkInstancesMap: { [id: string]: LinkInstance } = LocalStorage.get(this.webStorageKey()) || {};
    let linkInstances = Object.values(linkInstancesMap);

    if (query && query.linkTypeIds && query.linkTypeIds.length) {
      linkInstances = linkInstances.filter(linkInstance => query.linkTypeIds.includes(linkInstance.linkTypeId));
    }

    if (query && query.documentIds && query.documentIds.length) {
      linkInstances = linkInstances.filter(linkInstance => linkInstance.documentIds.some(id => query.documentIds.includes(id)));
    }

    return Observable.of(linkInstances);
  }

  private webStorageKey(): string {
    return `linkInstances-${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  private restApiPrefix(collectionCode: string): string {
    const organizationCode = this.workspace.organizationCode;
    const projectCode = this.workspace.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/link-instances`;
  }

}
