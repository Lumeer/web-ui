/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';

import {QueryItem} from './model/query-item';
import {FormGroup} from '@angular/forms';
import {AttributeValueComponent} from './attribute-value/attribute-value.component';
import {AttributeConditionComponent} from './attribute-condition/attribute-condition.component';
import {Constraint, ConstraintData, ConstraintType} from '../../../../core/model/data/constraint';
import {QueryItemType} from './model/query-item-type';
import {AttributeQueryItem} from './model/attribute.query-item';
import {LinkAttributeQueryItem} from './model/link-attribute.query-item';

@Component({
  selector: 'query-item',
  templateUrl: './query-item.component.html',
  styleUrls: ['./query-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryItemComponent {
  @Input()
  public queryItem: QueryItem;

  @Input()
  public queryItemForm: FormGroup;

  @Input()
  public readonly: boolean;

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public remove = new EventEmitter();

  @Output()
  public enter = new EventEmitter();

  @Output()
  public change = new EventEmitter();

  @ViewChild(AttributeValueComponent, {static: false})
  public attributeValueComponent: AttributeValueComponent;

  @ViewChild(AttributeConditionComponent, {static: false})
  public attributeConditionComponent: AttributeConditionComponent;

  public onRemove() {
    this.remove.emit();
  }

  public focusCondition() {
    this.attributeConditionComponent.setEditing();
  }

  public moveFocusToValue() {
    if (this.constraint && this.constraint.type === ConstraintType.Boolean) {
      this.attributeConditionComponent.blur();
    } else {
      this.attributeValueComponent.setEditing();
    }
  }

  private get constraint(): Constraint {
    if (this.queryItem.type === QueryItemType.Attribute || this.queryItem.type === QueryItemType.LinkAttribute) {
      const attributeItem = this.queryItem as AttributeQueryItem | LinkAttributeQueryItem;
      return attributeItem.attribute && attributeItem.attribute.constraint;
    }
    return null;
  }

  public onEnter() {
    this.enter.emit();
  }

  public isFormValid(): boolean {
    if (this.readonly || !this.queryItemForm) {
      return true;
    }
    return this.queryItemForm.valid;
  }

  public onQueryItemChanged() {
    if (this.isFormValid()) {
      this.change.emit();
    }
  }
}
