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

import {NotificationsService} from 'angular2-notifications/dist';

import {ConfiguredAttribute} from './configured-attribute';
import {ConstraintSuggestion} from './constraint-suggestion';
import {CollectionService} from '../../../core/rest/collection.service';
import {Collection} from '../../../core/dto/collection';
import {isNullOrUndefined} from 'util';
import * as Const from '../constraints';

@Component({
  selector: 'attribute-list',
  templateUrl: './attribute-list.component.html',
  styleUrls: ['./attribute-list.component.scss']
})
export class AttributeListComponent {

  @Input()
  public collection: Collection;

  @Input()
  public limit = Number.MAX_SAFE_INTEGER;

  @Input()
  public allowSettingPrimaryAttribute = true;

  @Input()
  public allowCreatingAttributes = true;

  @Input()
  public colored = true;

  public searched = '';

  public newAttributeName = '';

  public activeSearch = false;

  public mouseOver = {attribute: null, constraint: ''};

  public activeAttribute = this.emptyAttribute();

  public suggestions: ConstraintSuggestion[] = [];

  constructor(private collectionService: CollectionService,
              private notificationService: NotificationsService) {

  }

  private emptyAttribute(): ConfiguredAttribute {
    return {
      constraints: [],
      name: '',
      fullName: '',
      newConstraint: '',
      usageCount: 0
    };
  }

  public attributes(): ConfiguredAttribute[] {
    return this.collection.attributes
      .map(attribute => attribute as ConfiguredAttribute)
      .slice(0, this.limit);
  }

  public setDefaultAttribute(attribute: ConfiguredAttribute): void {
    this.collection.defaultAttribute = attribute;
    // this.updateCollection(); // TODO uncomment once backend supports defaultAttributes
  }

  public createAttribute(newAttributeName: string): void {
    this.newAttributeName = '';
    const newAttribute = this.emptyAttribute();
    newAttribute.fullName = newAttributeName;
    newAttribute.name = newAttributeName;

    this.collectionService.updateAttribute(this.collection.code, newAttributeName, newAttribute)
      .subscribe(
        attribute => this.collection.attributes.push(attribute),
        error => this.notificationService.error('Error', 'Failed creating attribute')
      );
  }

  public updateAttribute(attribute: ConfiguredAttribute, index?: number): void {
    const previousFullName = attribute.fullName;
    attribute.fullName = attribute.name;

    this.collectionService.updateAttribute(this.collection.code, previousFullName, attribute)
      .subscribe(
        attribute => !isNullOrUndefined(index) && (this.collection.attributes[index] = attribute),
        error => this.notificationService.error('Error', 'Failed updating attribute')
      );
  }

  public removeAttribute(attribute: ConfiguredAttribute, index?: number): void {
    const removed = this.collection.attributes[index];
    this.collectionService.removeAttribute(this.collection.code, removed.fullName)
      .subscribe(
        () => this.collection.attributes.splice(index, 1),
        error => console.error(error)
      );
  }

  public addConstraint(attribute: ConfiguredAttribute, constraint: string): void {
    constraint && (attribute.newConstraint = constraint);

    const toCamelCase = str => str
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
      .replace(':', ': ');

    attribute.constraints.push(toCamelCase(attribute.newConstraint));
    attribute.newConstraint = '';

    this.updateAttribute(attribute);
  }

  public removeConstraint(attribute: ConfiguredAttribute, constraintIndex: number): void {
    attribute.constraints.splice(constraintIndex, 1);
    this.updateAttribute(attribute);
  }

  public constraintBackspace(attribute: ConfiguredAttribute): void {
    !attribute.newConstraint && this.removeConstraint(attribute, attribute.constraints.length - 1);
  }

  public matchesSearch(attribute: ConfiguredAttribute): boolean {
    const isSearched = str => str.toLowerCase().includes(this.searched);

    return isSearched(attribute.name) ||
      isSearched(this.formatNumber(attribute.usageCount)) ||
      attribute.constraints.find(isSearched) !== undefined;
  }

  public refreshSuggestions(): void {
    const flattenSuggestion = (constraints, listSuggestion) => new ConstraintSuggestion(constraints, listSuggestion);
    const flattenConstraints = constraints => constraints.list.reduce((array, current) => {
      return array.concat(flattenSuggestion(constraints, current));
    }, []);
    const flatten = (flattenedList, currentList) => flattenedList.concat(currentList);

    const nonNull = stringOrNull => stringOrNull ? stringOrNull : '';
    const startsWith = (str, start) => nonNull(str).toLowerCase().startsWith(nonNull(start).toLowerCase());

    this.suggestions = Const.constraints.map(flattenConstraints)
      .reduce(flatten, [])
      .filter(suggestion => startsWith(suggestion.name, this.activeAttribute.newConstraint))
      .filter(suggestion => !this.activeAttribute.constraints.includes(suggestion.name))
      .slice(0, 5);
  }

  //======= Visual functions =======//
  public hexColorOpacity(hexColor: string, opacity: number): string {
    const hexToNumber = (start: number) => parseInt(hexColor.substr(start, 2), 16);
    const fadedColor = [hexToNumber(1), hexToNumber(3), hexToNumber(5), opacity].join(', ');

    return `rgba(${fadedColor})`;
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

  public darken(color: string, amount: number): string {
    const hexToNumber = (start: number) => parseInt(color.substr(start, 2), 16);
    const subtractAmount = (num: number) => Math.max(0, (num - amount));

    const darkerColors: string = [hexToNumber(1), hexToNumber(3), hexToNumber(5)]
      .map(subtractAmount)
      .join(', ');

    return `rgb(${darkerColors})`;
  };

}
