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

import {AfterViewChecked, Component, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChildren} from '@angular/core';

import {NotificationsService} from 'angular2-notifications/dist';

import {Collection, COLLECTION_NO_COLOR, COLLECTION_NO_ICON} from '../../../../core/dto/collection';
import {CollectionService} from '../../../../core/rest/collection.service';
import {IconPickerComponent} from '../../icon-picker/icon-picker.component';
import {Initialization} from './collection-data/initialization';
import {PostItLayout} from '../../utils/post-it-layout';
import {Perspective} from '../../perspective';
import {Role} from '../../../permissions/role';
import {Buffer} from '../../utils/buffer';
import {Popup} from '../../utils/popup';
import {Query} from '../../../../core/dto/query';
import {CollectionData} from './collection-data/collection-data';
import {SearchService} from '../../../../core/rest/search.service';
import {ImportService} from '../../../../core/rest/import.service';
import {WorkspaceService} from '../../../../core/workspace.service';
import {isUndefined} from 'util';
import 'rxjs/add/operator/retry';

@Component({
  selector: 'post-it-collections-perspective',
  templateUrl: './post-it-collections-perspective.component.html',
  styleUrls: ['./post-it-collections-perspective.component.scss'],
  host: {
    '(document:click)': 'onClick($event)'
  }
})
export class PostItCollectionsPerspectiveComponent implements Perspective, OnInit, AfterViewChecked, OnDestroy {

  @Input()
  public query: Query;

  @Input()
  public editable: boolean = true;

  @ViewChildren(IconPickerComponent)
  public iconPickers: QueryList<IconPickerComponent>;

  @ViewChildren('iconSwitch')
  public iconSwitches: QueryList<ElementRef>;

  @ViewChildren('nonInitializedNameInput')
  public newNameInputs: QueryList<ElementRef>;

  public collectionDataObjects: CollectionData[] = [];

  private lastUpdatedCollectionData: CollectionData;

  private lastClickedIconPickerCollectionData: CollectionData;

  public lastClickedCollectionData: CollectionData;

  public dragging: boolean = false;

  private layout: PostItLayout;

  private changeBuffer: Buffer;

  constructor(private collectionService: CollectionService,
              private searchService: SearchService,
              private notificationService: NotificationsService,
              private importService: ImportService,
              private workspaceService: WorkspaceService) {
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
      gutter: 15
    });
  }

  private loadCollections() {
    this.searchService.searchCollections(this.query)
      .retry(3)
      .subscribe(
        collections => {
          collections.forEach(collection => {
            const newCollectionData = new CollectionData;
            newCollectionData.collection = collection;
            newCollectionData.initialized = new Initialization(true);
            newCollectionData.pickerVisible = false;

            this.collectionDataObjects.push(newCollectionData);
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
    const newCollectionData = new CollectionData;
    newCollectionData.pickerVisible = false;
    newCollectionData.initialized = new Initialization(false);
    newCollectionData.collection = {
      name: '',
      color: COLLECTION_NO_COLOR,
      icon: COLLECTION_NO_ICON
    };

    this.collectionDataObjects.unshift(newCollectionData);
    setTimeout(() => this.newNameInputs.first.nativeElement.focus());
  }

  public initializeCollection(collectionData: CollectionData): void {
    this.collectionService.createCollection(collectionData.collection)
      .retry(3)
      .subscribe(
        response => {
          const code = response.headers.get('Location').split('/').pop();

          collectionData.collection.code = code;
          this.getCollection(collectionData);
          collectionData.initialized.onServer = true;
          this.notificationService.success('Success', 'Collection created');
        },
        error => {
          this.handleError(error, 'Creating collection failed');
        });
  }

  private getCollection(collectionData: CollectionData): void {
    this.collectionService.getCollection(collectionData.collection.code)
      .retry(3)
      .subscribe(
        collection => {
          collectionData.collection = collection;
        },
        error => {
          this.handleError(error, 'Failed updating collection');
        });
  }

  public checkInitialization(collectionData: CollectionData): void {
    if (collectionData.initialized.compulsory) {
      this.initializeCollection(collectionData);
    }
  }

  public checkInitializedName(collectionData: CollectionData): void {
    collectionData.initialized.name = collectionData.collection.name !== '';
  }

  public checkInitializedIcon(collectionData: CollectionData): void {
    collectionData.initialized.icon = collectionData.collection.icon !== COLLECTION_NO_ICON;
  }

  public checkInitializedColor(collectionData: CollectionData): void {
    collectionData.initialized.color = collectionData.collection.color !== COLLECTION_NO_COLOR;
  }

  public updateCollection(collectionData: CollectionData): void {
    if (this.lastUpdatedCollectionData === collectionData && this.changeBuffer) {
      this.changeBuffer.stageChanges();
      return;
    }

    this.lastUpdatedCollectionData = collectionData;
    this.changeBuffer = new Buffer(() => {
      this.collectionService.updateCollection(collectionData.collection)
        .retry(3)
        .subscribe(
          collection => {
            collectionData.collection = collection;
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
          const newCollectionData = new CollectionData;
          newCollectionData.pickerVisible = false;
          newCollectionData.initialized = new Initialization(true);
          newCollectionData.collection = collection;
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

  public onDeleteClick(collectionData: CollectionData): void {
    Popup.confirmDanger('Delete Collection', 'Deleting a collection will permanently remove it from this project.\n' +
      'All documents stored inside the collection will be lost.',
      'Keep Collection', () => null,
      'Delete Collection', () => {
        this.removeCollection(collectionData);
      });
  }

  private removeCollection(collectionData: CollectionData): void {
    if (collectionData.initialized.onServer) {
      this.changeBuffer && this.changeBuffer.flush();
      this.collectionService.removeCollection(collectionData.collection.code)
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

    this.collectionDataObjects.splice(this.collectionDataObjectIndex(collectionData), 1);
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

  public togglePicker(collectionData: CollectionData): void {
    collectionData.pickerVisible = !collectionData.pickerVisible;
    if (!isUndefined(this.lastClickedIconPickerCollectionData) && this.lastClickedIconPickerCollectionData !== collectionData) {
      this.lastClickedIconPickerCollectionData.pickerVisible = false;
    }

    this.lastClickedIconPickerCollectionData = collectionData;
  }

  private onClick(event: MouseEvent): void {
    const lastClickedPickerIndex = this.collectionDataObjectIndex(this.lastClickedIconPickerCollectionData);
    if (!this.clickOnSwitch(event, lastClickedPickerIndex) && !this.clickOnPicker(event, lastClickedPickerIndex)) {
      this.lastClickedIconPickerCollectionData && (this.lastClickedIconPickerCollectionData.pickerVisible = false);
    }
  }

  private clickOnSwitch(click: MouseEvent, index?: number): boolean {
    if (!isUndefined(index)) {
      return this.iconSwitches.toArray()[index].nativeElement.contains(click.target);
    } else {
      return !isUndefined(this.iconSwitches.find(iconSwitch => iconSwitch.nativeElement.contains(click.target)));
    }
  }

  private clickOnPicker(click: MouseEvent, index?: number): boolean {
    if (!isUndefined(index)) {
      return this.iconPickers.toArray()[index].element.nativeElement.contains(click.target);
    } else {
      return !isUndefined(this.iconPickers.find(iconPicker => iconPicker.element.nativeElement.contains(click.target)));
    }
  }

  private collectionDataObjectIndex(collectionData: CollectionData): number {
    const index = this.collectionDataObjects.findIndex(collectionDataObject => collectionDataObject === collectionData);
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
