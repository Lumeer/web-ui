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

import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';

import {CollectionService} from '../rest/collection.service';
import {DocumentService} from '../rest/document.service';
import {Document, Collection} from '../dto';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {Workspace} from '../store/navigation/workspace.model';
import {Router} from '@angular/router';
import {Query} from "app/core/dto/query";
import {QueryConverter} from '../../shared/utils/query-converter';
import {map, switchMap} from 'rxjs/operators';
import {Observable} from 'rxjs/Observable';
import {SearchDocument} from '../../view/perspectives/search/documents/search-document';

@Component({
  selector: 'search-home',
  templateUrl: './search-home.component.html',
  styleUrls: ['./search-home.component.scss']
})
export class SearchHomeComponent implements OnInit {

  public lastUsedDocuments: SearchDocument[];
  public favoriteDocuments: SearchDocument[];
  public lastUsedCollections: Collection[];
  public favoriteCollections: Collection[];

  private workspace: Workspace;

  constructor(private collectionService: CollectionService,
              private store: Store<AppState>,
              private documentService: DocumentService,
              private router: Router) {
  }

  public ngOnInit() {
    this.store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);
    this.collectionService.getLastUsedCollections()
      .subscribe(collections => this.lastUsedCollections = collections);
    this.documentService.getLastUsedDocuments()
      .pipe(
        switchMap(documents => this.fetchCollectionsForDocuments(documents))
      ).subscribe(documents => this.lastUsedDocuments = documents);
    this.collectionService.getFavoriteCollections()
      .subscribe(collections => this.favoriteCollections = collections);
    this.documentService.getFavoriteDocuments()
      .pipe(
        switchMap(documents => this.fetchCollectionsForDocuments(documents))
      ).subscribe(documents => this.favoriteDocuments = documents);
  }

  public defaultAttribute(document: SearchDocument): string {
    return document && document.document && document.document.data ? Object.values(document.document.data)[0] : '';
  }

  private fetchCollectionsForDocuments(documents: Document[]): Observable<SearchDocument[]> {
    const docs: SearchDocument[] = documents.map(doc => this.convertToSearchDocument(doc));
    const collectionCodes = Array.from(new Set(documents.map(doc => doc.collectionCode)));
    const observables = collectionCodes.map(code => this.collectionService.getCollection(code));
    return Observable.combineLatest(observables)
      .pipe(
        map(collections => this.initCollectionsInDocuments(collections, docs))
      );
  }

  private initCollectionsInDocuments(collections: Collection[], documents: SearchDocument[]): SearchDocument[] {
    for (let collection of collections) {
      for (let document of documents) {
        if (document.document.collectionCode === collection.code) {
          document.collectionIcon = collection.icon;
          document.collectionName = collection.name;
          document.collectionColor = collection.color;
        }
      }
    }
    return documents;
  }

  private convertToSearchDocument(document: Document): SearchDocument {
    delete document.data['_id'];
    return {document: document};
  }

  public workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  public documentsQuery(collectionCode: string): string {
    const query: Query = {collectionCodes: [collectionCode]};
    return QueryConverter.toString(query);
  }

}
