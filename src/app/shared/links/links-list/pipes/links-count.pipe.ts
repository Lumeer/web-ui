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
import {Pipe, PipeTransform} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {AppState} from '../../../../core/store/app.state';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {selectLinkInstancesByTypeAndDocuments} from '../../../../core/store/link-instances/link-instances.state';
import {LinkType} from '../../../../core/store/link-types/link.type';

@Pipe({
  name: 'linksCount',
})
export class LinksCountPipe implements PipeTransform {
  constructor(private store$: Store<AppState>) {}

  public transform(document: DocumentModel, linkType: LinkType): Observable<number> {
    return this.store$.pipe(
      select(selectLinkInstancesByTypeAndDocuments(linkType.id, [document.id])),
      map(instances => instances?.length || 0)
    );
  }
}
