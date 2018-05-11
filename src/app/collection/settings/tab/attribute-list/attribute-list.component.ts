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
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {isNullOrUndefined} from 'util';
import {Collection} from '../../../../core/dto/collection';
import {CollectionService} from '../../../../core/rest/collection.service';
import * as Const from '../constraints';

import {ConfiguredAttribute} from './configured-attribute';
import {ConstraintSuggestion} from './constraint-suggestion';
import {Attribute} from '../../../../core/dto';

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

  public lumeerSuggestions: ConstraintSuggestion[] = [];

  public editedAttributeId;

  public selectedSuggestionIndex = -1;

  constructor(private collectionService: CollectionService,
              private i18n: I18n,
              private notificationService: NotificationService) {
  }

  private emptyAttribute(): Attribute {
    return {
      constraints: [],
      name: '',
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

  public removeDefaultAttribute(): void {
    this.collection.defaultAttribute = null;
    // this.updateCollection(); // TODO uncomment once backend supports defaultAttributes
  }

  public createAttribute(newAttributeName: string): void {
    const newAttribute = this.emptyAttribute();
    newAttribute.name = newAttributeName;
    this.newAttributeName = '';

    this.collectionService.createAttribute(this.collection.id , newAttribute)
      .subscribe(
        attribute => this.collection.attributes.push(attribute),
        () => {
          const message = this.i18n({id: 'collection.attribute.create.fail', value: 'Failed creating attribute'});
          this.notificationService.error(message);
        }
      );
  }

  public updateAttribute(attribute: ConfiguredAttribute, index?: number): void {
    this.collectionService.updateAttribute(this.collection.id, this.editedAttributeId, attribute)
      .subscribe(
        attribute => {
          if (!isNullOrUndefined(index)) {
            this.collection.attributes[index] = attribute;
          }
        },
        error => this.notificationService.error('Failed updating attribute')
      );
  }

  public removeAttribute(attribute: ConfiguredAttribute, index?: number): void {
    const removed = this.collection.attributes[index];
    this.collectionService.removeAttribute(this.collection.id, this.editedAttributeId)
      .subscribe(
        () => this.collection.attributes.splice(index, 1),
        error => console.error(error)
      );
  }

  public addConstraint(attribute: ConfiguredAttribute, constraint: string): void {
    const toCamelCase = str => str
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
      .replace(':', ': ');

    attribute.constraints.push(toCamelCase(constraint));
    attribute.newConstraint = '';

    this.updateAttribute(attribute);
    this.preSelectRelevantConstraintInput(constraint, attribute);
  }

  private preSelectRelevantConstraintInput(constraint: string, attribute: ConfiguredAttribute) {
    if (constraint.endsWith(':')) {
      setTimeout(() => {
        document.getElementById('constraint' + (attribute.constraints.length - 1)).focus();
      });
    } else {
      document.getElementById(attribute.id).focus();
    }
  }

  public removeConstraint(attribute: ConfiguredAttribute, constraintIndex: number): void {
    attribute.constraints.splice(constraintIndex, 1);
    this.updateAttribute(attribute);
  }

  public constraintBackspace(attribute: ConfiguredAttribute): void {
    !attribute.newConstraint && this.removeConstraint(attribute, attribute.constraints.length - 1);
  }

  public matchesSearch(attribute: ConfiguredAttribute): boolean {
    return attribute.name.includes(this.searched) ||
      this.formatNumber(attribute.usageCount).includes(this.searched) ||
      attribute.constraints.find(constraint => constraint.includes(this.searched)) !== undefined;
  }

  public refreshSuggestions(): void {
    const flattenSuggestion = (constraints, listSuggestion) => new ConstraintSuggestion(constraints, listSuggestion);
    const flattenConstraints = constraints => constraints.list.reduce((array, current) => {
      return array.concat(flattenSuggestion(constraints, current));
    }, []);
    const flatten = (flattenedList, currentList) => flattenedList.concat(currentList);

    this.refreshConstraintSuggestions(flattenConstraints, flatten);
    this.refreshLummeerSuggestions(flattenConstraints, flatten);
  }

  private refreshConstraintSuggestions(flattenConstraints: (constraints?) => any, flatten: (flattenedList, currentList) => any) {
    const nonNull = stringOrNull => stringOrNull ? stringOrNull : '';
    const startsWith = (str, start) => nonNull(str).toLowerCase().startsWith(nonNull(start).toLowerCase());

    this.suggestions = Const.constraints.map(flattenConstraints)
      .reduce(flatten, [])
      .filter(suggestion => startsWith(suggestion.name, this.activeAttribute['newConstraint']))
      .filter(suggestion => !this.activeAttribute.constraints.find(constraint => startsWith(constraint, suggestion.name)))
      .slice(0, 5);
  }

  private refreshLummeerSuggestions(flattenConstraints: (constraints?) => any, flatten: (flattenedList, currentList) => any) {
    const usedColors = this.activeAttribute.constraints.map(constraint => this.constraintColor(constraint));
    const uniqueUsedColors = new Set(usedColors);

    this.lumeerSuggestions = Const.constraints.map(flattenConstraints)
      .reduce(flatten, [])
      .filter(suggestion => uniqueUsedColors.has(suggestion.color))
      .slice(0, 6);
  }

  public selectUpperSuggestion(): void {
    this.selectedSuggestionIndex = Math.max(0, Math.min(this.selectedSuggestionIndex - 1, this.suggestions.length - 1));
    document.getElementById('suggestion' + this.selectedSuggestionIndex).focus();
  }

  public selectLowerSuggestion(): void {
    this.selectedSuggestionIndex = Math.max(0, Math.min(this.selectedSuggestionIndex + 1, this.suggestions.length - 1));
    document.getElementById('suggestion' + this.selectedSuggestionIndex).focus();
  }

  public addSelectedSuggestion(attribute: ConfiguredAttribute): void {
    const focused = document.getElementById('suggestion' + this.selectedSuggestionIndex);
    this.addConstraint(attribute, focused.textContent);

    this.selectedSuggestionIndex = -1;
  }

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
    constraint = constraint
      .replace(/\s/g, '')
      .replace(/:.*$/, ':')
      .toLowerCase();

    const constraintType = Const.constraints.find(constraintType => {
      return constraintType.list
        .map(constraintName => constraintName.replace(/\s/g, '').toLowerCase())
        .includes(constraint);
    });
    return constraintType ? constraintType.color : '#858585';
  }

  public darken(color: string, amount: number): string {
    const hexToNumber = (start: number) => parseInt(color.substr(start, 2), 16);
    const subtractAmount = (num: number) => Math.max(0, (num - amount));

    const darkerColors: string = [hexToNumber(1), hexToNumber(3), hexToNumber(5)]
      .map(subtractAmount)
      .join(', ');

    return `rgb(${darkerColors})`;
  }

  public trackByIndex(index: number, obj: any): number {
    return index;
  }

  public publicPath(): string {
    return PUBLIC_PATH;
  }

}
