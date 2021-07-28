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

import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Store} from '@ngrx/store';
import {Collection} from '../../../../core/store/collections/collection';
import {MapConfig, MapModel, MapStemConfig} from '../../../../core/store/maps/map.model';
import {MapsAction} from '../../../../core/store/maps/maps.action';
import {Query, QueryStem} from '../../../../core/store/navigation/query/query';
import {deepObjectCopy} from '../../../../shared/utils/common.utils';
import {createMapDefaultStemConfig} from '../../../../core/store/maps/map-config.utils';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {AppState} from '../../../../core/store/app.state';

@Component({
  selector: 'map-panel',
  templateUrl: './map-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-flex flex-column'},
})
export class MapPanelComponent {
  @Input()
  public map: MapModel;

  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public query: Query;

  constructor(private store$: Store<AppState>) {}

  public readonly defaultStemConfig = createMapDefaultStemConfig();

  public onStemConfigChange(stemConfig: MapStemConfig, stem: QueryStem, index: number) {
    const config = deepObjectCopy<MapConfig>(this.map.config);
    config.stemsConfigs[index] = {...stemConfig, stem};
    this.store$.dispatch(new MapsAction.SetConfig({mapId: this.map.id, config}));
  }

  public onPositionSavedChange(positionSaved: boolean) {
    this.store$.dispatch(new MapsAction.ChangePositionSaved({mapId: this.map.id, positionSaved}));
  }

  public trackByStem(index: number, stem: QueryStem): string {
    return stem.collectionId + index;
  }

  public onImageUrlChange(imageUrl: string) {
    const config = {...this.map.config, imageUrl};
    this.store$.dispatch(new MapsAction.SetConfig({mapId: this.map.id, config}));
  }
}
