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
import {Store} from '@ngrx/store';

import {COLLECTION_NO_COLOR, COLLECTION_NO_ICON} from '../../collection/constants';
import {Collection, Query} from '../../core/dto';
import {CollectionService, ImportService, SearchService} from '../../core/rest';
import {Role} from '../permissions/role';
import {PostItLayout} from '../utils/post-it-layout';
import {PostItCollectionModel} from './post-it-collection-model';
import {DeprecatedQueryConverter} from '../utils/query-converter';
import {QueryConverter} from '../../core/store/navigation/query.converter';
import {HtmlModifier} from '../utils/html-modifier';
import {NotificationService} from '../../core/notifications/notification.service';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {AppState} from '../../core/store/app.state';
import {selectWorkspace} from '../../core/store/navigation/navigation.state';
import {finalize} from 'rxjs/operators';

@Component({
  selector: 'post-it-collections',
  templateUrl: './post-it-collections.component.html',
  styleUrls: ['./post-it-collections.component.scss'],
  host: {
    '(document:click)': 'onClick($event)'
  }
})
export class PostItCollectionsComponent implements OnInit, OnDestroy {

  @Input()
  public query: Query;

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

  private layout: PostItLayout;

  private workspace: Workspace;

  constructor(private collectionService: CollectionService,
              private searchService: SearchService,
              private notificationService: NotificationService,
              private importService: ImportService,
              private store: Store<AppState>,
              private zone: NgZone) {
    store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);
  }

  public ngOnInit(): void {
    this.initializeLayout();
    this.loadCollections();
  }

  private initializeLayout(): void {
    this.layout = new PostItLayout({
      container: '.parent',
      item: '.layout-item',
      gutter: 10
    }, this.zone);
  }

  private loadCollections() {
    this.searchService.searchCollections(DeprecatedQueryConverter.removeLinksFromQuery(this.query)).subscribe(
      collections => {
        this.postIts = collections.map(collection => this.collectionToPostIt(collection, true));
        this.reloadLayout();
      },
      error => {
        this.notificationService.error('Failed fetching collections');
      });
  }

  private collectionToPostIt(collection: Collection, initialized: boolean): PostItCollectionModel {
    const postIt = new PostItCollectionModel;
    postIt.collection = collection;
    postIt.initialized = initialized;

    return postIt;
  }

  private reloadLayout(): void {
    setTimeout(() => {
      this.nameInputs.forEach(nameInput => this.updateToScrollbarHeight(nameInput.nativeElement));
      this.layout.refresh();
    });
  }

  public toggleFavorite(collection: Collection) {
    this.collectionService.toggleCollectionFavorite(collection)
      .subscribe(success => {
        if (success) {
          collection.isFavorite = !collection.isFavorite;
        }
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

  public newPostIt(): void {
    const newPostIt = new PostItCollectionModel;
    newPostIt.initialized = false;
    newPostIt.collection = {
      name: '',
      description: '',
      color: COLLECTION_NO_COLOR,
      icon: COLLECTION_NO_ICON
    };

    this.postIts.push(newPostIt);
    this.focusNewPostIt();
    this.layout.refresh();
  }

  private focusNewPostIt(): void {
    setTimeout(() => {
      const newPostIt = this.postItElements.last.nativeElement;
      const newPostItTextField = newPostIt.getElementsByTagName('textarea').item(0);
      newPostItTextField.focus();
    });
  }

  public initializePostIt(postIt: PostItCollectionModel): void {
    this.trimNameWhitespace(postIt);
    postIt.initializing = true;

    this.collectionService.createCollection(postIt.collection)
      .pipe(finalize(() => postIt.initializing = false))
      .subscribe(
        collection => {
          postIt.collection.code = collection.code;
          postIt.initialized = true;
          this.getCollection(postIt);
          this.notificationService.success('Collection created');
        },
        error => {
          this.notificationService.error('Creating collection failed');
        });
  }

  private getCollection(postIt: PostItCollectionModel): void {
    this.collectionService.getCollection(postIt.collection.code)
      .subscribe(
        collection => {
          postIt.collection = collection;
          this.layout.refresh();
        },
        error => {
          this.notificationService.error('Refreshing collection failed');
        });
  }

  public updateCollection(postIt: PostItCollectionModel): void {
    if (postIt === this.postItToDelete) {
      return;
    }

    this.trimNameWhitespace(postIt);

    this.collectionService.updateCollection(postIt.collection)
      .subscribe(
        collection => {
          postIt.collection = collection;
          this.layout.refresh();
        },
        error => {
          this.notificationService.error('Failed updating collection');
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
          newPostIt.collection = collection;

          collection.color = COLLECTION_NO_COLOR;
          collection.icon = COLLECTION_NO_ICON;

          this.postIts.push(newPostIt);
          this.layout.refresh();
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

    this.postIts.splice(this.postItIndex(postIt), 1);
    this.layout.refresh();
  }

  private sendRemoveCollectionRequest(deletedCollectionPostIt: PostItCollectionModel): void {
    this.postItToDelete = deletedCollectionPostIt;

    this.collectionService.removeCollection(deletedCollectionPostIt.collection.code).pipe(
      finalize(() => this.postItToDelete = null)
    ).subscribe(
      response => this.notificationService.success('Collection removed'),
      error => this.notificationService.error('Failed removing collection')
    );
  }

  public onTextAreaBlur(postIt: PostItCollectionModel, textArea: HTMLTextAreaElement): void {
    if (postIt.initializing) {
      return;
    }

    if (postIt.initialized) {
      this.updateCollection(postIt);
    } else {
      postIt.collection.name && this.initializePostIt(postIt);
    }
  }

  public confirmDeletion(postIt: PostItCollectionModel): void {
    this.notificationService.confirm('Are you sure you want to remove the collection?', 'Delete?', [
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

  public updateToScrollbarHeight(textArea: HTMLTextAreaElement): void {
    // the only way to figure out the needed scroll height is to set it to auto
    textArea.style.height = 'auto';
    textArea.style.height = `${textArea.scrollHeight}px`;
  }

  public workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  public ngOnDestroy(): void {
    // might get called before onInit finishes
    if (this.layout) {
      this.layout.destroy();
    }
  }

  public emptyQuery(): boolean {
    const queryValues = Object.values(this.query);
    const notEmptyValue = queryValues.find(this.isNotEmpty);
    return notEmptyValue === undefined;
  }

  private isNotEmpty(value: any): boolean {
    if (value.constructor === Array) {
      return value.length;
    }

    return !!value;
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

}
