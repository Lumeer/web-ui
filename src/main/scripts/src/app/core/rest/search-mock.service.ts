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

import {Injectable} from '@angular/core';

import {Suggestions} from '../dto/suggestions';
import {Observable} from 'rxjs/Observable';
import {Collection} from '../dto/collection';
import 'rxjs/add/observable/of';

@Injectable()
export class SearchMockService {

  private collections: Collection[] = [
    {code: 'code1', name: 'Universities', icon: SearchMockService.randomIcon(), color: SearchMockService.randomColor()},
    {code: 'code2', name: 'Unintendo', icon: SearchMockService.randomIcon(), color: SearchMockService.randomColor()},
    {code: 'code3', name: 'Ualaa', icon: SearchMockService.randomIcon(), color: SearchMockService.randomColor()},
    {code: 'code4', name: 'Doors', icon: SearchMockService.randomIcon(), color: SearchMockService.randomColor()},
    {code: 'code5', name: 'Dogs', icon: SearchMockService.randomIcon(), color: SearchMockService.randomColor()},
    {code: 'code6', name: 'Floors', icon: SearchMockService.randomIcon(), color: SearchMockService.randomColor()},
    {code: 'code7', name: 'Fairytale', icon: SearchMockService.randomIcon(), color: SearchMockService.randomColor()},
    {code: 'code8', name: 'Pools', icon: SearchMockService.randomIcon(), color: SearchMockService.randomColor()},
    {code: 'code9', name: 'Rivers', icon: SearchMockService.randomIcon(), color: SearchMockService.randomColor()},
    {code: 'code10', name: 'Richards', icon: SearchMockService.randomIcon(), color: SearchMockService.randomColor()},
    {code: 'code11', name: 'Abcdefgh', icon: SearchMockService.randomIcon(), color: SearchMockService.randomColor()}
  ];

  private attributeNames = ['Name', 'Title', 'Description', 'Valid', 'Created',
    'Modified', 'Subject', 'Valid From', 'Noise', 'Decrement', 'Nanana'];

  public suggest(text: string, shouldSearchForCollections: boolean = false): Observable<Suggestions> {
    const suggestText = text.toLowerCase();
    if (suggestText.includes(':')) {
      const split = suggestText.split(':', 2);
      const collectionName = split[0].trim();
      const attributeName = split[1].trim();
      let collections: Collection[] = [];
      if (shouldSearchForCollections) {
        collections = this.getCollections(collectionName);
      }
      return Observable.of<Suggestions>({
        attributes: this.getAttributes(this.getCollection(collectionName), attributeName),
        collections: collections,
        views: []
      });
    }
    return Observable.of<Suggestions>({
      attributes: [],
      collections: this.getCollections(suggestText),
      views: []
    });
  }

  private getCollection(text: string): Collection {
    return this.collections.find(collection => collection.name.toLowerCase() === text);
  }

  private getCollections(text: string): Collection[] {
    return this.collections.filter(collection => collection.name.toLowerCase().startsWith(text));
  }

  private getAttributes(collection: Collection, text: string): Collection[] {
    let attributes: Collection[] = [];
    let filtered = this.attributeNames.filter(attribute => attribute.toLowerCase().startsWith(text));
    filtered.forEach(attrName => {
      attributes.push({
        code: collection.code, name: collection.name,
        icon: collection.icon, color: collection.color,
        attributes: [{name: attrName, fullName: attrName, constraints: [], usageCount: 10}]
      });
    });
    return attributes;
  }

  private static randomIcon(): string {
    const array = ['bed', 'laptop', 'key', 'ship', 'umbrella', 'tree'];
    const random = Math.floor(Math.random() * array.length);
    return 'fas fa-' + array[random];
  }

  private static randomColor(): string {
    const array = ['F44336', '2196F3', '4DB6AC', 'D4E157', 'A1887F', 'FFEE58'];
    const random = Math.floor(Math.random() * array.length);
    return '#' + array[random];
  }

}
