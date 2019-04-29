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
import {Collection} from '../../../../core/store/collections/collection';
import {KanbanCollectionConfig, KanbanConfig} from '../../../../core/store/kanbans/kanban';

@Component({
  selector: 'kanban-config',
  templateUrl: './kanban-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanConfigComponent {
  @Input()
  public collections: Collection[];

  @Input()
  public config: KanbanConfig;

  @Output()
  public configChange = new EventEmitter<KanbanConfig>();

  public trackByCollection(index: number, collection: Collection): string {
    return collection.id;
  }

  public onCollectionConfigChange(collection: Collection, collectionConfig: KanbanCollectionConfig) {
    const collectionsConfig = {...this.config.collections, [collection.id]: collectionConfig};
    const newConfig = {...this.config, collections: collectionsConfig};
    this.configChange.emit(newConfig);
  }
}
