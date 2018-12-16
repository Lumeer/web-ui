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

import {Component, Input, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';

import {Store} from '@ngrx/store';
import {Observable, Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {AppState} from '../../../../core/store/app.state';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {selectCurrentQueryDocumentsLoaded} from '../../../../core/store/documents/documents.state';
import {selectNavigation} from '../../../../core/store/navigation/navigation.state';
import {ViewsAction} from '../../../../core/store/views/views.action';
import {selectViewSearchConfig} from '../../../../core/store/views/views.state';
import {UserSettingsService} from '../../../../core/service/user-settings.service';
import {SizeType} from '../../../../shared/slider/size-type';
import {Collection} from '../../../../core/store/collections/collection';
import {
  selectCollectionsByQuery,
  selectDocumentsByCustomQuery,
} from '../../../../core/store/common/permissions.selectors';
import {PerspectiveService} from '../../../../core/service/perspective.service';
import {Perspective} from '../../perspective';
import {convertQueryModelToString} from '../../../../core/store/navigation/query.converter';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {Router} from '@angular/router';
import {searchDocumentEntriesHtml, searchDocumentValuesHtml} from './search-document-html-helper';
import {Query} from '../../../../core/store/navigation/query';

const PAGE_SIZE = 40;

@Component({
  selector: 'search-documents',
  templateUrl: './search-documents.component.html',
  styleUrls: ['./search-documents.component.scss'],
})
export class SearchDocumentsComponent implements OnInit, OnDestroy {
  @Input()
  public maxLines: number = -1;

  @ViewChild('sTemplate')
  private sTempl: TemplateRef<any>;

  @ViewChild('mTemplate')
  private mTempl: TemplateRef<any>;

  @ViewChild('lTemplate')
  private lTempl: TemplateRef<any>;

  @ViewChild('xlTemplate')
  private xlTempl: TemplateRef<any>;

  public size: SizeType;
  public documentsMap: {[documentId: string]: DocumentModel};
  public expandedDocumentIds: string[] = [];
  public collectionsMap: {[collectionId: string]: Collection};
  public documentsOrder: string[] = [];
  public loaded$: Observable<boolean>;
  public query: Query;

  private page = 0;
  private workspace: Workspace;
  private subscriptions = new Subscription();
  private documentsSubscription = new Subscription();

  constructor(
    private store: Store<AppState>,
    private router: Router,
    private userSettingsService: UserSettingsService,
    private perspectiveService: PerspectiveService
  ) {}

  public ngOnInit() {
    this.initSettings();
    this.subscribeData();
  }

  public ngOnDestroy() {
    this.documentsSubscription.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  public getDocuments(): DocumentModel[] {
    return Object.values(this.documentsMap);
  }

  public onSizeChange(newSize: SizeType) {
    this.size = newSize;
    const userSettings = this.userSettingsService.getUserSettings();
    userSettings.searchSize = newSize;
    this.userSettingsService.updateUserSettings(userSettings);
  }

  public getTemplate(document: DocumentModel): TemplateRef<any> {
    if (this.isDocumentExplicitlyExpanded(document)) {
      return this.xlTempl;
    }
    switch (this.size) {
      case SizeType.S:
        return this.sTempl;
      case SizeType.M:
        return this.mTempl;
      case SizeType.L:
        return this.lTempl;
      case SizeType.XL:
        return this.xlTempl;
      default:
        return this.mTempl;
    }
  }

  private isDocumentExplicitlyExpanded(document: DocumentModel): boolean {
    return this.expandedDocumentIds.includes(document.id);
  }

  public toggleDocument(document: DocumentModel) {
    const newIds = this.isDocumentExplicitlyExpanded(document)
      ? this.expandedDocumentIds.filter(id => id !== document.id)
      : [...this.expandedDocumentIds, document.id];
    this.store.dispatch(new ViewsAction.ChangeSearchConfig({config: {expandedDocumentIds: newIds}}));
  }

  public onScrollDown(event: any) {
    this.page++;
    this.fetchDocuments();
  }

  public onDetailClick(document: DocumentModel) {
    this.perspectiveService.switchPerspective(Perspective.Detail, this.collectionsMap[document.collectionId], document);
  }

  public switchPerspectiveToTable() {
    this.perspectiveService.switchPerspective(Perspective.Table);
  }

  public createValuesHtml(document: DocumentModel): string {
    const collection = this.collectionsMap[document.collectionId];
    return searchDocumentValuesHtml(document, collection);
  }

  public createEntriesHtml(document: DocumentModel): string {
    const collection = this.collectionsMap[document.collectionId];
    return searchDocumentEntriesHtml(document, collection, this.isDocumentExpanded(document));
  }

  private isDocumentExpanded(document: DocumentModel): boolean {
    return this.isDocumentExplicitlyExpanded(document) || this.size === SizeType.XL;
  }

  public trackByDocument(index: number, document: DocumentModel): string {
    return document.id;
  }

  public onShowAll() {
    this.router.navigate([this.workspacePath(), 'view', Perspective.Search, 'records'], {
      queryParams: {query: convertQueryModelToString(this.query)},
    });
  }

  private workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  private initSettings() {
    const userSettings = this.userSettingsService.getUserSettings();
    this.size = userSettings.searchSize ? userSettings.searchSize : SizeType.M;
  }

  public getCollections() {
    return this.collectionsMap ? Object.values(this.collectionsMap) : [];
  }

  private subscribeData() {
    const navigationSubscription = this.store
      .select(selectNavigation)
      .pipe(filter(navigation => !!navigation.workspace && !!navigation.query))
      .subscribe(navigation => {
        this.workspace = navigation.workspace;
        this.query = navigation.query;
        this.clearData();
        this.fetchDocuments();
      });
    this.subscriptions.add(navigationSubscription);

    const searchConfigSubscription = this.store
      .select(selectViewSearchConfig)
      .subscribe(config => (this.expandedDocumentIds = (config && config.expandedDocumentIds.slice()) || []));
    this.subscriptions.add(searchConfigSubscription);

    this.loaded$ = this.store.select(selectCurrentQueryDocumentsLoaded);

    const collectionSubscription = this.store.select(selectCollectionsByQuery).subscribe(
      collections =>
        (this.collectionsMap = collections.reduce((acc, coll) => {
          acc[coll.id] = coll;
          return acc;
        }, {}))
    );
    this.subscriptions.add(collectionSubscription);
  }

  private clearData() {
    this.page = 0;
    this.documentsMap = {};
    this.documentsOrder = [];
  }

  private fetchDocuments() {
    this.store.dispatch(new DocumentsAction.Get({query: this.getPaginationQuery()}));
    this.subscribeDocuments();
  }

  private getPaginationQuery(): Query {
    return {...this.query, page: this.page, pageSize: PAGE_SIZE};
  }

  private subscribeDocuments() {
    this.documentsSubscription.unsubscribe();
    const pageSize = PAGE_SIZE * (this.page + 1);
    const query = {...this.query, page: 0, pageSize};
    this.documentsSubscription = this.store
      .select(selectDocumentsByCustomQuery(query, true))
      .pipe(filter(documents => !!documents))
      .subscribe(documents => {
        this.mapNewDocuments(documents);
      });
  }

  private mapNewDocuments(documents: DocumentModel[]) {
    const documentsMap = documents.reduce((acc, doc) => {
      acc[doc.correlationId || doc.id] = doc;
      return acc;
    }, {});

    const newDocumentsMap = this.documentsOrder.reduce((acc, key) => {
      const doc = documentsMap[key];
      if (doc) {
        acc[key] = doc;
        delete documentsMap[key];
      }
      return acc;
    }, {});

    for (const [key, value] of Object.entries(documentsMap)) {
      newDocumentsMap[key] = value;
      this.documentsOrder.push(key);
    }

    this.documentsMap = newDocumentsMap;
  }
}
