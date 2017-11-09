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

import {Component, EventEmitter, Input, Output, SimpleChanges} from '@angular/core';

import {Attribute, Collection} from '../../../../core/dto';
import {HtmlModifier} from '../../../../shared/utils/html-modifier';
import {TablePart} from '../model/table-part';
import {TableLinkEvent} from '../event/table-link-event';
import {AttributeChangeEvent} from '../event/attribute-change-event';

@Component({
  selector: 'table-header',
  templateUrl: './table-header.component.html',
  styleUrls: ['./table-header.component.scss']
})
export class TableHeaderComponent {

  @Input()
  public editable = true;

  @Input()
  public parts: TablePart[] = [];

  @Output()
  public createAttribute = new EventEmitter<AttributeChangeEvent>();

  @Output()
  public renameAttribute = new EventEmitter<AttributeChangeEvent>();

  @Output()
  public deleteAttribute = new EventEmitter<AttributeChangeEvent>();

  @Output()
  public addLinkedPart = new EventEmitter<TableLinkEvent>();

  public maxAttributeDepth = 1;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('parts')) {
      this.maxAttributeDepth = this.countMaxAttributeDepth();
    }
  }

  private countMaxAttributeDepth(): number {
    const allShownAttributes: Attribute[] = [].concat.apply([], this.parts.map(part => part.shownAttributes));
    const allHiddenAttributes: Attribute[] = [].concat.apply([], this.parts.map(part => part.hiddenAttributes));
    const allAttributes = [].concat(allShownAttributes).concat(allHiddenAttributes);

    return allAttributes.reduce<number>((maxDepth, attribute) => {
      const depth = this.attributeDepth(attribute);
      return depth > maxDepth ? depth : maxDepth;
    }, 0);
  }

  public headerRows(): number[] {
    return Array.from(Array(this.maxAttributeDepth).keys()).map(i => i + 1);
  }

  public attributesOfDepth(attributes: Attribute[], depth: number) {
    return attributes.filter(attr => this.attributeDepth(attr) === depth);
  }

  public attributesOfDepthWithParents(part: TablePart, depth: number): Attribute[] {
    const children = this.attributesOfDepth(part.shownAttributes, depth + 1);
    const attributesWithDuplicities = part.shownAttributes.filter(id => [depth, depth + 1].includes(this.attributeDepth(id)))
      .map(attr => this.attributeDepth(attr) === depth + 1 ? this.getParentAttribute(part.collection, attr) : attr);
    return Array.from(new Set(attributesWithDuplicities));
  }

  private getParentAttribute(collection: Collection, attribute: Attribute) {
    const attributeParts = attribute.fullName.split('.');
    attributeParts.pop();
    const parentId = attributeParts.join('.');
    return collection.attributes.find(attr => attr.fullName === parentId);
  }

  private attributeDepth(attribute: Attribute) {
    return attribute.fullName ? attribute.fullName.split('.').length : 1;
  }

  public countAttributeChildren(parent: Attribute, all: Attribute[]): number {
    const childDepth = this.attributeDepth(parent) + 1;
    return this.attributesOfDepth(all, childDepth).filter(attr => attr.fullName.startsWith(parent.fullName)).length;
  }

  public showColumn(part: TablePart, attribute: Attribute) {
    const index = part.hiddenAttributes.indexOf(attribute);
    part.hiddenAttributes.splice(index, 1);

    part.shownAttributes.push(attribute);
  }

  public showAllColumns(part: TablePart) {
    part.shownAttributes.push(...part.hiddenAttributes);
    part.hiddenAttributes = [];
  }

  public lightenColor(color: string): string {
    return HtmlModifier.shadeColor(color, .5);
  }

  public unplugPart(part: TablePart) {
    this.parts[part.index - 1].rows.forEach(row => row.nextLinkedRows = []);
    this.parts.splice(part.index);
    this.parts[this.parts.length - 1].nextPart = null;
  }

  public onCreateAttribute(collection: Collection, attribute: Attribute) {
    this.createAttribute.emit({collection: collection, attribute: attribute});
  }

  public onRenameAttribute(collection: Collection, attribute: Attribute) {
    this.renameAttribute.emit({collection: collection, attribute: attribute});
  }

  public onDeleteAttribute(collection: Collection, attribute: Attribute) {
    this.deleteAttribute.emit({collection: collection, attribute: attribute});
  }

  public onAddLinkedPart(event: TableLinkEvent) {
    this.addLinkedPart.emit(event);
  }

}
