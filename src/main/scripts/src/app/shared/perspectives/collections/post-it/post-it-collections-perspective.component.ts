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

import {
  AfterViewChecked,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';

import {NotificationsService} from 'angular2-notifications/dist';

import {Collection, COLLECTION_NO_COLOR, COLLECTION_NO_ICON} from '../../../../core/dto/collection';
import {CollectionService} from '../../../../core/rest/collection.service';
import {IconPickerComponent} from '../../icon-picker/icon-picker.component';
import {Initialization} from './initialization';
import {MasonryLayout} from '../../utils/masonry-layout';
import {Perspective} from '../../perspective';
import {Role} from '../../../permissions/role';
import {Buffer} from '../../utils/buffer';
import {Popup} from '../../utils/popup';
import {Query} from '../../../../core/dto/query';
import {isUndefined} from 'util';
import {SearchService} from '../../../../core/rest/search.service';
import {ImportService} from '../../../../core/rest/import.service';

@Component({
  selector: 'post-it-collections-perspective',
  templateUrl: './post-it-collections-perspective.component.html',
  styleUrls: ['./post-it-collections-perspective.component.scss'],
  host: {
    '(document:click)': 'onClick($event)'
  },
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

  public collections: Collection[] = [];

  public pickerVisible: boolean[] = [];

  public initialized: Initialization[] = [];

  public transitions = true;

  public dragging: boolean = false;

  private layout: MasonryLayout;

  private changeBuffer: Buffer;

  private changedCollection: Collection;

  private previousIconPicker: number;

  constructor(private collectionService: CollectionService,
              private searchService: SearchService,
              private notificationService: NotificationsService,
              private importService: ImportService) {
  }

  public ngOnInit(): void {
    this.loadCollections();
    this.initializeLayout();
  }

  private loadCollections() {
    this.searchService.searchCollections(this.query).subscribe(
      collections => {
        this.collections = collections;
        collections.forEach(_ => {
          this.initialized.push(new Initialization(true));
        });
      },
      error => {
        this.handleError(error, 'Failed fetching collections');
      });
  }

  private initializeLayout(): void {
    this.layout = new MasonryLayout({
      container: '.layout',
      item: '.layout-item',
      gutter: 15
    });
  }

  public ngAfterViewChecked(): void {
    this.layout.refresh();
  }

  public hasWriteRole(collection: Collection): boolean {
    return this.hasRole(collection, Role.write);
  }

  public hasManageRole(collection: Collection): boolean {
    return this.hasRole(collection, Role.manage);
  }

  private hasRole(collection: Collection, role: string) {
    return collection.permissions && collection.permissions.users
      .some(permission => permission.roles.includes(role));
  }

  public onNewCollection(): void {
    this.collections.unshift({
      name: '',
      color: COLLECTION_NO_COLOR,
      icon: COLLECTION_NO_ICON
    });
    this.initialized.unshift(new Initialization(false));

    setTimeout(() => this.newNameInputs.first.nativeElement.focus());
  }

  public checkInitialization(index: number): void {
    if (this.initialized[index].compulsory) {
      this.initializeCollection(index);
    }
  }

  public checkInitializedName(index: number): void {
    this.initialized[index].name = this.collections[index].name && this.collections[index].name !== 'Name';
  }

  public checkInitializedIcon(index: number): void {
    this.initialized[index].icon = this.collections[index].icon !== COLLECTION_NO_ICON;
  }

  public checkInitializedColor(index: number): void {
    this.initialized[index].color = this.collections[index].color !== COLLECTION_NO_COLOR;
  }

  public initializeCollection(index: number): void {
    let collection = this.collections[index];
    this.collectionService.createCollection(collection)
      .subscribe(response => {
          let code = response.headers.get('Location').split('/').pop();
          this.notificationService.success('Success', 'Collection created');
          this.refreshCollection(code, index);
          this.initialized[index].onServer = true;
        },
        error => {
          this.handleError(error, 'Creating collection failed');
        });
  }

  public fileChange(files: FileList) {
    if (files.length > 0) {
      let file = files[0];
      let reader = new FileReader();
      let indexOfSuffix = file.name.lastIndexOf('.');
      let name = indexOfSuffix !== -1 ? file.name.substring(0, indexOfSuffix) : file.name;
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
      .subscribe(collection => {
          this.collections.unshift({
            code: collection.code,
            name: collection.name,
            color: COLLECTION_NO_COLOR,
            icon: COLLECTION_NO_ICON
          });
          this.initialized.unshift(new Initialization(true));
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

  private refreshCollection(code: string, index: number): void {
    this.collectionService.getCollection(code).subscribe(
      collection => {
        this.transitions = false;
        this.collections[index] = collection;
        setTimeout(() => this.transitions = true, 400);
      },
      error => {
        this.handleError(error, 'Refreshing new collection failed');
      });
  }

  public updateCollection(index: number): void {
    let collection = this.collections[index];

    if (this.changedCollection === collection && this.changeBuffer) {
      this.changeBuffer.stageChanges();
    } else {
      this.changedCollection = collection;
      this.changeBuffer = new Buffer(() => {
        this.collectionService.updateCollection(collection).subscribe(
          collection => {
            // this.collections[index] = collection;
          },
          error => {
            this.handleError(error, 'Failed updating collection');
          });
      }, 1500);
    }
  }

  public onDeleteClick(index: number): void {
    Popup.confirmDanger('Delete Collection', 'Deleting a collection will permanently remove it from this project.\n' +
      'All documents stored inside the collection will be lost.',
      'Keep Collection', () => null,
      'Delete Collection', () => this.removeCollection(index));
  }

  private removeCollection(index: number): void {
    if (this.initialized[index].onServer) {
      this.changeBuffer && this.changeBuffer.flush();
      this.collectionService.removeCollection(this.collections[index].code).subscribe(
        _ => {
          this.notificationService.success('Success', 'Collection removed');
        },
        error => {
          this.handleError(error, 'Failed removing collection');
        }
      );
    }
    this.collections.splice(index, 1);
    this.initialized.splice(index, 1);
  }

  private handleError(error?: Error, message?: string): void {
    this.notificationService.error('Error', message ? message : error.message);
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

  public togglePicker(index: number): void {
    this.pickerVisible[index] = !this.pickerVisible[index];
    if (!isUndefined(this.previousIconPicker) && this.previousIconPicker !== index) {
      this.pickerVisible[this.previousIconPicker] = false;
    }

    this.previousIconPicker = index;
  }

  private onClick(event: MouseEvent): void {
    if (!this.clickOnSwitch(event, this.previousIconPicker) && !this.clickOnPicker(event, this.previousIconPicker)) {
      this.pickerVisible[this.previousIconPicker] = false;
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

  public ngOnDestroy(): void {
    this.layout.destroy();
  }

}
