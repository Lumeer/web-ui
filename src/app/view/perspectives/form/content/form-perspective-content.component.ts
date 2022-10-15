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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {FormConfig} from '../../../../core/store/form/form-model';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Query} from '../../../../core/store/navigation/query/query';
import {View} from '../../../../core/store/views/view';
import {ResourcesPermissions} from '../../../../core/model/allowed-permissions';
import {objectChanged} from '../../../../shared/utils/common.utils';
import {FormPerspectiveConfiguration} from '../../perspective-configuration';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectConstraintData} from '../../../../core/store/constraint-data/constraint-data.state';
import {Observable} from 'rxjs';
import {ConstraintData} from '@lumeer/data-filters';
import {AttributesSettings} from '../../../../core/store/view-settings/view-settings';

@Component({
  selector: 'form-perspective-content',
  templateUrl: './form-perspective-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormPerspectiveContentComponent implements OnInit, OnChanges {
  @Input()
  public config: FormConfig;

  @Input()
  public collection: Collection;

  @Input()
  public collectionLinkTypes: LinkType[];

  @Input()
  public query: Query;

  @Input()
  public view: View;

  @Input()
  public attributesSettings: AttributesSettings;

  @Input()
  public permissions: ResourcesPermissions;

  @Input()
  public canManageConfig: boolean;

  @Input()
  public builderMode: boolean;

  @Input()
  public configuration: FormPerspectiveConfiguration;

  @Output()
  public configChange = new EventEmitter<FormConfig>();

  @Output()
  public modeToggle = new EventEmitter();

  public constraintData$: Observable<ConstraintData>;

  public canManipulateData: boolean;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (objectChanged(changes.collection) || changes.permissions || changes.canManageConfig) {
      this.checkPermissions();
    }
  }

  private checkPermissions() {
    const permissions = this.permissions?.collections?.[this.collection?.id];
    this.canManipulateData =
      permissions?.rolesWithView?.DataContribute ||
      permissions?.rolesWithView?.DataWrite ||
      permissions?.rolesWithView?.DataRead ||
      this.canManageConfig;
  }
}
