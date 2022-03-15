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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';
import {ConstraintType} from '@lumeer/data-filters';
import {Store} from '@ngrx/store';
import {AttributesResource, AttributesResourceType} from '../../../core/model/resource';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {Attribute, Collection} from '../../../core/store/collections/collection';
import {InputBoxComponent} from '../../input/input-box/input-box.component';
import {FORBIDDEN_ATTRIBUTE_NAME_CHARACTERS_REGEX} from '../../utils/attribute.utils';
import {AppState} from '../../../core/store/app.state';
import {NotificationsAction} from '../../../core/store/notifications/notifications.action';
import {shadeColor} from '../../utils/html-modifier';
import {COLOR_LINK_DEFAULT} from '../../../core/constants';

@Component({
  selector: 'collection-attributes-table',
  templateUrl: './resource-attributes-table.component.html',
  styleUrls: ['./resource-attributes-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceAttributesTableComponent implements OnChanges {
  @Input()
  public resource: AttributesResource;

  @Input()
  public attributesResourceType: AttributesResourceType;

  @Input()
  public permissions: AllowedPermissions;

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

  public readonly inputRegex = FORBIDDEN_ATTRIBUTE_NAME_CHARACTERS_REGEX;
  public readonly constraintType = ConstraintType;

  public searchString: string;
  public color: string;
  public hasDefaultAttribute: boolean;

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.resource) {
      this.checkResourceParams();
    }
  }

  private checkResourceParams() {
    if (this.attributesResourceType === AttributesResourceType.Collection) {
      this.hasDefaultAttribute = true;
      this.color = shadeColor((<Collection>this.resource).color, 0.5);
    } else {
      this.hasDefaultAttribute = false;
      this.color = COLOR_LINK_DEFAULT;
    }
  }

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
    const index = (this.resource?.attributes || []).findIndex(attr => attr.id === attribute.id);
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
    return (this.resource?.attributes || []).some(attribute => attribute.id !== excludeId && attribute.name === name);
  }

  public onAttributeFunction(attribute: Attribute) {
    this.function.emit(attribute);
  }

  public onAttributeType(attribute: Attribute) {
    this.attributeType.emit(attribute);
  }
}
