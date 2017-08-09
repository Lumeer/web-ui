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

import {Component, Input, OnInit} from '@angular/core';
import {animate, style, transition, trigger} from '@angular/animations';

import {CollectionService} from '../../../../core/rest/collection.service';
import {Perspective} from '../../perspective';
import {Collection} from '../../../../core/dto/collection';
import {CollectionModel} from '../../../../core/model/collection.model';
import {Role} from '../../../permissions/role';
import {LumeerError} from '../../../../core/error/lumeer.error';
import {BadInputError} from '../../../../core/error/bad-input.error';

@Component({
  selector: 'post-it-collections-perspective',
  templateUrl: './post-it-collections-perspective.component.html',
  styleUrls: ['./post-it-collections-perspective.component.scss'],
  animations: [
    trigger('appear', [
      transition(':enter', [
        style({transform: 'scale(0)'}),
        animate('0.25s ease-out', style({transform: 'scale(1)'})),
      ]),
      transition(':leave', [
        style({transform: 'scale(1)'}),
        animate('0.25s ease-out', style({transform: 'scale(0)'})),
      ])
    ])
  ]
})
export class PostItCollectionsPerspectiveComponent implements Perspective, OnInit {

  @Input()
  public query: string;

  @Input()
  public editable: boolean;

  public placeholderTitle: string = 'Collection name';
  public collectionMinCharacters = 3;
  public newCollections: CollectionModel[] = [];
  public collections: Collection[];
  public cachedName: string;
  public selectedIcon: string;
  public selectedColor: string;
  public errorMessage: string;

  constructor(private collectionService: CollectionService) {
  }

  public ngOnInit(): void {
    this.loadCollections();
  }

  public onNewCollection() {
    this.newCollections.splice(0, 0, new CollectionModel());
  }

  public onRemoveNewCollection(ix: number) {
    this.newCollections.splice(ix, 1);
  }

  public onNewIconOrColor(collectionModel: CollectionModel) {
    if (collectionModel.code) {
      this.updateCollection(collectionModel);
    }
  }

  public togglePicker(collectionModel: CollectionModel) {
    if (collectionModel.pickerVisible) {
      collectionModel.pickerVisible = false;
      return;
    }
    this.selectedColor = collectionModel.color;
    this.selectedIcon = collectionModel.icon;
    this.newCollections.forEach(coll => coll.pickerVisible = false);
    collectionModel.pickerVisible = true;
  }

  public onFocusCollectionName(collectionModel: CollectionModel) {
    if (collectionModel.code) {
      this.cachedName = collectionModel.name;
    }
  }

  public onBlurCollectionName(collectionModel: CollectionModel) {
    this.onSaveCollection(collectionModel);
  }

  public onInputChange() {
    if (this.errorMessage) {
      this.errorMessage = null;
    }
  }

  public onSaveCollection(collectionModel: CollectionModel) {
    if (collectionModel.code) {
      if (collectionModel.name.length < this.collectionMinCharacters) {
        collectionModel.name = this.cachedName;
      } else if (collectionModel.name !== this.cachedName) {
        this.updateCollection(collectionModel);
      }
    } else if (collectionModel.name.length >= this.collectionMinCharacters) {
      this.createCollection(collectionModel);
    }
  }

  public hasWriteRole(collection: Collection) {
    return collection.userRoles.indexOf(Role.write) !== -1;
  }

  public hasManageRole(collection: Collection) {
    return collection.userRoles.indexOf(Role.manage) !== -1;
  }

  public onDetailClick(collectionCode: String) {
    // TODO
  }

  public onAttributesClick(collectionCode: String) {
    // TODO
  }

  public onEditClick(collectionCode: String) {
    console.log('onEditClick');
  }

  public onPermissionsClick(collectionCode: String) {
    // TODO
  }

  public onDeleteClick(collectionCode: String) {
    // TODO
  }

  private loadCollections() {
    this.collectionService.getCollections()
      .subscribe((collections: Collection[]) => this.collections = collections);
  }

  private updateCollection(collectionModel: CollectionModel) {
    this.collectionService.updateCollection(collectionModel.code, collectionModel.toDto())
      .subscribe(
        null,
        (error: LumeerError) => {
          if (error instanceof BadInputError) {
            this.errorMessage = error.reason;
          } else {
            throw error;
          }
        }
      );
  }

  private createCollection(collectionModel: CollectionModel) {
    this.collectionService.createCollection(collectionModel.toDto())
      .subscribe(
        (code: string) => collectionModel.code = code,
        (error: LumeerError) => {
          if (error instanceof BadInputError) {
            this.errorMessage = error.reason;
          } else {
            throw error;
          }
        }
      );
  }

}
