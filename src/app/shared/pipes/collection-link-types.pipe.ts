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

import {Injectable, Pipe, PipeTransform} from '@angular/core';
import {combineLatest, Observable} from 'rxjs';
import {LinkType} from '../../core/store/link-types/link.type';
import {selectLinkTypesByCollectionId} from '../../core/store/common/permissions.selectors';
import {selectCollectionsDictionary} from '../../core/store/collections/collections.state';
import {map} from 'rxjs/operators';
import {AppState} from '../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {mapLinkTypeCollections} from '../utils/link-type.utils';

@Pipe({
  name: 'collectionLinkTypes',
})
@Injectable()
export class CollectionLinkTypesPipe implements PipeTransform {
  public constructor(private store$: Store<AppState>) {}

  public transform(collectionId: string): Observable<LinkType[]> {
    return combineLatest([
      this.store$.pipe(select(selectLinkTypesByCollectionId(collectionId))),
      this.store$.pipe(select(selectCollectionsDictionary)),
    ]).pipe(
      map(([linkTypes, collectionsMap]) => linkTypes.map(linkType => mapLinkTypeCollections(linkType, collectionsMap)))
    );
  }
}
