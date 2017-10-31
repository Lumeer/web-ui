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

import {AfterViewChecked, Component, ElementRef, Input, NgZone, OnDestroy, OnInit, QueryList, TemplateRef, ViewChildren} from '@angular/core';

import {NotificationsService} from 'angular2-notifications/dist';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';

import {COLLECTION_NO_COLOR, COLLECTION_NO_ICON} from '../../collection/constants';
import {Collection} from '../../core/dto/collection';
import {Query} from '../../core/dto/query';
import {CollectionService} from '../../core/rest/collection.service';
import {ImportService} from '../../core/rest/import.service';
import {SearchService} from '../../core/rest/search.service';
import {WorkspaceService} from '../../core/workspace.service';
import {Role} from '../permissions/role';
import {PostItLayout} from '../utils/post-it-layout';
import {PostItCollectionData} from './post-it-collection-data';
import {QueryConverter} from '../utils/query-converter';
import {HtmlModifier} from '../utils/html-modifier';

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
              private zone: NgZone,
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
    }, this.zone);
  }

  private loadCollections() {
    this.searchService.searchCollections(this.query)
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
      description: '',
      color: COLLECTION_NO_COLOR,
      icon: COLLECTION_NO_ICON
    };

    this.postIts.push(newPostIt);
    setTimeout(() => this.postItElements.last.nativeElement.getElementsByTagName('textarea').item(0).focus());
  }

  public initializePostIt(postIt: PostItCollectionData): void {
    this.collectionService.createCollection(postIt.collection)
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

  public onTextAreaBlur(postIt: PostItCollectionData, textArea: HTMLTextAreaElement): void {
    if (postIt.initialized) {
      this.updateCollection(postIt);
    } else {
      postIt.collection.name && this.initializePostIt(postIt);
    }
  }

  public onClick(event: MouseEvent): void {
    if (!this.postItElements) {
      return;
    }
    const clickedPostItIndex = this.postItElements.toArray().findIndex(postIt => postIt.nativeElement.contains(event.target));
    this.lastClickedPostIt = this.postIts[clickedPostItIndex];
  }

  private postItIndex(collectionData: PostItCollectionData): number {
    const index = this.postIts.findIndex(collectionDataObject => collectionDataObject === collectionData);
    return index === -1 ? null : index;
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
    if (this.layout) {
      this.layout.destroy();
    }
  }

  public documentsQuery(collectionCode: string): string {
    const query: Query = {collectionCodes: [collectionCode]};
    return QueryConverter.toString(query);
  }

  public removeHtmlComments(html: HTMLElement): string {
    if (html) {
      return HtmlModifier.removeHtmlComments(html);
    }
  }

}
