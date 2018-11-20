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

import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {ServiceLevelType} from '../../../core/dto/service-level-type';
import {AppState} from '../../../core/store/app.state';
import {Workspace} from '../../../core/store/navigation/workspace.model';
import {ServiceLimitsAction} from '../../../core/store/organizations/service-limits/service-limits.action';
import {selectServiceLimitsByWorkspace} from '../../../core/store/organizations/service-limits/service-limits.state';

@Component({
  selector: 'user-panel',
  templateUrl: './user-panel.component.html',
  styleUrls: ['./user-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserPanelComponent implements OnInit {
  @Input()
  public workspace: Workspace;

  public freePlan$: Observable<boolean>;
  public notifications = 0;

  constructor(private router: Router, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.bindServiceLimits();
  }

  private bindServiceLimits() {
    this.store$.dispatch(new ServiceLimitsAction.GetAll());
    this.freePlan$ = this.store$
      .select(selectServiceLimitsByWorkspace)
      .pipe(map(serviceLimits => serviceLimits && serviceLimits.serviceLevel === ServiceLevelType.FREE));
  }

  public goToOrganizationDetail() {
    if (this.workspace && this.workspace.organizationCode) {
      this.router.navigate(['organization', this.workspace.organizationCode, 'detail']);
    }
  }
}
