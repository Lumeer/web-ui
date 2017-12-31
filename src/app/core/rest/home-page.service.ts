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
import {switchMap} from 'rxjs/operators';
import {LocalStorage} from '../../shared/utils/local-storage';
import {Collection, Document} from '../dto';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';

import {Workspace} from '../store/navigation/workspace.model';

const LAST_USED_COLLECTIONS = 'lastUsedCollections';
const LAST_USED_DOCUMENTS = 'lastUsedDocuments';
const FAVORITE_COLLECTIONS = 'favoriteCollections';
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

  public getLastUsedCollections(): Observable<string[]> {
    return Observable.of(this.getForWorkspace(LAST_USED_COLLECTIONS));
  }

  public getFavoriteCollections(): Observable<string[]> {
    return Observable.of(this.getForWorkspace(FAVORITE_COLLECTIONS));
  }

  public addLastUsedDocument(collectionCode: string, id: string): Observable<boolean> {
    this.addItem(LAST_USED_DOCUMENTS, this.documentValue(collectionCode, id));
    return Observable.of(true);
  }

  public removeLastUsedDocument(collectionCode: string, id: string): Observable<boolean> {
    this.removeItem(LAST_USED_DOCUMENTS, this.documentValue(collectionCode, id));
    return Observable.of(true);
  }

  public removeLastUsedDocuments(collectionCode: string): Observable<boolean> {
    this.removeItem(LAST_USED_DOCUMENTS, collectionCode);
    return Observable.of(true);
  }

  public addFavoriteDocument(collectionCode: string, id: string): Observable<boolean> {
    this.addItem(FAVORITE_DOCUMENTS, this.documentValue(collectionCode, id));
    return Observable.of(true);
  }

  public removeFavoriteDocument(collectionCode: string, id: string): Observable<boolean> {
    this.removeItem(FAVORITE_DOCUMENTS, this.documentValue(collectionCode, id));
    return Observable.of(true);
  }

  public removeFavoriteDocuments(collectionCode: string): Observable<boolean> {
    this.removeItem(FAVORITE_DOCUMENTS, collectionCode);
    return Observable.of(true);
  }

  public addLastUsedCollection(code: string): Observable<boolean> {
    this.addItem(LAST_USED_COLLECTIONS, code);
    return Observable.of(true);
  }

  public removeLastUsedCollection(code: string): Observable<boolean> {
    this.removeItem(LAST_USED_COLLECTIONS, code);
    return Observable.of(true);
  }

  public addFavoriteCollection(code: string): Observable<boolean> {
    this.addItem(FAVORITE_COLLECTIONS, code);
    return Observable.of(true);
  }

  public removeFavoriteCollection(code: string): Observable<boolean> {
    this.removeItem(FAVORITE_COLLECTIONS, code);
    return Observable.of(true);
  }

  public checkFavoriteDocument(document: Document): Observable<Document> {
    return this.getFavoriteDocuments().pipe(
      switchMap(codes => {
        document.favorite = codes.includes(this.documentValue(document.collectionCode, document.id));
        return Observable.of(document);
      })
    );
  }

  public checkFavoriteDocuments(documents: Document[]): Observable<Document[]> {
    return this.getFavoriteDocuments().pipe(
      switchMap(codes => {
        for (let document of documents) {
          document.favorite = codes.includes(this.documentValue(document.collectionCode, document.id));
        }
        return Observable.of(documents);
      })
    );
  }

  public checkFavoriteCollection(collection: Collection): Observable<Collection> {
    return this.getFavoriteCollections().pipe(
      switchMap(codes => {
        collection.favorite = codes.includes(collection.code);
        return Observable.of(collection);
      })
    );
  }

  public checkFavoriteCollections(collections: Collection[]): Observable<Collection[]> {
    return this.getFavoriteCollections().pipe(
      switchMap(codes => {
        for (let collection of collections) {
          collection.favorite = codes.includes(collection.code);
        }
        return Observable.of(collections);
      })
    );
  }

  private addItem(param: string, code: string) {
    const resource = LocalStorage.get(param) || {};
    const workspaceKey = this.workspaceKey();
    let items = resource[workspaceKey] || [];
    items = items.filter(item => item !== code);
    items.unshift(code);
    if (items.length > MAX_SAVED_ITEMS) {
      items.splice(MAX_SAVED_ITEMS, items.length - MAX_SAVED_ITEMS);
    }
    resource[workspaceKey] = items;
    LocalStorage.set(param, resource);
  }

  private removeItem(param: string, code: string) {
    const resource = LocalStorage.get(param) || {};
    const workspaceKey = this.workspaceKey();
    let items = resource[workspaceKey] || [];
    items = items.filter(item => !item.startsWith(code));
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

  private documentValue(collectionCode: string, id: string) {
    return `${collectionCode} ${id}`;
  }

}
