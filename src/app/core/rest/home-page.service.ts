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
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {mergeMap} from 'rxjs/operators';
import {LocalStorage} from '../../shared/utils/local-storage';
import {Collection, Document} from '../dto';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';

import {Workspace} from '../store/navigation/workspace.model';

const LAST_USED_DOCUMENTS = 'lastUsedDocuments';
const FAVORITE_DOCUMENTS = 'favoriteDocuments';

const MAX_SAVED_ITEMS = 10;
const MAX_RETURN_ITEMS = 5;

@Injectable()
export class HomePageService {

  private workspace: Workspace;

  constructor(protected store: Store<AppState>) {
    this.store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);
  }

  public getLastUsedDocuments(): Observable<string[]> {
    return Observable.of(this.getForWorkspace(LAST_USED_DOCUMENTS));
  }

  public getFavoriteDocuments(): Observable<string[]> {
    return Observable.of(this.getForWorkspace(FAVORITE_DOCUMENTS));
  }

  public addLastUsedDocument(collectionId: string, id: string): Observable<boolean> {
    this.addItem(LAST_USED_DOCUMENTS, this.documentValue(collectionId, id));
    return Observable.of(true);
  }

  public removeLastUsedDocument(collectionId: string, id: string): Observable<boolean> {
    this.removeItem(LAST_USED_DOCUMENTS, this.documentValue(collectionId, id));
    return Observable.of(true);
  }

  public removeLastUsedDocuments(collectionId: string): Observable<boolean> {
    this.removeItem(LAST_USED_DOCUMENTS, collectionId);
    return Observable.of(true);
  }

  public addFavoriteDocument(collectionId: string, id: string): Observable<boolean> {
    this.addItem(FAVORITE_DOCUMENTS, this.documentValue(collectionId, id));
    return Observable.of(true);
  }

  public removeFavoriteDocument(collectionId: string, id: string): Observable<boolean> {
    this.removeItem(FAVORITE_DOCUMENTS, this.documentValue(collectionId, id));
    return Observable.of(true);
  }

  public removeFavoriteDocuments(collectionId: string): Observable<boolean> {
    this.removeItem(FAVORITE_DOCUMENTS, collectionId);
    return Observable.of(true);
  }

  public checkFavoriteDocument(document: Document): Observable<Document> {
    return this.getFavoriteDocuments().pipe(
      mergeMap(codes => {
        document.favorite = codes.includes(this.documentValue(document.collectionId, document.id));
        return Observable.of(document);
      })
    );
  }

  public checkFavoriteDocuments(documents: Document[]): Observable<Document[]> {
    return this.getFavoriteDocuments().pipe(
      mergeMap(codes => {
        for (let document of documents) {
          document.favorite = codes.includes(this.documentValue(document.collectionId, document.id));
        }
        return Observable.of(documents);
      })
    );
  }

  private addItem(param: string, id: string) {
    const resource = LocalStorage.get(param) || {};
    const workspaceKey = this.workspaceKey();
    let items = resource[workspaceKey] || [];
    items = items.filter(item => item !== id);
    items.unshift(id);
    if (items.length > MAX_SAVED_ITEMS) {
      items.splice(MAX_SAVED_ITEMS, items.length - MAX_SAVED_ITEMS);
    }
    resource[workspaceKey] = items;
    LocalStorage.set(param, resource);
  }

  private removeItem(param: string, id: string) {
    const resource = LocalStorage.get(param) || {};
    const workspaceKey = this.workspaceKey();
    let items = resource[workspaceKey] || [];
    items = items.filter(item => !item.startsWith(id));
    resource[workspaceKey] = items;
    LocalStorage.set(param, resource);
  }

  private getForWorkspace(param: string): string[] {
    const resource = LocalStorage.get(param) || {};
    const items = resource[this.workspaceKey()] || [];
    return items.slice(0, Math.min(MAX_RETURN_ITEMS, items.length));
  }

  private workspaceKey(): string {
    return `${this.workspace.organizationCode}-${this.workspace.projectCode}`;
  }

  private documentValue(collectionId: string, id: string) {
    return `${collectionId} ${id}`;
  }

}
