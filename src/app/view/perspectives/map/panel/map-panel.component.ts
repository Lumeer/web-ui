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

import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Store} from '@ngrx/store';
import {Collection} from '../../../../core/store/collections/collection';
import {MapModel} from '../../../../core/store/maps/map.model';
import {MapsAction} from '../../../../core/store/maps/maps.action';

@Component({
  selector: 'map-panel',
  templateUrl: './map-panel.component.html',
  styleUrls: ['./map-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPanelComponent {
  @Input()
  public map: MapModel;

  @Input()
  public collections: Collection[];

  constructor(private store$: Store<{}>) {}

  public onSelect(collection: Collection, [index, attributeId]: [number, string]) {
    this.store$.dispatch(
      new MapsAction.SelectAttribute({mapId: this.map.id, collectionId: collection.id, index, attributeId})
    );
  }
}
