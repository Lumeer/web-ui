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

import {Component, Input} from '@angular/core';

import {Collection} from '../../../core/dto/collection';
import {Attribute} from '../../../core/dto/attribute';
import * as Const from '../constraints';

@Component({
  selector: 'link-attribute-list',
  templateUrl: './link-attribute-list.component.html',
  styleUrls: ['./link-attribute-list.component.scss']
})
export class LinkAttributeListComponent {

  @Input()
  public collection: Collection;

  @Input()
  public limit = Number.MAX_SAFE_INTEGER;

  public attributes(): Attribute[] {
    return this.collection.attributes.slice(0, this.limit);
  }

  // public createAttribute(newAttributeName: string): void {
  //   this.newAttributeName = '';
  //   const newAttribute = this.emptyAttribute();
  //   newAttribute.fullName = newAttributeName;
  //   newAttribute.name = newAttributeName;
  //
  //   this.collectionService.updateAttribute(this.collection.code, newAttributeName, newAttribute)
  //     .retry(3)
  //     .subscribe(
  //       attribute => this.collection.attributes.push(attribute),
  //       error => this.notificationService.error('Error', 'Failed creating attribute')
  //     );
  // }
  //
  // public updateAttribute(attribute: Attribute, index?: number): void {
  //   const previousFullName = attribute.fullName;
  //   attribute.fullName = attribute.name;
  //
  //   this.collectionService.updateAttribute(this.collection.code, previousFullName, attribute)
  //     .retry(3)
  //     .subscribe(
  //       attribute => !isNullOrUndefined(index) && (this.collection.attributes[index] = attribute),
  //       error => this.notificationService.error('Error', 'Failed updating attribute')
  //     );
  // }
  //
  // public removeAttribute(attribute: Attribute, index?: number): void {
  //   const removed = this.collection.attributes[index];
  //   this.collectionService.removeAttribute(this.collection.code, removed.fullName)
  //     .retry(3)
  //     .subscribe(
  //       () => this.collection.attributes.splice(index, 1),
  //       error => this.notificationService.error('Error', 'Failed removing attribute')
  //     );
  // }

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
