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

import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import {Store} from '@ngrx/store';
import {filter, map, mergeMap, take, tap, withLatestFrom} from 'rxjs/operators';
import {Subscription, combineLatest as observableCombineLatest} from 'rxjs';
import {AppState} from '../../../core/store/app.state';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {selectCurrentQueryDocumentsLoaded} from '../../../core/store/documents/documents.state';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {PostItLayout} from '../../../shared/utils/layout/post-it-layout';
import {selectCollectionsByQuery, selectDocumentsByCustomQuery} from '../../../core/store/common/permissions.selectors';
import {CollectionModel} from '../../../core/store/collections/collection.model';
import {UserSettingsService} from '../../../core/service/user-settings.service';
import {SizeType} from '../../../shared/slider/size-type';
import {selectNavigation} from '../../../core/store/navigation/navigation.state';
import {Workspace} from '../../../core/store/navigation/workspace.model';
import {SelectionHelper} from './util/selection-helper';
import {DocumentUiService} from '../../../core/ui/document-ui.service';
import {Observable, BehaviorSubject} from 'rxjs';
import {selectCurrentView} from '../../../core/store/views/views.state';
import {PostItConfigModel, ViewModel} from '../../../core/store/views/view.model';
import {PostItAction} from '../../../core/store/postit/postit.action';
import {selectPostItsOrder, selectPostItsSize} from '../../../core/store/postit/postit.state';
import {CanManageConfigPipe} from '../../../shared/pipes/permissions/can-manage-config.pipe';

@Component({
  selector: 'post-it-perspective',
  templateUrl: './post-it-perspective.component.html',
  styleUrls: ['./post-it-perspective.component.scss'],
})
export class PostItPerspectiveComponent implements OnInit, OnDestroy {
  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: any) {
    const id = event.target.id || '';
    const parent = event.target.parentElement;
    const idParent = (parent && parent.id) || '';

    if (!id.startsWith(this.perspectiveId) && !idParent.startsWith(this.perspectiveId)) {
      this.selectionHelper.clearSelection();
    }
  }

  @ViewChild('postItLayout')
  set content(content: ElementRef) {
    if (content) {
      this.postItLayout = content;
      this.createLayout();
    } else {
      this.destroyLayout();
    }
  }

  public perspectiveId = String(Math.floor(Math.random() * 1000000000000000) + 1);
  public collections: CollectionModel[];
  public selectionHelper: SelectionHelper;
  public layout: PostItLayout;
  public size$ = new BehaviorSubject<SizeType>(this.defaultSize());
  public postItsOrder$ = new BehaviorSubject<string[]>([]);
  public query: QueryModel;
  public loaded$: Observable<boolean>;
  public canManageConfig = false;
  public documents: DocumentModel[];

  private postItLayout: ElementRef;
  private page = 0;
  private workspace: Workspace;
  private subscriptions = new Subscription();
  private documentsSubscription = new Subscription();

  private creatingCorrelationsIds: string[] = [];

  constructor(
    private store: Store<AppState>,
    private zone: NgZone,
    private canManageConfigPipe: CanManageConfigPipe,
    private changeDetector: ChangeDetectorRef,
    private documentUiService: DocumentUiService,
    private userSettingsService: UserSettingsService
  ) {}

  public ngOnInit(): void {
    this.createSelectionHelper();
    this.subscribeData();
  }

  public ngOnDestroy(): void {
    this.documentsSubscription.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  private destroyLayout() {
    this.layout = null;
  }

  private createLayout() {
    if (!this.layout) {
      this.layout = new PostItLayout(this.postItLayout, this.canManageConfig, this.zone, orderedIds =>
        this.onPostItOrderChanged(orderedIds)
      );
      this.changeDetector.detectChanges();
      this.layout.setOrder(this.postItsOrder$.getValue());
    }
  }

  private onPostItOrderChanged(orderedIds: string[]) {
    this.store.dispatch(new PostItAction.ChangeOrder({documentIdsOrder: orderedIds}));
  }

  private createSelectionHelper() {
    this.selectionHelper = new SelectionHelper(
      this.postItsOrder$,
      (key: string) => this.getNumRows(key),
      () => this.getNumberColumns(),
      this.perspectiveId
    );
  }

  private getNumberColumns(): number {
    switch (this.size$.getValue()) {
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

  private subscribeData() {
    this.initConfig();
    this.subscribeCollections();
    this.subscribeNavigation();
    this.subscribeToConfig();
    this.subscribeToView();
    this.loaded$ = this.store.select(selectCurrentQueryDocumentsLoaded);
  }

  private initConfig() {
    const subscription = this.store
      .select(selectCurrentView)
      .pipe(
        filter(view => !!view),
        take(1)
      )
      .subscribe(view => {
        if (view.config && view.config.postit) {
          this.dispatchInitConfigActions(view.config.postit);
        }
      });
    this.subscriptions.add(subscription);
  }

  private dispatchInitConfigActions(postItConfig: PostItConfigModel) {
    this.store.dispatch(new PostItAction.ChangeSize({size: postItConfig.size}));
    this.store.dispatch(new PostItAction.ChangeOrder({documentIdsOrder: postItConfig.documentIdsOrder}));
  }

  private subscribeToConfig() {
    this.subscriptions.add(
      observableCombineLatest(this.store.select(selectPostItsSize), this.store.select(selectCurrentView))
        .pipe(
          map(([size, view]) => size || this.viewPostItSize(view)),
          tap(size => (!size ? this.store.dispatch(new PostItAction.ChangeSize({size: this.defaultSize()})) : null)),
          filter(size => size && this.size$.getValue() !== size)
        )
        .subscribe(size => {
          this.size$.next(size);
          if (this.layout) {
            this.layout.refresh();
          }
        })
    );

    this.subscriptions.add(this.store.select(selectPostItsOrder).subscribe(order => this.postItsOrder$.next(order)));
  }

  private viewPostItSize(view: ViewModel): SizeType | null {
    return (view && view.config && view.config.postit && view.config.postit.size) || null;
  }

  private subscribeCollections() {
    const collectionsSubscription = this.store
      .select(selectCollectionsByQuery)
      .subscribe(collections => (this.collections = collections));
    this.subscriptions.add(collectionsSubscription);
  }

  private subscribeNavigation() {
    const navigationSubscription = this.store
      .select(selectNavigation)
      .pipe(filter(navigation => !!navigation.query && !!navigation.workspace))
      .subscribe(navigation => {
        this.query = navigation.query;
        this.workspace = navigation.workspace;
        this.clearData();
        this.fetchDocuments();
      });
    this.subscriptions.add(navigationSubscription);
  }

  private clearData() {
    this.page = 0;
    this.postItsOrder$.next([]);
    this.creatingCorrelationsIds = [];
    this.documents = [];
  }

  private subscribeToView() {
    const subscription = this.store
      .select(selectCurrentView)
      .pipe(mergeMap(view => this.canManageConfigPipe.transform(view)))
      .subscribe(viewHasManageRole => {
        this.canManageConfig = viewHasManageRole;
        if (this.layout) {
          this.layout.setDrag(viewHasManageRole);
        }
      });
    this.subscriptions.add(subscription);
  }

  private getNumRows(key: string): number {
    const documentModel = this.documents.find(doc => doc.id === key);
    if (documentModel) {
      const collection = this.collections.find(coll => coll.id === documentModel.collectionId);
      return this.documentUiService.getRows$(collection, documentModel).getValue().length - 1;
    } else {
      return 0;
    }
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
    this.documentsSubscription = this.store
      .select(selectDocumentsByCustomQuery(query, true))
      .pipe(
        filter(documents => !!documents),
        withLatestFrom(this.store.select(selectCurrentView))
      )
      .subscribe(([documents, view]) => {
        if (view && view.config && view.config.postit) {
          this.mapNewDocumentsWithConfig(documents, view.config.postit);
        } else {
          this.mapNewDocuments(documents);
        }
      });
  }

  private mapNewDocuments(documents: DocumentModel[]) {
    this.mapNewDocumentsWithPriority(documents, []);
  }

  private mapNewDocumentsWithConfig(documents: DocumentModel[], config: PostItConfigModel) {
    this.mapNewDocumentsWithPriority(documents, config.documentIdsOrder);
  }

  private mapNewDocumentsWithPriority(documents: DocumentModel[], priorityIds: string[]) {
    const documentsMap = documents.reduce((acc, doc) => {
      acc[doc.id] = doc;
      return acc;
    }, {});

    const newOrderIds = [];

    documents
      .filter(doc => doc.correlationId && this.creatingCorrelationsIds.includes(doc.correlationId))
      .forEach(document => {
        newOrderIds.push(document.id);
        delete documentsMap[document.id];
        this.creatingCorrelationsIds = this.creatingCorrelationsIds.filter(corrId => corrId !== document.correlationId);
      });

    this.postItsOrder$.getValue().forEach(id => {
      const doc = documentsMap[id];
      if (doc) {
        newOrderIds.push(id);
        delete documentsMap[id];
      }
    });

    priorityIds.forEach(id => {
      const doc = documentsMap[id];
      if (doc) {
        newOrderIds.push(id);
        delete documentsMap[id];
      }
    });

    newOrderIds.push(...Object.keys(documentsMap));

    this.documents = documents;
    setTimeout(() => {
      if (this.layout) {
        this.layout.setOrder(newOrderIds);
      }
    });
  }

  public createPostIt(documentModel: DocumentModel) {
    this.creatingCorrelationsIds.push(documentModel.correlationId);
    this.store.dispatch(new DocumentsAction.Create({document: documentModel}));
  }

  public onScrollDown(event: any) {
    this.loadNextPage();
  }

  private loadNextPage() {
    if (this.shouldFetchNextPage()) {
      this.page++;
      this.fetchDocuments();
    }
  }

  private shouldFetchNextPage() {
    return this.documents.length >= (this.page + 1) * this.getPageSize();
  }

  public postItChanged() {
    if (this.layout) {
      this.layout.refresh();
    }
  }

  public removePostIt(documentModel: DocumentModel) {
    if (documentModel.id) {
      this.store.dispatch(
        new DocumentsAction.DeleteConfirm({
          collectionId: documentModel.collectionId,
          documentId: documentModel.id,
        })
      );
    }
  }

  public trackByDocument(documentModel: DocumentModel): string {
    return documentModel.correlationId || documentModel.id;
  }

  public onSizeChange(newSize: SizeType) {
    this.updateDefaultSize(newSize);
    this.store.dispatch(new PostItAction.ChangeSize({size: newSize}));
  }

  private updateDefaultSize(newSize: SizeType) {
    const userSettings = this.userSettingsService.getUserSettings();
    userSettings.searchSize = newSize;
    this.userSettingsService.updateUserSettings(userSettings);
  }

  private defaultSize(): SizeType {
    const userSettings = this.userSettingsService.getUserSettings();
    return userSettings.searchSize ? userSettings.searchSize : SizeType.M;
  }
}
