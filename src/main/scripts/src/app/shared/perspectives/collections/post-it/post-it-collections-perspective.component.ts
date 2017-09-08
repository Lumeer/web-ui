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

import {AfterViewChecked, Component, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {animate, keyframes, state, style, transition, trigger} from '@angular/animations';

import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {NotificationsService} from 'angular2-notifications/dist';

import {Collection, COLLECTION_NO_COLOR, COLLECTION_NO_ICON} from '../../../../core/dto/collection';
import {CollectionService} from '../../../../core/rest/collection.service';
import {PostItLayout} from '../../utils/post-it-layout';
import {Perspective} from '../../perspective';
import {Role} from '../../../permissions/role';
import {Buffer} from '../../utils/buffer';
import {Query} from '../../../../core/dto/query';
import {PostItCollectionData} from './post-it-collection-data';
import {SearchService} from '../../../../core/rest/search.service';
import {ImportService} from '../../../../core/rest/import.service';
import {WorkspaceService} from '../../../../core/workspace.service';
import 'rxjs/add/operator/retry';

@Component({
  selector: 'post-it-collections-perspective',
  templateUrl: './post-it-collections-perspective.component.html',
  styleUrls: ['./post-it-collections-perspective.component.scss'],
  animations: [
    trigger('animateHeight', [
      state('in', style({height: '*'})),
      transition('void => *', [
        animate(150, keyframes([
          style({height: 0, offset: 0}),
          style({height: '*', offset: 1})
        ]))
      ]),
      transition('* => void', [
        animate(150, keyframes([
          style({height: '*', offset: 0}),
          style({height: 0, offset: 1})
        ]))
      ])
    ])
  ],
  host: {
    '(document:click)': 'onClick($event)'
  }
})
export class PostItCollectionsPerspectiveComponent implements Perspective, OnInit, AfterViewChecked, OnDestroy {

  @Input()
  public query: Query;

  @Input()
  public editable: boolean = true;

  @ViewChild('layout')
  public layoutElement: ElementRef;

  @ViewChildren('postItElement')
  public postItElements: QueryList<ElementRef>;

  public postIts: PostItCollectionData[] = [];

  private lastUpdatedPostIt: PostItCollectionData;

  private lastClickedPostIt: PostItCollectionData;

  public dragging: boolean = false;

  private layout: PostItLayout;

  private changeBuffer: Buffer;

  constructor(private collectionService: CollectionService,
              private searchService: SearchService,
              private notificationService: NotificationsService,
              private importService: ImportService,
              private workspaceService: WorkspaceService,
              private modalService: NgbModal) {
  }

  public documentsPerRow(): number {
    return Math.floor(this.layoutElement.nativeElement.clientWidth / (220 /*Post-it width*/ + 10 /*Gutter*/));
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

          setTimeout(() => this.layout.refresh(), 1000);
        },
        error => {
          this.handleError(error, 'Failed fetching collections');
        });
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

  public onNewCollection(): void {
    const newPostIt = new PostItCollectionData;
    newPostIt.initialized = false;
    newPostIt.collection = {
      name: '',
      color: COLLECTION_NO_COLOR,
      icon: COLLECTION_NO_ICON
    };

    this.postIts.push(newPostIt);
    setTimeout(() => this.postItElements.last.nativeElement.getElementsByTagName('input').item(0).focus());
  }

  public initializeCollection(postIt: PostItCollectionData): void {
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
          this.handleError(error, 'Failed updating collection');
        });
  }

  public updateCollection(postIt: PostItCollectionData): void {
    if (this.lastUpdatedPostIt === postIt && this.changeBuffer) {
      this.changeBuffer.stageChanges();
      return;
    }

    this.lastUpdatedPostIt = postIt;
    this.changeBuffer = new Buffer(() => {
      this.collectionService.updateCollection(postIt.collection)
        .retry(3)
        .subscribe(
          collection => {
            postIt.collection = collection;
          },
          error => {
            this.handleError(error, 'Failed updating collection');
          });
    }, 500);
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

  public onDeleteClick(postIt: PostItCollectionData, popup: ElementRef): void {
    this.modalService.open(popup).result.then(
      closed => {
        this.removeCollection(postIt);
      }, dismissed => {
        return null;
      }
    );
  }

  private removeCollection(postIt: PostItCollectionData): void {
    if (postIt.initialized) {
      this.changeBuffer && this.changeBuffer.flush();
      this.collectionService.removeCollection(postIt.collection.code)
        .retry(3)
        .subscribe(
          response => {
            this.notificationService.success('Success', 'Collection removed');
          },
          error => {
            this.handleError(error, 'Failed removing collection');
          }
        );
    }

    this.postIts.splice(this.collectionDataObjectIndex(postIt), 1);
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

  public onClick(event: MouseEvent): void {
    const clickedPostItIndex = this.clickedPostItIndex(event);
    const clickedPostIt = this.postIts[clickedPostItIndex];

    if (clickedPostIt !== this.lastClickedPostIt) {
      this.lastClickedPostIt && (this.lastClickedPostIt.pickerVisible = false);
      this.lastClickedPostIt = clickedPostIt;
    }
  }

  private clickedPostItIndex(event: MouseEvent): number {
    return this.postItElements.toArray().findIndex(postIt => postIt.nativeElement.contains(event.target));
  }

  private collectionDataObjectIndex(collectionData: PostItCollectionData): number {
    const index = this.postIts.findIndex(collectionDataObject => collectionDataObject === collectionData);
    return index === -1 ? undefined : index;
  }

  private handleError(error: Error, message?: string): void {
    this.notificationService.error('Error', message ? message : error.message);
  }

  public workspacePath(): string {
    return `/w/${this.workspaceService.organizationCode}/${this.workspaceService.projectCode}`;
  }

  public ngOnDestroy(): void {
    this.layout.destroy();
  }

}
