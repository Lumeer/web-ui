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
import {trigger, state, style, transition, animate, keyframes} from '@angular/animations';

import {CollectionService} from '../../../../core/rest/collection.service';
import {Perspective} from '../../perspective';
import {Collection} from '../../../../core/dto/collection';
import * as Const from '../../../const';

@Component({
  selector: 'post-it-collections-perspective',
  templateUrl: './post-it-collections-perspective.component.html',
  styleUrls: ['./post-it-collections-perspective.component.scss'],
  animations: [
    trigger('animateVisible', [
      state('in', style({height: '*', width: '*', opacity: 1})),
      transition('void => *', [
        animate(200, keyframes([
          style({height: 0, width: 0, opacity: 0, offset: 0}),
          style({height: '*', width: '*', opacity: 1, offset: 1})
        ]))
      ]),
      transition('* => void', [
        animate(200, keyframes([
          style({height: '*', width: '*', opacity: 1, offset: 0}),
          style({height: 0, width: 0, opacity: 0, offset: 1})
        ]))
      ])
    ])
  ]
})
export class PostItCollectionsPerspectiveComponent implements Perspective, OnInit {

  @Input()
  public query: string;

  @Input()
  public editable: boolean;

  public placeholderTitle: string = Const.placeHolderNewCollection;
  public iconsPerPage: number = Const.iconsPerPage;
  public icons: string[] = Const.icons;
  public colors: string[] = Const.colors;
  public collectionMinCharacters = Const.collectionMinCharacters;
  public newCollections: Collection[] = [];
  public collections: Collection[];
  public numbers: any[];
  public cachedName: string;
  public selectedIcon: string;
  public selectedColor: string;

  constructor(private collectionService: CollectionService) {
    this.numbers = Array.apply(null, {length: this.iconsPerPage}).map(Number.call, Number);
  }

  public ngOnInit(): void {
    this.loadCollections();
  }

  public onNewCollection() {
    this.newCollections.splice(0, 0, new Collection());
  }

  public onRemoveNewCollection(ix: number) {
    this.newCollections.splice(ix, 1);
  }

  public onNewIconAndColor(collection: Collection) {
    collection.icon = this.selectedIcon;
    collection.color = this.selectedColor;
    collection.pickerVisible = false;
    if (collection.code) {
      this.updateCollection(collection);
    }
  }

  public togglePicker(collection: Collection) {
    if (collection.pickerVisible) {
      collection.pickerVisible = false;
      return;
    }
    this.selectedColor = collection.color;
    this.selectedIcon = collection.icon;
    this.newCollections.forEach(coll => coll.pickerVisible = false);
    collection.pickerVisible = true;
  }

  public onFocusCollectionName(collection: Collection) {
    if (collection.code) {
      this.cachedName = collection.name;
    }
  }

  public onBlurCollectionName(collection: Collection) {
    if (collection.code) {
      if (collection.name.length < this.collectionMinCharacters) {
        collection.name = this.cachedName;
      } else if (collection.name !== this.cachedName) {
        this.updateCollection(collection);
      }
    } else if (collection.name.length >= this.collectionMinCharacters) {
      this.createCollection(collection);
    }
  }

  private loadCollections() {
    this.collectionService.getCollections()
      .subscribe((collections: Collection[]) => this.collections = collections);
  }

  private updateCollection(collection: Collection) {
    this.collectionService.updateCollection(collection.code, collection)
      .subscribe();
  }

  private createCollection(collection: Collection) {
    this.collectionService.createCollection(collection)
      .subscribe((code: string) => collection.code = code);
  }
}
