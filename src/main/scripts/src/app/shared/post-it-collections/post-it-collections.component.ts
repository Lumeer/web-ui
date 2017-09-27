/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {AfterViewChecked, Component, ElementRef, Input, OnDestroy, OnInit, QueryList, TemplateRef, ViewChildren} from '@angular/core';

import {NotificationsService} from 'angular2-notifications/dist';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';

import {Collection, COLLECTION_NO_COLOR, COLLECTION_NO_ICON} from '../../core/dto/collection';
import {Query} from '../../core/dto/query';
import {CollectionService} from '../../core/rest/collection.service';
import {ImportService} from '../../core/rest/import.service';
import {SearchService} from '../../core/rest/search.service';
import {WorkspaceService} from '../../core/workspace.service';
import {Role} from '../permissions/role';
import {PostItLayout} from '../perspectives/utils/post-it-layout';
import {PostItCollectionData} from './post-it-collection-data';
import 'rxjs/add/operator/retry';

@Component({
  selector: 'post-it-collections',
  templateUrl: './post-it-collections.component.html',
  styleUrls: ['./post-it-collections.component.scss'],
  host: {
    '(document:click)': 'onClick($event)'
  }
})
export class PostItCollectionsComponent implements OnInit, AfterViewChecked, OnDestroy {

  @Input()
  public query: Query;

  @Input()
  public editable: boolean = true;

  @ViewChildren('textArea')
  public nameInputs: QueryList<ElementRef>;

  @ViewChildren('postItElement')
  public postItElements: QueryList<ElementRef>;

  public deleteConfirm: BsModalRef;

  public postItToDelete: PostItCollectionData;

  public postIts: PostItCollectionData[] = [];

  public lastClickedPostIt: PostItCollectionData;

  public dragging: boolean = false;

  private layout: PostItLayout;

  constructor(private collectionService: CollectionService,
              private searchService: SearchService,
              private notificationService: NotificationsService,
              private importService: ImportService,
              private workspaceService: WorkspaceService,
              private modalService: BsModalService) {
  }

  public ngOnInit(): void {
    this.initializeLayout();
    this.loadCollections();
  }

  public ngAfterViewChecked(): void {
    this.layout.refresh();
  }

  private initializeLayout(): void {
    this.layout = new PostItLayout({
      container: '.layout',
      item: '.layout-item',
      gutter: 10
    });
  }

  private loadCollections() {
    this.searchService.searchCollections(this.query)
      .retry(3)
      .subscribe(
        collections => {
          collections.forEach(collection => {
            const postIt = new PostItCollectionData;
            postIt.collection = collection;
            postIt.initialized = true;

            this.postIts.push(postIt);
          });

          this.reloadLayout();
        },
        error => {
          this.handleError(error, 'Failed fetching collections');
        });
  }

  private reloadLayout(): void {
    setTimeout(() => {
      this.nameInputs.forEach(nameInput => this.updateToScrollbarHeight(nameInput.nativeElement));
    }, 500);

    setTimeout(() => {
      this.layout.refresh();
    }, 1000);
  }

  public hasWriteRole(collection: Collection): boolean {
    return this.hasRole(collection, Role.Write);
  }

  public hasManageRole(collection: Collection): boolean {
    return this.hasRole(collection, Role.Manage);
  }

  private hasRole(collection: Collection, role: string) {
    return collection.permissions && collection.permissions.users
      .some(permission => permission.roles.includes(role));
  }

  public newPostIt(): void {
    const newPostIt = new PostItCollectionData;
    newPostIt.initialized = false;
    newPostIt.collection = {
      name: '',
      color: COLLECTION_NO_COLOR,
      icon: COLLECTION_NO_ICON
    };

    this.postIts.push(newPostIt);
    setTimeout(() => this.postItElements.last.nativeElement.getElementsByTagName('textarea').item(0).focus());
  }

  public initializePostIt(postIt: PostItCollectionData): void {
    this.collectionService.createCollection(postIt.collection)
      .retry(3)
      .subscribe(
        response => {
          const code = response.headers.get('Location').split('/').pop();

          postIt.collection.code = code;
          postIt.initialized = true;
          this.getCollection(postIt);
          this.notificationService.success('Success', 'Collection created');
        },
        error => {
          this.handleError(error, 'Creating collection failed');
        });
  }

  private getCollection(postIt: PostItCollectionData): void {
    this.collectionService.getCollection(postIt.collection.code)
      .retry(3)
      .subscribe(
        collection => {
          postIt.collection = collection;
        },
        error => {
          this.handleError(error, 'Refreshing collection failed');
        });
  }

  public updateCollection(postIt: PostItCollectionData): void {
    if (postIt === this.postItToDelete) {
      return;
    }

    this.collectionService.updateCollection(postIt.collection)
      .retry(3)
      .subscribe(
        collection => {
          postIt.collection = collection;
        },
        error => {
          this.handleError(error, 'Failed updating collection');
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
      this.handleError(null, 'File input is empty');
    }
  }

  private importData(result: string, name: string, format: string) {
    this.importService.importFile(format, result, name)
      .retry(3)
      .subscribe(
        collection => {
          const newPostIt = new PostItCollectionData;
          newPostIt.initialized = true;
          newPostIt.collection = collection;

          collection.color = COLLECTION_NO_COLOR;
          collection.icon = COLLECTION_NO_ICON;

          this.postIts.push(newPostIt);
        },
        error => {
          this.handleError(error, 'Import failed');
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

  public confirmDeletion(postIt: PostItCollectionData, modal: TemplateRef<any>): void {
    this.postItToDelete = postIt;
    this.deleteConfirm = this.modalService.show(modal);
  }

  private removeCollection(postIt: PostItCollectionData): void {
    if (postIt.initialized) {
      this.collectionService.removeCollection(postIt.collection.code)
        .retry(3)
        .subscribe(
          response => {
            this.postItToDelete = null;
            this.notificationService.success('Success', 'Collection removed');
          },
          error => {
            this.handleError(error, 'Failed removing collection');
          }
        );
    }

    this.postIts.splice(this.postItIndex(postIt), 1);
  }

  public onAttributesClick(collectionCode: string): void {
    // TODO
  }

  public onPermissionsClick(collectionCode: string): void {
    // TODO
  }

  public onDetailClick(collectionCode: string): void {
    // TODO
  }

  public onTextAreaBlur(postIt: PostItCollectionData, textArea: HTMLTextAreaElement): void {
    if (postIt.initialized) {
      this.updateCollection(postIt);
    } else {
      postIt.collection.name && this.initializePostIt(postIt);
    }

    textArea.placeholder = 'Collection Name';
  }

  public onClick(event: MouseEvent): void {
    const clickedPostItIndex = this.postItElements.toArray().findIndex(postIt => postIt.nativeElement.contains(event.target));
    this.lastClickedPostIt = this.postIts[clickedPostItIndex];
  }

  private postItIndex(collectionData: PostItCollectionData): number {
    const index = this.postIts.findIndex(collectionDataObject => collectionDataObject === collectionData);
    return index === -1 ? undefined : index;
  }

  private handleError(error: Error, message?: string): void {
    this.notificationService.error('Error', message ? message : error.message);
  }

  public updateToScrollbarHeight(textArea: HTMLTextAreaElement): void {
    textArea.style.height = 'auto';
    textArea.style.height = `${textArea.scrollHeight}px`;
  }

  public workspacePath(): string {
    return `/w/${this.workspaceService.organizationCode}/${this.workspaceService.projectCode}`;
  }

  public ngOnDestroy(): void {
    this.layout.destroy();
  }
}
