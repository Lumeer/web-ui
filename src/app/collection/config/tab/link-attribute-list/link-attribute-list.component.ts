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

import {LinkType} from '../../../../core/dto/link-type';
import {LinkedAttribute} from '../../../../core/dto/linked-attribute';
import {Collection} from '../../../../core/dto/collection';
import {NotificationService} from '../../../../notifications/notification.service';
import {LinkTypeService} from '../../../../core/rest/link-type.service';
import * as Const from '../constraints';

@Component({
  selector: 'link-attribute-list',
  templateUrl: './link-attribute-list.component.html',
  styleUrls: ['./link-attribute-list.component.scss']
})
export class LinkAttributeListComponent {

  @Input()
  public collections: { [collectionCode: string]: Collection } = {};

  @Input()
  public linkType: LinkType;

  @Input()
  public addEnabled: boolean;

  @Input()
  public limit = Number.MAX_SAFE_INTEGER;

  @Output()
  public update = new EventEmitter<void>();

  public newAttributeName = '';

  constructor(private notificationService: NotificationService,
              private linkTypeService: LinkTypeService) {
  }

  public attributes(): LinkedAttribute[] {
    return this.linkType.linkedAttributes.slice(0, this.limit);
  }

  public attributesToAdd(currentAttribute: string): LinkedAttribute[] {
    const usedAttributes = this.linkType.linkedAttributes.map(linkedAttribute => JSON.stringify(linkedAttribute));

    return this.linkType.collectionCodes
      .map(collectionCode => this.collections[collectionCode])
      .map(collection => collection.attributes.map(attribute => new LinkedAttribute(attribute, collection)))
      .reduce((flattened: LinkedAttribute[], current: LinkedAttribute[]) => flattened.concat(current), [])
      .filter(linkedAttribute => linkedAttribute.value.name.includes(currentAttribute))
      .filter(linkedAttribute => !usedAttributes.includes(JSON.stringify(linkedAttribute)));
  }

  public addAttribute(linkedAttribute: LinkedAttribute): void {
    this.linkType.linkedAttributes.push(linkedAttribute);

    if (this.linkType.automaticallyLinked && this.linkType.automaticallyLinked.length === 2) {
      this.linkType.automaticallyLinked = null;
    }

    this.newAttributeName = '';
    this.update.emit();
  }

  public removeAttribute(removedAttribute: LinkedAttribute) {
    this.linkType.linkedAttributes = this.linkType.linkedAttributes.filter(linkedAttribute => removedAttribute !== linkedAttribute);

    if (this.linkType.automaticallyLinked && this.linkType.automaticallyLinked.includes(removedAttribute)) {
      this.linkType.automaticallyLinked = null;
    }

    this.update.emit();
  }

  public formatNumber(numberToFormat: number): string {
    const spaceBetweenEveryThreeDigits = /(?=(\d{3})+(?!\d))/g;
    const optionalCommaAtTheStart = /^,/;

    return String(numberToFormat)
      .replace(spaceBetweenEveryThreeDigits, ',')
      .replace(optionalCommaAtTheStart, '');
  }

  public constraintColor(constraint: string): string {
    const removeWhitespace = list => list.map(str => str.replace(/\s/g, ''));
    const shortestLength = list => Math.min(...list.map(str => str.length));
    const trimToShortest = list => list.map(str => str.substring(0, shortestLength(list)));
    const toLowerCase = list => list.map(str => str.toLowerCase());

    const makeComparable = list => toLowerCase(trimToShortest(removeWhitespace(list)));
    const allSame = list => new Set(list).size === 1;

    const matching = (a, b) => allSame(makeComparable([a, b]));
    const containsConstraint = suggestions => suggestions.list.find(suggestion => {
      return matching(suggestion, constraint);
    }) !== undefined;

    const constraintType = Const.constraints.find(containsConstraint);
    return constraintType ? constraintType.color : '#858585';
  }

}
