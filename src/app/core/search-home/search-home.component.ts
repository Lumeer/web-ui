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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';

import {CollectionService} from '../rest/collection.service';
import {DocumentService} from '../rest/document.service';
import {Document, Collection} from '../dto';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {Workspace} from '../store/navigation/workspace.model';
import {Router} from '@angular/router';
import {Query} from 'app/core/dto/query';
import {QueryConverter} from '../../core/store/navigation/query.converter';
import {first, map, switchMap} from 'rxjs/operators';
import {Observable} from 'rxjs/Observable';
import {SearchDocument} from '../../view/perspectives/search/documents/search-document';
import {Subscription} from 'rxjs/Subscription';
import {selectAllCollections, selectCollectionsDictionary} from "../store/collections/collections.state";
import {Dictionary} from "@ngrx/entity/src/models";
import {CollectionModel} from "../store/collections/collection.model";
import {DocumentModel} from "../store/documents/document.model";
import {CollectionConverter} from "../store/collections/collection.converter";
import {DocumentConverter} from "../store/documents/document.converter";

@Component({
  selector: 'search-home',
  templateUrl: './search-home.component.html',
  styleUrls: ['./search-home.component.scss']
})
export class SearchHomeComponent implements OnInit, OnDestroy {

  public lastUsedDocuments: DocumentModel[];
  public favoriteDocuments: DocumentModel[];
  public lastUsedCollections: CollectionModel[];
  public favoriteCollections: CollectionModel[];

  private workspace: Workspace;
  private workspaceSubscription: Subscription;

  constructor(private collectionService: CollectionService,
              private store: Store<AppState>,
              private documentService: DocumentService) {
  }

  public ngOnInit() {
    this.subscribeData();
  }

  public ngOnDestroy() {
    if (this.workspaceSubscription) {
      this.workspaceSubscription.unsubscribe();
    }
  }

  public defaultAttribute(document: DocumentModel): string {
    return document && document.data ? Object.values(document.data)[0] : '';
  }

  private subscribeData() {
    this.workspaceSubscription = this.store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);
    this.collectionService.getLastUsedCollections()
      .subscribe(collections => this.lastUsedCollections = collections);
    this.collectionService.getFavoriteCollections()
      .subscribe(collections => this.favoriteCollections = collections);

    Observable.combineLatest(
      this.documentService.getLastUsedDocuments(),
      this.documentService.getFavoriteDocuments(),
      this.store.select(selectCollectionsDictionary).pipe(first())
    ).subscribe(([lastUsedDocuments, favoriteDocuments, collections]) => this.initDocumentsWithCollections(lastUsedDocuments, favoriteDocuments, collections))
  }

  private initDocumentsWithCollections(lastUsedDocuments: Document[], favoriteDocuments: Document[], collections: Dictionary<CollectionModel>) {
    this.lastUsedDocuments = this.mapDocumentsWithCollections(lastUsedDocuments, collections);
    this.favoriteDocuments = this.mapDocumentsWithCollections(favoriteDocuments, collections);
  }

  private mapDocumentsWithCollections(documents: Document[], collections: Dictionary<CollectionModel>): DocumentModel[] {
    return documents.map(document => {
        let documentModel = DocumentConverter.fromDto(document);
        documentModel.collection = collections[documentModel.collectionId];
        return documentModel;
    });
  }

  public workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  public documentsQuery(collectionId: string): string {
    const query: Query = {collectionIds: [collectionId]};
    return QueryConverter.toString(query);
  }

}
