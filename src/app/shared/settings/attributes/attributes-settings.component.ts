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

import {Component, OnInit, ChangeDetectionStrategy, Input, EventEmitter, Output} from '@angular/core';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {Collection} from '../../../core/store/collections/collection';
import {combineLatest, Observable} from 'rxjs';
import {LinkType} from '../../../core/store/link-types/link.type';
import {selectCollectionsByStems, selectLinkTypesInQuery} from '../../../core/store/common/permissions.selectors';
import {selectCollectionsDictionary} from '../../../core/store/collections/collections.state';
import {mapLinkTypeCollections} from '../../utils/link-type.utils';
import {map} from 'rxjs/operators';
import {AttributesSettings} from '../../../core/store/views/view';
import {Query} from '../../../core/store/navigation/query/query';
import {selectQuery} from '../../../core/store/navigation/navigation.state';

@Component({
  selector: 'attributes-settings',
  templateUrl: './attributes-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributesSettingsComponent implements OnInit {
  @Input()
  public settings: AttributesSettings;

  @Output()
  public settingsChanged = new EventEmitter<AttributesSettings>();

  public collections$: Observable<Collection[]>;
  public linkTypes$: Observable<LinkType[]>;
  public query$: Observable<Query>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.query$ = this.store$.pipe(select(selectQuery));
    this.collections$ = this.store$.pipe(select(selectCollectionsByStems));
    this.linkTypes$ = combineLatest([
      this.store$.pipe(select(selectLinkTypesInQuery)),
      this.store$.pipe(select(selectCollectionsDictionary)),
    ]).pipe(
      map(([linkTypes, collectionsMap]) => linkTypes.map(linkType => mapLinkTypeCollections(linkType, collectionsMap)))
    );
  }
}
