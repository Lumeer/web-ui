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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output, OnChanges, SimpleChanges} from '@angular/core';
import {DashboardAction} from '../../../../../../../../core/model/dashboard-tab';
import {View} from '../../../../../../../../core/store/views/view';
import {createViewSelectItems} from '../../../../../../../../core/store/views/view.utils';
import {SelectItemModel} from '../../../../../../../select/select-item/select-item.model';
import {BehaviorSubject} from 'rxjs';

@Component({
  selector: 'dashboard-action-config',
  templateUrl: './dashboard-action-config.component.html',
  styleUrls: ['./dashboard-action-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardActionConfigComponent implements OnChanges {
  @Input()
  public action: DashboardAction;

  @Input()
  public views: View[];

  @Input()
  public editable: boolean;

  @Output()
  public actionChange = new EventEmitter<DashboardAction>();

  @Output()
  public remove = new EventEmitter();

  public viewSelectItems: SelectItemModel[];

  public icon$ = new BehaviorSubject<string>(null);
  public color$ = new BehaviorSubject<string>(null);

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.views) {
      this.viewSelectItems = createViewSelectItems(this.views);
    }
    if (changes.action) {
      this.icon$.next(this.action?.config?.icon);
      this.color$.next(this.action?.config?.color);
    }
  }

  public onViewSelected(viewId: string) {
    const config = {...this.action.config, viewId};
    this.actionChange.emit({...this.action, config});
  }

  public onIconColorChange(data: {icon: string; color: string}) {
    this.icon$.next(data.icon);
    this.color$.next(data.color);
  }

  public onIconColorSave(data: {icon: string; color: string}) {
    const config = {...this.action.config, icon: data.icon, color: data.color};
    this.actionChange.emit({...this.action, config});
  }
}
