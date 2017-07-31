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
import * as Const from '../../../const';

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
  public iconsPerPage: number = 36;
  public collectionMinCharacters = 3;
  public icons: string[] = Const.icons;
  public colors: string[] = Const.colors;
  public newCollections: CollectionModel[] = [];
  public collections: Collection[];
  public numbers: any[];
  public cachedName: string;
  public selectedIcon: string;
  public selectedColor: string;

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

  public onNewIconAndColor(collectionModel: CollectionModel) {
    collectionModel.icon = this.selectedIcon;
    collectionModel.color = this.selectedColor;
    collectionModel.pickerVisible = false;
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

  private loadCollections() {
    this.collectionService.getCollections()
      .subscribe((collections: Collection[]) => this.collections = collections);
  }

  private updateCollection(collectionModel: CollectionModel) {
    this.collectionService.updateCollection(collectionModel.code, collectionModel.toDto())
      .subscribe();
  }

  private createCollection(collectionModel: CollectionModel) {
    this.collectionService.createCollection(collectionModel.toDto())
      .subscribe((code: string) => collectionModel.code = code);
  }

}
