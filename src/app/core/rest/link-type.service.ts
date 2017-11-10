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
import {HttpClient, HttpErrorResponse, HttpEvent} from '@angular/common/http';

import {WorkspaceService} from '../workspace.service';
import {LumeerError} from '../error/lumeer.error';
import {LinkType} from '../dto/link-type';
import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import {CollectionService} from './collection.service';
import {LocalStorage} from '../../shared/utils/local-storage';

const LINK_TYPES = 'linkTypes';

// TODO implement on backend
@Injectable()
export class LinkTypeService {

  public links: LinkType[] = [];

  private names = ['Clouds placement', 'Seasons in the Sun', 'Pollution clouds'];

  constructor(private httpClient: HttpClient,
              private workspaceService: WorkspaceService,
              private collectionService: CollectionService /* Remove when after backend implementation*/) {
    this.collectionService.getCollections().subscribe(
      collections => this.links = collections.map(collection => {
        return {
          fromCollection: '',
          toCollection: collection.code,
          name: this.names[collection.name.length % this.names.length],
          linkedAttributes: []
        };
      })
    );
  }

  public getLinkTypesDeprecated(collectionCode: string): Observable<LinkType[]> {
    return Observable.of(this.links.map(link => (link.fromCollection = collectionCode) && link)
      .filter(linkType => collectionCode !== linkType.toCollection));
  }

  public createLinkTypeDeprecated(collectionCode: string, linkType: LinkType): Observable<LinkType> {
    this.links.push(linkType);
    return Observable.of(linkType);
  }

  public updateLinkTypeDeprecated(collectionCode: string, initialName: string, linkType: LinkType): Observable<LinkType> {
    this.links[this.links.findIndex(link => link.name === initialName)] = linkType;
    return Observable.of(linkType);
  }

  public removeLinkTypeDeprecated(collectionCode: string, linkType: LinkType): Observable<HttpEvent<any>> {
    this.links = this.links.filter(link => link.name !== linkType.name);
    return Observable.of(null);
  }

  private static handleGlobalError(error: HttpErrorResponse): ErrorObservable {
    throw new LumeerError(error.message);
  }

  private apiPrefix(collectionCode: string): string {
    const organizationCode = this.workspaceService.organizationCode;
    const projectCode = this.workspaceService.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/c/${collectionCode}/linktypes`;
  }

  // --- NEW METHODS ---

  public createLinkType(linkType: LinkType): Observable<string> {
    const linkTypes = LocalStorage.get(LINK_TYPES) || {};

    linkType.id = String(Math.floor(Math.random() * 1000000000000000) + 1);
    linkTypes[linkType.id] = linkType;

    LocalStorage.set(LINK_TYPES, linkTypes);

    return Observable.of(linkType.id);
  }

  public updateLinkType(id: string, linkType: LinkType): Observable<LinkType> {
    const linkTypes = LocalStorage.get(LINK_TYPES) || {};

    linkTypes[id] = linkType;

    LocalStorage.set(LINK_TYPES, linkTypes);

    return Observable.of(linkType);
  }

  public deleteLinkType(id: string): Observable<any> {
    const linkTypes = LocalStorage.get(LINK_TYPES) || {};

    delete linkTypes[id];

    LocalStorage.set(LINK_TYPES, linkTypes);

    return Observable.of({});
  }

  public getLinkTypeById(id: string): Observable<LinkType> {
    const linkTypes = LocalStorage.get(LINK_TYPES) || {};

    return Observable.of(linkTypes[id]);
  }

  public getLinkTypesByCollections(...collectionCodes: string[]): Observable<LinkType[]> {
    const linkTypes: { [id: string]: LinkType } = LocalStorage.get(LINK_TYPES) || {};

    const results = Object.values(linkTypes).filter(linkType => collectionCodes.includes(linkType.collectionCodes[0]) || collectionCodes.includes(linkType.collectionCodes[1]));
    return Observable.of(results);
  }

}
