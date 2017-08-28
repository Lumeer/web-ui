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
import {LumeerError} from '../../../../core/error/lumeer.error';
import {BadInputError} from '../../../../core/error/bad-input.error';
import {Initialization} from './initialization';
import {MasonryLayout} from '../../utils/masonry-layout';
import {Perspective} from '../../perspective';
import {Role} from '../../../permissions/role';
import {Buffer} from '../../utils/buffer';
import {Popup} from '../../utils/popup';
import {isUndefined} from 'util';

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
  public query: string;

  @Input()
  public editable: boolean = true;

  @ViewChildren(IconPickerComponent)
  public iconPickers: QueryList<IconPickerComponent>;

  @ViewChildren('iconSwitch')
  public iconSwitches: QueryList<ElementRef>;

  public collections: Collection[];

  public pickerVisible: boolean[] = [];

  public initialized: Initialization[] = [];

  public errorMessage: string;

  private layout: MasonryLayout;

  private changeBuffer: Buffer;

  private changedCollection: Collection;

  private previousIconPicker: number;

  constructor(private collectionService: CollectionService,
              private notificationService: NotificationsService) {
  }

  public ngOnInit(): void {
    this.loadCollections();
    this.initializeLayout();
  }

  private loadCollections() {
    this.collectionService.getCollections()
      .subscribe(collections => {
        this.collections = collections;
        collections.forEach(_ => this.initialized.push(new Initialization(true)));
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

  public onNewCollection(): void {
    this.collections.unshift({
      code: null,
      name: '',
      color: COLLECTION_NO_COLOR,
      icon: COLLECTION_NO_ICON,
      userRoles: [],
      documentCount: 0
    });
    this.initialized.unshift(new Initialization(false));
  }

  public checkInitialization(index: number): void {
    if (this.initialized[index].color && this.initialized[index].icon && this.initialized[index].name) {
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
      .subscribe(
        (code: string) => {
          collection.code = code;
          this.initialized[index].all = true;
          this.notificationService.success('Success', 'Collection created');
        },
        (error: LumeerError) => {
          if (error instanceof BadInputError) {
            this.errorMessage = error.message;
          } else {
            throw error;
          }
        }
      );
  }

  public updateCollection(collection: Collection): void {
    if (this.changedCollection === collection) {
      this.changeBuffer.stageChanges();
    } else {
      this.changedCollection = collection;
      this.changeBuffer = new Buffer(() => {
        this.collectionService.updateCollection(collection)
          .subscribe(
            null,
            (error: LumeerError) => {
              if (error instanceof BadInputError) {
                this.errorMessage = error.message;
              } else {
                throw error;
              }
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

  public hasWriteRole(collection: Collection): boolean {
    return collection.userRoles.some(role => role === Role.write);
  }

  public hasManageRole(collection: Collection): boolean {
    return collection.userRoles.some(role => role === Role.manage);
  }

  private removeCollection(index: number): void {
    if (this.initialized[index].all) {
      this.changeBuffer && this.changeBuffer.flush();
      this.collectionService.dropCollection(this.collections[index].code)
        .subscribe(
          _ => this.notificationService.success('Success', 'Collection removed'),
          (error: LumeerError) => {
            if (error instanceof BadInputError) {
              this.errorMessage = error.message;
            } else {
              throw error;
            }
          });
    }
    this.collections.splice(index, 1);
    this.initialized.splice(index, 1);
  }

  public onAttributesClick(collectionCode: String): void {
    // TODO
  }

  public onPermissionsClick(collectionCode: String): void {
    // TODO
  }

  public onDetailClick(collectionCode: String): void {
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
