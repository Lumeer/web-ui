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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ViewChildren, QueryList} from '@angular/core';
import {Attribute, Collection} from '../../../../../core/store/collections/collection';
import {InputBoxComponent} from '../../../../../shared/input/input-box/input-box.component';
import {ConstraintType} from '@lumeer/data-filters';
import {AppState} from '../../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {NotificationsAction} from '../../../../../core/store/notifications/notifications.action';

@Component({
  selector: 'collection-attributes-table',
  templateUrl: './collection-attributes-table.component.html',
  styleUrls: ['./collection-attributes-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionAttributesTableComponent {
  @Input()
  public collection: Collection;

  @Output()
  public setDefault = new EventEmitter<Attribute>();

  @Output()
  public delete = new EventEmitter<Attribute>();

  @Output()
  public function = new EventEmitter<Attribute>();

  @Output()
  public attributeType = new EventEmitter<Attribute>();

  @Output()
  public rename = new EventEmitter<{attribute: Attribute; newName: string}>();

  @ViewChildren('attributeNameInput')
  public attributesInputs: QueryList<InputBoxComponent>;

  public readonly inputRegex = /\./g;
  public readonly constraintType = ConstraintType;

  public searchString: string;

  constructor(private store$: Store<AppState>) {}

  public setDefaultAttribute(attribute: Attribute) {
    this.setDefault.emit(attribute);
  }

  public onDeleteAttribute(attribute: Attribute) {
    this.delete.emit(attribute);
  }

  public trackByAttributeId(index: number, attribute: Attribute) {
    return attribute.id;
  }

  public resetAttributeName(attribute: Attribute) {
    const index = (this.collection?.attributes || []).findIndex(attr => attr.id === attribute.id);
    const inputComponent = this.attributesInputs?.toArray()[index];
    inputComponent?.setValue(attribute.name);
  }

  public onNewName(attribute: Attribute, newName: string) {
    const trimmedValue = (newName || '').trim();
    if (trimmedValue !== attribute.name) {
      if (this.attributeExist(trimmedValue, attribute.id)) {
        this.store$.dispatch(new NotificationsAction.ExistingAttributeWarning({name: trimmedValue}));
        this.resetAttributeName(attribute);
      } else {
        this.rename.emit({attribute, newName});
      }
    }
  }

  private attributeExist(name: string, excludeId: string): boolean {
    return (this.collection?.attributes || []).some(attribute => attribute.id !== excludeId && attribute.name === name);
  }

  public onAttributeFunction(attribute: Attribute) {
    this.function.emit(attribute);
  }

  public onAttributeType(attribute: Attribute) {
    this.attributeType.emit(attribute);
  }
}
