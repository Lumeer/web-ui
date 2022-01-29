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
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {Collection} from '../../../../../../../core/store/collections/collection';
import {AttributesResourceType} from '../../../../../../../core/model/resource';
import {DropdownOption} from '../../../../../../../shared/dropdown/options/dropdown-option';
import {OptionsDropdownComponent} from '../../../../../../../shared/dropdown/options/options-dropdown.component';
import {KanbanCreateResource} from '../../../../util/kanban-data';
import {attributesResourcesAreSame, getAttributesResourceType} from '../../../../../../../shared/utils/resource.utils';
import {LinkType} from '../../../../../../../core/store/link-types/link.type';

@Component({
  selector: 'kanban-column-footer',
  templateUrl: './kanban-column-footer.component.html',
  styleUrls: ['./kanban-column-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanColumnFooterComponent implements OnChanges {
  @Input()
  public resources: KanbanCreateResource[];

  @Input()
  public count: number = 0;

  @Output()
  public selectResource = new EventEmitter<KanbanCreateResource>();

  @ViewChild(OptionsDropdownComponent)
  public dropdown: OptionsDropdownComponent;

  public dropdownOptions: DropdownOption[] = [];

  public ngOnChanges(changes: SimpleChanges) {
    this.dropdownOptions = this.uniqueResources().map(resourceCreate => ({
      value: resourceCreate,
      displayValue: resourceCreate.resource.name,
      ...this.createIconsAndColors(resourceCreate),
    }));
  }

  private uniqueResources(): KanbanCreateResource[] {
    return (this.resources || []).reduce((resources, resource) => {
      if (!resources.some(res => attributesResourcesAreSame(res.resource, resource.resource))) {
        resources.push(resource);
      }

      return resources;
    }, []);
  }

  private createIconsAndColors(createResource: KanbanCreateResource): { icons: string[]; iconColors: string[] } {
    if (getAttributesResourceType(createResource.resource) === AttributesResourceType.Collection) {
      const collection = <Collection>createResource.resource;
      return {icons: [collection.icon], iconColors: [collection.color]};
    } else if (getAttributesResourceType(createResource.resource) === AttributesResourceType.LinkType) {
      const linkType = <LinkType>createResource.resource;
      return {
        icons: linkType.collections?.map(collection => collection?.icon) || [],
        iconColors: linkType.collections?.map(collection => collection?.color) || [],
      };
    }
    return {icons: [], iconColors: []};
  }

  public onButtonClick() {
    if (this.dropdownOptions.length === 1) {
      this.onOptionSelect(this.dropdownOptions[0]);
    } else {
      this.dropdown.open();
    }
  }

  public onOptionSelect(option: DropdownOption) {
    const value = option.value as KanbanCreateResource;
    this.selectResource.emit(value);
  }
}
