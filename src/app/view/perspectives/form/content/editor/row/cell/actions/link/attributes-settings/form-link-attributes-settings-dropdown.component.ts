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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {AttributesSettings} from '../../../../../../../../../../core/store/views/view';
import {LinkType} from '../../../../../../../../../../core/store/link-types/link.type';
import {AttributesResourceData} from '../../../../../../../../../../shared/settings/attributes/attributes-settings-configuration';
import {AttributesResourceType} from '../../../../../../../../../../core/model/resource';
import {Collection} from '../../../../../../../../../../core/store/collections/collection';
import {getDefaultAttributeId} from '../../../../../../../../../../core/store/collections/collection.util';
import {DropdownDirective} from '../../../../../../../../../../shared/dropdown/dropdown.directive';

@Component({
  selector: 'form-link-attributes-settings-dropdown',
  templateUrl: './form-link-attributes-settings-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormLinkAttributesSettingsDropdownComponent extends DropdownDirective implements OnChanges {
  @Input()
  public settings: AttributesSettings;

  @Input()
  public linkType: LinkType;

  @Input()
  public collection: Collection;

  @Output()
  public attributeSettingsChanged = new EventEmitter<AttributesSettings>();

  public attributesResourceData: AttributesResourceData[] = [];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.linkType || changes.collection) {
      this.attributesResourceData = [
        {
          resource: this.linkType,
          type: AttributesResourceType.LinkType,
          sortable: true,
        },
        {
          resource: this.collection,
          type: AttributesResourceType.Collection,
          sortable: true,
          defaultAttributeId: getDefaultAttributeId(this.collection),
        },
      ];
    }
  }
}
