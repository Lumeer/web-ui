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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {AttributesSettings, ResourceAttributeSettings} from '../../../../core/store/views/view';
import {AttributesResource, AttributesResourceType} from '../../../../core/model/resource';
import {AttributesResourceData} from '../attributes-settings-configuration';

@Component({
  selector: 'attributes-settings-content',
  templateUrl: './attributes-settings-content.component.html',
  styleUrls: ['./attributes-settings-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributesSettingsContentComponent {
  @Input()
  public attributesResourcesData: AttributesResourceData[];

  @Input()
  public settings: AttributesSettings;

  @Output()
  public settingsChanged = new EventEmitter<AttributesSettings>();

  public onResourceSettingsChanged(
    settingsOrder: ResourceAttributeSettings[],
    index: number,
    resource: AttributesResource,
    type: AttributesResourceType,
    attributeSettings: ResourceAttributeSettings
  ) {
    const settingsOrderCopy = [...settingsOrder];
    settingsOrderCopy[index] = attributeSettings;

    if (type === AttributesResourceType.Collection) {
      this.emitCollectionChange(settingsOrderCopy, resource);
    } else {
      this.emitLinkTypeChange(settingsOrderCopy, <LinkType>resource);
    }
  }

  public onResourceSettingsDropped(
    settingsOrder: ResourceAttributeSettings[],
    resource: AttributesResource,
    type: AttributesResourceType,
    event: CdkDragDrop<any>
  ) {
    if (event.currentIndex !== event.previousIndex) {
      const settingsOrderCopy = [...settingsOrder];
      moveItemInArray(settingsOrderCopy, event.previousIndex, event.currentIndex);

      if (type === AttributesResourceType.Collection) {
        this.emitCollectionChange(settingsOrderCopy, resource);
      } else {
        this.emitLinkTypeChange(settingsOrderCopy, <LinkType>resource);
      }
    }
  }

  private emitCollectionChange(settingsOrder: ResourceAttributeSettings[], collection: Collection) {
    const settingsCopy: AttributesSettings = {
      ...this.settings,
      collections: {...this.settings?.collections, [collection.id]: settingsOrder},
    };
    this.settingsChanged.next(settingsCopy);
  }

  private emitLinkTypeChange(settingsOrder: ResourceAttributeSettings[], linkType: LinkType) {
    const settingsCopy: AttributesSettings = {
      ...this.settings,
      linkTypes: {...this.settings?.linkTypes, [linkType.id]: settingsOrder},
    };
    this.settingsChanged.next(settingsCopy);
  }

  public trackByAttributeSettings(index: number, settings: ResourceAttributeSettings): string {
    return settings.attributeId;
  }

  public trackByResourceId(index: number, data: AttributesResourceData): string {
    return data.resource.id;
  }
}
