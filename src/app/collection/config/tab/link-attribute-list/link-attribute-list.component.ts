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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {LinkedAttribute} from '../../../../core/dto';
import {Collection} from '../../../../core/dto/collection';

import {LinkType} from '../../../../core/dto/link-type';
import {CollectionService, LinkTypeService} from '../../../../core/rest';
import * as Const from '../constraints';

@Component({
  selector: 'link-attribute-list',
  templateUrl: './link-attribute-list.component.html',
  styleUrls: ['./link-attribute-list.component.scss']
})
export class LinkAttributeListComponent {

  @Input()
  public collections: { [collectionId: string]: Collection } = {};

  @Input()
  public linkType: LinkType;

  @Input()
  public expanded: boolean;

  @Output()
  public update = new EventEmitter<void>();

  public newAttributeName = '';

  public attributesToAdd(currentAttribute: string): LinkedAttribute[] {
    return this.linkType.collectionIds
      .map(collectionId => this.collections[collectionId])
      .map(collection => collection.attributes.map(attribute => new LinkedAttribute(attribute, collection)))
      .reduce((flattened: LinkedAttribute[], current: LinkedAttribute[]) => flattened.concat(current), [])
      .filter(linkedAttribute => linkedAttribute.value.name.includes(currentAttribute));
  }

  public addAttribute(linkedAttribute: LinkedAttribute): void {
    this.linkType.attributes.push(linkedAttribute.value.name);
    this.newAttributeName = '';
    this.update.emit();
  }

  public removeAttribute(removedAttribute: LinkedAttribute) {
    this.linkType.attributes = this.linkType.attributes.filter(attribute => removedAttribute.value.name !== attribute);
    this.update.emit();
  }

}
