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
import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {Observable} from 'rxjs';

import {AttributesResourceType} from '../../../../core/model/resource';
import {AppState} from '../../../../core/store/app.state';
import {selectLinkTypeByWorkspace} from '../../../../core/store/link-types/link-types.state';
import {LinkType} from '../../../../core/store/link-types/link.type';

@Component({
  selector: 'link-type-attributes',
  templateUrl: './link-type-attributes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkTypeAttributesComponent implements OnInit {
  public linkType$: Observable<LinkType>;
  public linkTypeType = AttributesResourceType.LinkType;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.linkType$ = this.store$.pipe(select(selectLinkTypeByWorkspace));
  }
}
