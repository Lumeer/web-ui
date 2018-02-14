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

import {Component, ElementRef, Input, NgZone, OnDestroy, OnInit, QueryList, ViewChildren} from '@angular/core';
import {AfterViewInit} from '@angular/core/src/metadata/lifecycle_hooks';
import {Store} from '@ngrx/store';

import {PostItLayoutConfig} from 'app/shared/utils/layout/post-it-layout-config';
import {filter} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../core/store/app.state';
import {CollectionModel} from '../../core/store/collections/collection.model';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {selectNavigation} from '../../core/store/navigation/navigation.state';
import {QueryConverter} from '../../core/store/navigation/query.converter';
import {QueryModel} from '../../core/store/navigation/query.model';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {DEFAULT_COLOR, DEFAULT_ICON} from '../../core/constants';
import {Role} from '../permissions/role';
import {PostItLayout} from '../utils/layout/post-it-layout';
import {HashCodeGenerator} from '../utils/hash-code-generator';
import {CorrelationIdGenerator} from '../../core/store/correlation-id.generator';
import {NotificationsAction} from '../../core/store/notifications/notifications.action';
import {selectCollectionsByQuery} from '../../core/store/collections/collections.state';

@Component({
  selector: 'post-it-collections',
  templateUrl: './post-it-collections.component.html',
  styleUrls: ['./post-it-collections.component.scss'],
  host: {
    '(document:click)': 'onClick($event)'
  }
})
export class PostItCollectionsComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input()
  public editable: boolean = true;

  @ViewChildren('textArea')
  public nameInputs: QueryList<ElementRef>;

  @ViewChildren('postItElement')
  public postItElements: QueryList<ElementRef>;

  public collections: CollectionModel[];

  public lastClickedCollection: CollectionModel;

  public dragging: boolean = false;

  private layout: PostItLayout;

  private workspace: Workspace;

  private query: QueryModel;

  private navigationSubscription: Subscription;

  private collectionsSubscription: Subscription;

  constructor(private store: Store<AppState>,
              private zone: NgZone) {
  }

  public ngOnInit() {
    this.createLayout();
    this.subscribeOnNavigation();
    this.subscribeOnCollections();
  }

  public ngAfterViewInit() {
    this.layout.initialize();
  }

  private createLayout() {
    const config = new PostItLayoutConfig();
    config.dragEnabled = false;

    this.layout = new PostItLayout('post-it-collection-layout', config, this.zone);
  }

  private subscribeOnNavigation() {
    this.navigationSubscription = this.store.select(selectNavigation).pipe(
      filter(navigation => Boolean(navigation && navigation.workspace && navigation.workspace.organizationCode && navigation.workspace.projectCode))
    ).subscribe(navigation => {
      this.workspace = navigation.workspace;
      this.query = navigation.query;

      this.store.dispatch(new CollectionsAction.Get({query: this.query}));
    });
  }

  private subscribeOnCollections() {
    this.collectionsSubscription = this.store.select(selectCollectionsByQuery).subscribe(collections => {
      this.collections = collections.concat(this.unitializedCollections());
    });
  }

  public toggleFavorite(collection: CollectionModel) {
    const collectionCopy = {...collection};
    collectionCopy.favourite = !collectionCopy.favourite;

    this.store.dispatch(new CollectionsAction.Update({collection: collectionCopy}));
  }

  public newPostIt() {
    this.collections.push(this.createDefaultCollection());
  }

  public createDefaultCollection() {
    return {
      name: '',
      color: DEFAULT_COLOR,
      icon: DEFAULT_ICON
    };
  }

  public createPostIt(collection: CollectionModel) {
    collection.correlationId = CorrelationIdGenerator.generate();
    this.store.dispatch(new CollectionsAction.Create({collection}));
  }

  public updateCollection(collection: CollectionModel) {
    this.store.dispatch(new CollectionsAction.Update({collection}));
  }

  public fileChange(files: FileList) {
    if (files.length) {
      const file = files[0];
      const reader = new FileReader();
      const indexOfSuffix = file.name.lastIndexOf('.');
      const name = indexOfSuffix !== -1 ? file.name.substring(0, indexOfSuffix) : file.name;
      reader.onloadend = () => {
        this.importData(reader.result, name, 'csv');
      };
      reader.readAsText(file);
    } else {
      this.store.dispatch(new NotificationsAction.Error({message: 'File input is empty'}));
    }
  }

  private importData(result: string, name: string, format: string) {
    const collection = {...this.createDefaultCollection(), name};
    const importedCollection = {collection, data: result};
    this.store.dispatch(new CollectionsAction.Import({format, importedCollection}));
  }

  public handleDragEnter() {
    this.dragging = true;
  }

  public handleDragLeave() {
    this.dragging = false;
  }

  public handleDrop(event) {
    event.preventDefault();
    this.dragging = false;
    this.fileChange(event.dataTransfer.files);
  }

  public confirmDeletion(collection: CollectionModel) {
    if (collection.id) {
      this.deleteInitializedPostIt(collection);
    } else {
      this.deleteUninitializedPostIt(collection);
    }
  }

  private deleteInitializedPostIt(collection: CollectionModel) {
    this.store.dispatch(new NotificationsAction.Confirm(
      {
        title: 'Delete?',
        message: 'Are you sure you want to remove the file?',
        action: new CollectionsAction.Delete({collectionId: collection.id})
      }));
  }

  private deleteUninitializedPostIt(collection: CollectionModel) {
    this.collections = this.collections.filter(postIt => postIt !== collection);
  }

  public onCollectionNameChanged(collection: CollectionModel, newName: string) {
    const collectionCopy = {...collection, name: newName};

    if (collection.id) {
      this.updateCollection(collectionCopy);
    } else {
      this.createPostIt(collectionCopy);
    }
  }

  private unitializedCollections(): CollectionModel[] {
    return this.collections && this.collections.filter(this.uninitializedPostIt) || [];
  }

  private uninitializedPostIt(collection: CollectionModel): boolean {
    return !collection.id && !collection.correlationId;
  }

  public onClick(event: MouseEvent) {
    if (!this.clickedOnPostIt(event)) {
      this.lastClickedCollection = null;
    }
  }

  private clickedOnPostIt(event: MouseEvent): boolean {
    return this.postItElements && this.postItElements.find(postIt => postIt.nativeElement.contains(event.target)) !== undefined;
  }

  public hasManageRole(collection: CollectionModel): boolean {
    return this.hasRole(collection, Role.Manage);
  }

  private hasRole(collection: CollectionModel, role: string) {
    return collection.permissions && collection.permissions.users
      .some(permission => permission.roles.includes(role));
  }

  public workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  public emptyQuery(): boolean {
    return !this.query || (this.query && this.query.collectionIds && this.query.collectionIds.length === 0);
  }

  public queryForCollectionDocuments(collectionId: string): string {
    const query: QueryModel = {collectionIds: [collectionId]};
    return QueryConverter.toString(query);
  }

  public trackByCollection(index: number, collection: CollectionModel): number {
    return HashCodeGenerator.hashString(PostItCollectionsComponent.postItIdentifier(collection));
  }

  private static postItIdentifier(collection: CollectionModel): string {
    return collection.id || collection.correlationId;
  }

  public ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }

    if (this.collectionsSubscription) {
      this.collectionsSubscription.unsubscribe();
    }
  }

}
