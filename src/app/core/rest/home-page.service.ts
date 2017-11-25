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

import {Workspace} from '../store/navigation/workspace.model';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {Observable} from 'rxjs/Observable';
import {LocalStorage} from '../../shared/utils/local-storage';
import {Collection} from '../dto';

const LAST_USED = 'lastUsed';
const FAVORITE = 'favorite';
const LAST_USED_COLLECTIONS = 'lastUsedCollections';
const LAST_USED_DOCUMENTS = 'lastUsedDocuments';
const FAVORITE_COLLECTIONS = 'lastUsedCollections';
const FAVORITE_DOCUMENTS = 'lastUsedDocuments';

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

  public addLastUsedDocument(code: string): Observable<boolean> {
    this.addItem(LAST_USED_DOCUMENTS, code);
    return Observable.of(true);
  }

  public removeLastUsedDocument(code: string): Observable<boolean> {
    this.removeItem(LAST_USED_DOCUMENTS, code);
    return Observable.of(true);
  }

  public addFavoriteDocument(code: string): Observable<boolean> {
    this.addItem(FAVORITE_DOCUMENTS, code);
    return Observable.of(true);
  }

  public removeFavoriteDocument(code: string): Observable<boolean> {
    this.removeItem(FAVORITE_DOCUMENTS, code);
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

  private addItem(param: string, code: string) {
    const lastUsed = LocalStorage.get(LAST_USED) || [];
    const orgItem = lastUsed.find(item => item.organization === this.workspace.organizationCode) || [];
    const projItem = orgItem.find(item => item.project === this.workspace.projectCode);
    if (projItem && projItem.hasOwnProperty(param)) {
      let array: string[] = projItem[param];
      array = array.filter(item => item !== code);
      array.unshift(code);
      if (array.length > 10) {
        array.splice(10, array.length - 10)
      }
      LocalStorage.set(LAST_USED, lastUsed);
    }
  }

  private removeItem(param: string, code: string) {
    const lastUsed = LocalStorage.get(LAST_USED) || [];
    const orgItem = lastUsed.find(item => item.organization === this.workspace.organizationCode) || [];
    const projItem = orgItem.find(item => item.project === this.workspace.projectCode);
    if (projItem && projItem.hasOwnProperty(param)) {
      projItem[param] = projItem[param].filter(cd => cd !== code);
      LocalStorage.set(LAST_USED, lastUsed);
    }
  }

  private getForWorkspace(param: string): string[] {
    const lastUsed = LocalStorage.get(LAST_USED) || [];
    const orgItem = lastUsed.find(item => item.organization === this.workspace.organizationCode) || [];
    const projItem = orgItem.find(item => item.project === this.workspace.projectCode);
    return projItem && projItem.hasOwnProperty(param) ? projItem[param] : [];
  }

}
