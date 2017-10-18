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

import {Component, Input} from '@angular/core';
import {LinkType} from '../../../core/dto/link-type';
import {NotificationsService} from 'angular2-notifications/dist';
import {LinkTypeService} from '../../../core/rest/link-type.service';
import {LinkedAttribute} from '../../../core/dto/linked-attribute';
import * as Const from '../constraints';
import {Collection} from '../../../core/dto/collection';

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
  public allAttributes: LinkedAttribute[];

  @Input()
  public addEnabled: boolean;

  @Input()
  public limit = Number.MAX_SAFE_INTEGER;

  public uninitialized: boolean[];

  public newAttributeName = '';

  constructor(private notificationService: NotificationsService,
              private linkTypeService: LinkTypeService) {

  }

  public attributes(): LinkedAttribute[] {
    return this.linkType.linkedAttributes.slice(0, this.limit);
  }

  public addLinkedAttribute(): void {
    if (!this.newAttributeName) {
      return;
    }

    // 'attributeName (collectionCode)'
    const newAttributeName = this.newAttributeName.substring(0, this.newAttributeName.lastIndexOf('(') - 2);
    const newAttributeCollection = this.newAttributeName.substring(
      this.newAttributeName.lastIndexOf('('),
      this.newAttributeName.length - 1
    );

    const newAttribute = this.possibleAttributes().find(possibleAttribute => {
      return possibleAttribute.name === newAttributeName && possibleAttribute.collectionCode === newAttributeCollection;
    });

    if (newAttribute) {
      this.linkType.linkedAttributes.push(newAttribute);

      this.linkTypeService.updateLinkType(this.linkType.fromCollection, this.linkType.name, this.linkType)
        .retry(3)
        .subscribe(
          linkType => {
            this.linkType = linkType;
          },
          error => this.notificationService.error('Error', 'Adding attribute failed')
        );

      this.newAttributeName = '';

    } else {
      this.notificationService.info('Oops', 'You need to use attribute from selection to create a link');
    }

  }

  public removeLinkAttribute(linkType: LinkType, attribute: LinkedAttribute) {
    this.linkType.linkedAttributes = this.linkType.linkedAttributes.filter(linkedAttribute => {
      return linkedAttribute !== attribute;
    });

    if (this.linkType.automaticLinkFromAttribute === attribute.name) {
      this.linkType.automaticLinkFromAttribute = null;
    }

    if (this.linkType.automaticLinkToAttribute === attribute.name) {
      this.linkType.automaticLinkToAttribute = null;
    }

    this.linkTypeService.updateLinkType(this.linkType.fromCollection, this.linkType.name, this.linkType)
      .retry(3)
      .subscribe(
        linkType => {
          this.linkType = linkType;
        },
        error => this.notificationService.error('Error', 'Removing attribute failed')
      );
  }

  public possibleAttributes(): LinkedAttribute[] {
    return this.allAttributes.filter(attribute => !this.linkType.linkedAttributes.includes(attribute));
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
