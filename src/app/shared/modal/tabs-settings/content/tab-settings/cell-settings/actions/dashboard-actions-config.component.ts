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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {DashboardAction, DashboardActionType} from '../../../../../../../core/model/dashboard-tab';
import {View} from '../../../../../../../core/store/views/view';
import {COLOR_SUCCESS} from '../../../../../../../core/constants';

@Component({
  selector: 'dashboard-actions-config',
  templateUrl: './dashboard-actions-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-flex flex-column'},
})
export class DashboardActionsConfigComponent {
  @Input()
  public actions: DashboardAction[];

  @Input()
  public views: View[];

  @Output()
  public actionsChange = new EventEmitter<DashboardAction[]>();

  public onAdd() {
    const newActions = [...(this.actions || [])];
    newActions.push(createDefaultAction());
    this.actionsChange.next(newActions);
  }

  public onActionChange(action: DashboardAction, index: number) {
    const newActions = [...(this.actions || [])];
    newActions[index] = action;
    this.actionsChange.next(newActions);
  }

  public onActionRemove(index: number) {
    const newActions = [...(this.actions || [])];
    newActions.splice(index, 1);
    this.actionsChange.next(newActions);
  }
}

export function createDefaultAction(viewId?: string): DashboardAction {
  const defaultIcon = 'far fa-external-link';
  return {type: DashboardActionType.ViewButton, config: {color: COLOR_SUCCESS, icon: defaultIcon, viewId}};
}
