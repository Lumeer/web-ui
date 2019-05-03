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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {Collection} from '../../../../../core/store/collections/collection';
import {KanbanCollectionConfig} from '../../../../../core/store/kanbans/kanban';
import {I18n} from '@ngx-translate/i18n-polyfill';

@Component({
  selector: 'kanban-collection-config',
  templateUrl: './kanban-collection-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanCollectionConfigComponent {
  @Input()
  public collection: Collection;

  @Input()
  public collectionConfig: KanbanCollectionConfig;

  @Output()
  public configChange = new EventEmitter<KanbanCollectionConfig>();

  public readonly buttonClasses = 'flex-grow-1 text-truncate';
  public readonly emptyValueString: string;

  constructor(private i18n: I18n) {
    this.emptyValueString = i18n({id: 'kanban.config.collection.attribute.empty', value: 'Select attribute'});
  }

  public onAttributeSelected(attributeId: string) {
    this.configChange.emit({attribute: {attributeId, collectionId: this.collection.id}});
  }

  public onAttributeRemoved() {
    this.configChange.emit({attribute: null});
  }
}
