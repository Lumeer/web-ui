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

import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {Organization} from '../../../../../core/store/organizations/organization';
import {GettingStartedService} from '../../getting-started.service';
import {AppState} from '../../../../../core/store/app.state';
import {selectContributeOrganizations} from '../../../../../core/store/organizations/organizations.state';

@Component({
  selector: 'choose-organization',
  templateUrl: './choose-organization.component.html',
  styleUrls: ['./choose-organization.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-block p-5'},
})
export class ChooseOrganizationComponent implements OnInit {
  public organizations$: Observable<Organization[]>;

  constructor(private store$: Store<AppState>, public service: GettingStartedService) {}

  public ngOnInit() {
    this.organizations$ = this.store$.pipe(select(selectContributeOrganizations));
  }

  public onSelect(organization: Organization) {
    this.service.selectedOrganization = organization;
  }
}
