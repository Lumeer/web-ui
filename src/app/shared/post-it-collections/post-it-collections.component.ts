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
import {filter, finalize, skipWhile} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {Query} from '../../core/dto';
import {NotificationService} from '../../core/notifications/notification.service';
import {CollectionService, ImportService, SearchService} from '../../core/rest';
import {AppState} from '../../core/store/app.state';
import {CollectionConverter} from '../../core/store/collections/collection.converter';
import {CollectionModel} from '../../core/store/collections/collection.model';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {selectCollectionsByQuery} from '../../core/store/collections/collections.state';
import {selectNavigation} from '../../core/store/navigation/navigation.state';
import {QueryConverter} from '../../core/store/navigation/query.converter';
import {QueryModel} from '../../core/store/navigation/query.model';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {DEFAULT_COLOR, DEFAULT_ICON} from '../../core/constants';
import {Role} from '../permissions/role';
import {HtmlModifier} from '../utils/html-modifier';
import {PostItKeepingAtEndLayout} from '../utils/layout/post-it-keepin-at-end-layout';
import {PostItCollectionModel} from './post-it-collection-model';
import Get = CollectionsAction.Get;

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

  public postItToDelete: PostItCollectionModel;

  public postIts: PostItCollectionModel[];

  public lastClickedPostIt: PostItCollectionModel;

  public dragging: boolean = false;

  private layout: PostItKeepingAtEndLayout;

  private workspace: Workspace;

  private query: QueryModel;

  private navigationSubscription: Subscription;

  private collectionsSubscription: Subscription;

  constructor(private collectionService: CollectionService,
              private searchService: SearchService,
              private notificationService: NotificationService,
              private importService: ImportService,
              private store: Store<AppState>,
              private zone: NgZone) {
  }

  public ngOnInit(): void {
    this.createLayout();
    this.subscribeOnNavigation();
    this.subscribeOnCollections();
  }

  public ngAfterViewInit(): void {
    this.layout.initialize();
  }

  private subscribeOnNavigation() {
    this.navigationSubscription = this.store.select(selectNavigation).pipe(
      filter(navigation => Boolean(navigation.workspace.organizationCode && navigation.workspace.projectCode))
    ).subscribe(navigation => {
      this.workspace = navigation.workspace;
      this.query = navigation.query;

      this.store.dispatch(new Get({query: this.query}));
      this.layout.setElementsAtEnd((this.editable && this.emptyQuery()) ? 2 : 0);
    });
  }

  private createLayout(): void {
    const config = new PostItLayoutConfig();
    config.dragEnabled = false;

    this.layout = new PostItKeepingAtEndLayout('post-it-collection-layout', config, this.zone);
  }

  private collectionToPostIt(collection: CollectionModel, initialized: boolean): PostItCollectionModel {
    const postIt = new PostItCollectionModel;
    postIt.collection = collection;
    postIt.initialized = initialized;

    return postIt;
  }

  public toggleFavorite(collection: CollectionModel) {
    this.collectionService.toggleCollectionFavorite(CollectionConverter.toDto(collection))
      .subscribe(success => {
        if (success) {
          collection.favourite = !collection.favourite;
        }
      });
  }

  public hasWriteRole(collection: CollectionModel): boolean {
    return this.hasRole(collection, Role.Write);
  }

  public hasManageRole(collection: CollectionModel): boolean {
    return this.hasRole(collection, Role.Manage);
  }

  private hasRole(collection: CollectionModel, role: string) {
    return collection.permissions && collection.permissions.users
      .some(permission => permission.roles.includes(role));
  }

  public newPostIt(): void {
    const newPostIt = new PostItCollectionModel;
    newPostIt.initialized = false;
    newPostIt.collection = {
      name: '',
      description: '',
      color: DEFAULT_COLOR,
      icon: DEFAULT_ICON,
      defaultAttributeId: ''
    };

    this.postIts.push(newPostIt);

    setTimeout(() => {
      const newPostItElement = document.getElementById('perspectivePostIt' + (this.postIts.length - 1));
      if (newPostItElement) {
        this.layout.add(newPostItElement);
      }
    });

    this.focusNewPostIt();
  }

  private focusNewPostIt(): void {
    setTimeout(() => {
      const newPostIt = this.postItElements.last.nativeElement;
      const newPostItTextField = newPostIt.getElementsByTagName('input').item(0);
      newPostItTextField.focus();
    });
  }

  public createPostIt(postIt: PostItCollectionModel): void {
    postIt.initializing = true;

    this.collectionService.createCollection(CollectionConverter.toDto(postIt.collection))
      .pipe(finalize(() => postIt.initializing = false))
      .subscribe(
        collection => this.finishCreatingCollection(postIt, CollectionConverter.fromDto(collection)),
        error => this.notificationService.error('Creating file failed')
      );
  }

  private finishCreatingCollection(postIt: PostItCollectionModel, collection: CollectionModel): void {
    postIt.collection.code = collection.code;
    postIt.initialized = true;

    this.notificationService.success('File created');

    if (this.hasWorkspace()) {
      this.getCollection(postIt);
    }
  }

  private getCollection(postIt: PostItCollectionModel): void {
    this.collectionService.getCollection(postIt.collection.code)
      .subscribe(
        collection => {
          postIt.collection = CollectionConverter.fromDto(collection);
        },
        error => {
          this.notificationService.error('Getting file failed');
        });
  }

  public updateCollection(postIt: PostItCollectionModel): void {
    if (postIt === this.postItToDelete || !this.hasWorkspace()) {
      return;
    }

    this.collectionService.updateCollection(CollectionConverter.toDto(postIt.collection))
      .subscribe(
        collection => {
          postIt.collection = CollectionConverter.fromDto(collection);
        },
        error => {
          this.notificationService.error('Failed updating file');
        });
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
      this.notificationService.error('File input is empty');
    }
  }

  private importData(result: string, name: string, format: string) {
    this.importService.importFile(format, result, name)
      .subscribe(
        collection => {
          const newPostIt = new PostItCollectionModel;
          newPostIt.initialized = true;
          newPostIt.collection = CollectionConverter.fromDto(collection);

          collection.color = DEFAULT_COLOR;
          collection.icon = DEFAULT_ICON;

          this.postIts.push(newPostIt);

          setTimeout(() => {
            const newPostItElement = document.getElementById('perspectivePostIt' + (this.postIts.length - 1));
            if (newPostItElement) {
              this.layout.add(newPostItElement);
            }
          });
        },
        error => {
          this.notificationService.error('Import failed');
        }
      );
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

  private removeCollection(postIt: PostItCollectionModel): void {
    if (postIt.initialized) {
      this.sendRemoveCollectionRequest(postIt);
    }

    const deletedPostItElement = document.getElementById('perspectivePostIt' + this.postItIndex(postIt));
    this.layout.remove(deletedPostItElement);
    this.postIts.splice(this.postItIndex(postIt), 1);
  }

  private sendRemoveCollectionRequest(deletedCollectionPostIt: PostItCollectionModel): void {
    this.postItToDelete = deletedCollectionPostIt;

    this.collectionService.removeCollection(deletedCollectionPostIt.collection.code).pipe(
      finalize(() => this.postItToDelete = null)
    ).subscribe(
      response => this.notificationService.success('File removed'),
      error => this.notificationService.error('Failed removing file')
    );
  }

  public onTextAreaBlur(postIt: PostItCollectionModel, textArea: HTMLTextAreaElement): void {
    if (postIt.initializing) {
      return;
    }

    if (postIt.initialized) {
      this.updateCollection(postIt);
    } else {
      postIt.collection.name && this.createPostIt(postIt);
    }
  }

  public confirmDeletion(postIt: PostItCollectionModel): void {
    this.notificationService.confirm('Are you sure you want to remove the file?', 'Delete?', [
      {text: 'Yes', action: () => this.removeCollection(postIt), bold: false},
      {text: 'No'}
    ]);
  }

  public onClick(event: MouseEvent): void {
    if (!this.postItElements) {
      return;
    }

    const clickedPostItIndex = this.postItElements.toArray().findIndex(postIt => postIt.nativeElement.contains(event.target));
    if (clickedPostItIndex !== -1) {
      this.lastClickedPostIt = this.postIts[clickedPostItIndex];
    }
  }

  private postItIndex(collectionData: PostItCollectionModel): number {
    const index = this.postIts.findIndex(collectionDataObject => collectionDataObject === collectionData);
    return index === -1 ? null : index;
  }

  public emptyQuery(): boolean {
    return !this.query || (this.query && this.query.collectionCodes && this.query.collectionCodes.length === 0);
  }

  public documentsQuery(collectionCode: string): string {
    const query: Query = {collectionCodes: [collectionCode]};
    return QueryConverter.toString(query);
  }

  private trimNameWhitespace(postItWithNameToTrim: PostItCollectionModel): void {
    postItWithNameToTrim.collection.name = postItWithNameToTrim.collection.name.trim();
  }

  public removeHtmlComments(html: HTMLElement): string {
    if (html) {
      return HtmlModifier.removeHtmlComments(html);
    }
  }

  public workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  private hasWorkspace(): boolean {
    return !!(this.workspace && this.workspace.organizationCode && this.workspace.projectCode);
  }

  private subscribeOnCollections() {
    this.collectionsSubscription = this.store.select(selectCollectionsByQuery).subscribe(collections => {
      const initialized = true;
      this.postIts = collections.map(collection => this.collectionToPostIt(collection, initialized));

      setTimeout(() => {
        for (let i = 0; i < collections.length; i++) {
          const newPostItElement = document.getElementById('perspectivePostIt' + i);
          if (newPostItElement) {
            this.layout.add(newPostItElement);
          }
        }
      });
    });
  }

  public ngOnDestroy(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }

    if (this.collectionsSubscription) {
      this.collectionsSubscription.unsubscribe();
    }
  }

}
