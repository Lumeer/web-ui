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

import {Component, HostListener, NgZone, OnDestroy, OnInit} from '@angular/core';

import {Store} from '@ngrx/store';
import {filter, withLatestFrom} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {AppState} from '../../../core/store/app.state';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {selectDocumentsByCustomQuery} from '../../../core/store/documents/documents.state';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {PostItLayout} from '../../../shared/utils/layout/post-it-layout';
import {PostItLayoutConfig} from '../../../shared/utils/layout/post-it-layout-config';
import {PostItSortingLayout} from '../../../shared/utils/layout/post-it-sorting-layout';
import {PostItDocumentModel} from './document-data/post-it-document-model';
import {KeyCode} from '../../../shared/key-code';
import {HashCodeGenerator} from '../../../shared/utils/hash-code-generator';
import {selectCollectionsByQuery} from '../../../core/store/collections/collections.state';
import {selectCurrentUserForWorkspace} from '../../../core/store/users/users.state';
import {userRolesInResource} from '../../../shared/utils/resource.utils';
import {Role} from '../../../core/model/role';
import {CollectionModel} from '../../../core/store/collections/collection.model';
import {UserSettingsService} from '../../../core/user-settings.service';
import {SizeType} from '../../../shared/slider/size-type';
import {selectNavigation} from '../../../core/store/navigation/navigation.state';
import {Workspace} from '../../../core/store/navigation/workspace.model';
import {SelectionHelper} from './util/selection-helper';
import {DocumentUiService} from '../../../core/ui/document-ui.service';

@Component({
  selector: 'post-it-perspective',
  templateUrl: './post-it-perspective.component.html',
  styleUrls: ['./post-it-perspective.component.scss']
})
export class PostItPerspectiveComponent implements OnInit, OnDestroy {

  @HostListener('document:keydown', ['$event'])
  public onKeyboardClick(event: KeyboardEvent) {
    if (this.isNavigationKey(event.keyCode)) {
      this.handleNavigationKeydown();
    }
  }

  public perspectiveId = String(Math.floor(Math.random() * 1000000000000000) + 1);
  public collectionRoles: { [collectionId: string]: string[] };
  public postIts: PostItDocumentModel[] = [];
  public selectionHelper: SelectionHelper;
  public layoutManager: PostItLayout;
  public size: SizeType;

  private page = 0;
  private query: QueryModel;
  private workspace: Workspace;
  private subscriptions = new Subscription();
  private documentsSubscription = new Subscription();
  private collections: { [collectionId: string]: CollectionModel };

  constructor(private store: Store<AppState>,
              private zone: NgZone,
              private documentUiService: DocumentUiService,
              private userSettingsService: UserSettingsService) {
  }

  public ngOnInit(): void {
    this.initSettings();
    this.createLayoutManager();
    this.createSelectionHelper();
    this.subscribeData();
  }

  public ngOnDestroy(): void {
    if (this.documentsSubscription) {
      this.documentsSubscription.unsubscribe();
    }

    this.subscriptions.unsubscribe();
  }

  private handleNavigationKeydown() {
    if (this.selectionHelper) {
      this.selectionHelper.initializeIfNeeded();
    }
  }

  private isNavigationKey(keyCode: number): boolean {
    return [KeyCode.UpArrow, KeyCode.DownArrow, KeyCode.LeftArrow, KeyCode.RightArrow, KeyCode.Enter, KeyCode.Tab].includes(keyCode);
  }

  private createLayoutManager() {
    const config = new PostItLayoutConfig();
    config.layout.rounding = false;

    this.layoutManager = new PostItSortingLayout(
      '.post-it-document-layout',
      config,
      this.sortByOrder,
      'div[layout-item]',
      this.zone
    );
  }

  private createSelectionHelper() {
    this.selectionHelper = new SelectionHelper(() => this.postIts, () => this.collections, () => this.getNumberColumns(), this.documentUiService , this.perspectiveId);
  }

  private subscribeData() {
    this.subscribeCollections();
    this.subscribeNavigation();
    this.subscribeDocuments();
  }

  private subscribeCollections() {
    const collectionsSubscription = this.store.select(selectCollectionsByQuery).pipe(
      withLatestFrom(this.store.select(selectCurrentUserForWorkspace))
    ).subscribe(([collections, user]) => {
      this.collections = collections.reduce((acc, coll) => {
        acc[coll.id] = coll;
        return acc;
      }, {});
      this.collectionRoles = collections.reduce((roles, collection) => {
        roles[collection.id] = userRolesInResource(user, collection);
        return roles;
      }, {});
    });
    this.subscriptions.add(collectionsSubscription);
  }

  private subscribeNavigation() {
    const navigationSubscription = this.store.select(selectNavigation).pipe(
      filter(navigation => !!navigation.query && !!navigation.workspace)
    ).subscribe(navigation => {
      this.query = navigation.query;
      this.workspace = navigation.workspace;
      this.page = 0;
      this.postIts = [];
      this.fetchDocuments();
    });
    this.subscriptions.add(navigationSubscription);
  }

  private fetchDocuments() {
    this.store.dispatch(new DocumentsAction.Get({query: this.getPaginationQuery()}));
    this.subscribeDocuments();
  }

  private getPaginationQuery(): QueryModel {
    return {...this.query, page: this.page, pageSize: this.getPageSize()};
  }

  private getPageSize(): number {
    return this.getNumberColumns() * 5;
  }

  private subscribeDocuments() {
    if (this.documentsSubscription) {
      this.documentsSubscription.unsubscribe();
    }
    const pageSize = this.getPageSize() * (this.page + 1);
    const query = {...this.query, page: 0, pageSize};
    this.documentsSubscription = this.store.select(selectDocumentsByCustomQuery(query)).pipe(
      filter(documents => !!documents)
    ).subscribe(documents => {
      this.postIts = [];
      this.postIts = documents.map(doc => ({document: doc, order: 0}));
    });
  }

  public createPostIt(documentModel: DocumentModel) {
    this.store.dispatch(new DocumentsAction.Create({document: documentModel}));
  }

  public postItWithIndex(postIt: PostItDocumentModel, index: number): PostItDocumentModel {
    postIt.order = index;
    return postIt;
  }

  public hasSingleCollection(): boolean {
    return this.getCollectionIds().length === 1;
  }

  public hasCreateRights(): boolean {
    const keys = this.getCollectionIds();
    return keys.length === 1 && this.collectionRoles[keys[0]].includes(Role.Write);
  }

  private getCollectionIds(): string[] {
    return this.collections && Object.keys(this.collections) || [];
  }

  public onScrollDown(event) {
    this.loadNextPage();
  }

  private loadNextPage() {
    this.page++;
    this.fetchDocuments();
  }

  public postItChanged() {
    this.layoutManager.refresh();
  }

  public removePostIt(postIt: PostItDocumentModel) {
    if (postIt.document.id) {
      this.store.dispatch(new DocumentsAction.DeleteConfirm({
        collectionId: postIt.document.collectionId,
        documentId: postIt.document.id
      }));

    } else {
      this.postIts.splice(postIt.order, 1);
    }
  }

  public getCollection(postIt: PostItDocumentModel): CollectionModel {
    const collectionId = postIt && postIt.document && postIt.document.collectionId;
    return collectionId && this.collections[collectionId];
  }

  public getCollectionRoles(postIt: PostItDocumentModel): string[] {
    return this.collectionRoles && this.collectionRoles[postIt.document.collectionId] || [];
  }

  private sortByOrder(item: any, element: HTMLElement): number {
    return Number(element.getAttribute('order'));
  }

  public trackByDocument(index: number, postIt: PostItDocumentModel): number {
    return HashCodeGenerator.hashString(postIt.document.correlationId || postIt.document.id);
  }

  public getColumnStyle(): string {
    switch (this.size) {
      case SizeType.S:
        return 'col-2';
      case SizeType.M:
        return 'col-3';
      case SizeType.L:
        return 'col-4';
      case SizeType.XL:
        return 'col-6';
      default:
        return 'col-3';
    }
  }

  public getNumberColumns(): number {
    switch (this.size) {
      case SizeType.S:
        return 6;
      case SizeType.M:
        return 4;
      case SizeType.L:
        return 3;
      case SizeType.XL:
        return 2;
      default:
        return 4;
    }
  }

  public onSizeChange(newSize: SizeType) {
    this.size = newSize;
    let userSettings = this.userSettingsService.getUserSettings();
    userSettings.searchSize = newSize;
    this.userSettingsService.updateUserSettings(userSettings);

    this.layoutManager.refresh();
  }

  private initSettings() {
    let userSettings = this.userSettingsService.getUserSettings();
    this.size = userSettings.searchSize ? userSettings.searchSize : SizeType.M;
  }

}
