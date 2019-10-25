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

import {Component, ChangeDetectionStrategy, Input} from '@angular/core';
import {LinkColumn} from '../../model/link-column';
import {ConstraintData} from '../../../../../core/model/data/constraint';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {LinkRow} from '../../model/link-row';

@Component({
  selector: '[links-list-table-body]',
  templateUrl: './links-list-table-body.component.html',
  styleUrls: ['./links-list-table-body.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksListTableBodyComponent {
  @Input()
  public columns: LinkColumn[];

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public rows: LinkRow[];
}
