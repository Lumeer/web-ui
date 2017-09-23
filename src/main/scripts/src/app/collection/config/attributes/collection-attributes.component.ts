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

import {Component} from '@angular/core';

import {CollectionTabComponent} from '../collection-tab.component';
import {ConfiguredAttribute} from './configured-attribute';
import {isNullOrUndefined} from 'util';
import {ConstraintSuggestion} from './constraint-suggestion';
import * as Const from './constraints';

@Component({
  selector: 'collection-attributes',
  templateUrl: './collection-attributes.component.html',
  styleUrls: ['./collection-attributes.component.scss']
})
export class CollectionAttributesComponent extends CollectionTabComponent {

  public searched = '';

  public activeSearch = false;

  public mouseOver = {attribute: null, constraint: ''};

  public activeAttribute: ConfiguredAttribute = {
    constraints: [],
    name: '',
    fullName: '',
    newConstraint: '',
    usageCount: 0
  };

  public suggestions: ConstraintSuggestion[] = [];

  public setDefaultAttribute(attribute: ConfiguredAttribute): void {
    this.collection.defaultAttribute = attribute;
    // this.updateCollection(); // TODO uncomment once backend supports defaultAttributes
  }

  public updateAttribute(attribute: ConfiguredAttribute, index?: number): void {
    const previousFullName = attribute.fullName;
    attribute.fullName = attribute.name;
    this.collectionService.updateAttribute(this.collection.code, previousFullName, attribute)
      .retry(3)
      .subscribe(
        attribute => !isNullOrUndefined(index) && (this.collection.attributes[index] = attribute),
        error => this.notificationService.error('Error', 'Failed updateing attribute')
      );
  }

  public removeConstraint(attribute: ConfiguredAttribute, constraintIndex: number): void {
    const removed = attribute.constraints[constraintIndex];
    attribute.constraints.splice(constraintIndex, 1);
    this.updateAttribute(attribute);
  }

  public addConstraint(attribute: ConfiguredAttribute, constraint: string): void {
    constraint && (attribute.newConstraint = constraint);

    attribute.constraints.push(attribute.newConstraint);
    attribute.newConstraint = '';

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
