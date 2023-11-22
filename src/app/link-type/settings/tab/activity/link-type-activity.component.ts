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

import {ResourceType} from '../../../../core/model/resource-type';
import {AppState} from '../../../../core/store/app.state';
import {selectWorkspaceWithIds} from '../../../../core/store/common/common.selectors';
import {selectLinkTypeByWorkspace} from '../../../../core/store/link-types/link-types.state';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Workspace} from '../../../../core/store/navigation/workspace';

@Component({
  selector: 'link-type-activity',
  templateUrl: './link-type-activity.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkTypeActivityComponent implements OnInit {
  public linkType$: Observable<LinkType>;
  public workspace$: Observable<Workspace>;

  public readonly resourceType = ResourceType.LinkType;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.linkType$ = this.store$.pipe(select(selectLinkTypeByWorkspace));
    this.workspace$ = this.store$.pipe(select(selectWorkspaceWithIds));
  }
}
