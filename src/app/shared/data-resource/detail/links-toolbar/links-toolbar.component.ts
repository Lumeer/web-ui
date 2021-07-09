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
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  OnInit,
} from '@angular/core';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {Collection} from '../../../../core/store/collections/collection';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {selectReadableCollections} from '../../../../core/store/common/permissions.selectors';
import {selectProjectPermissions} from '../../../../core/store/user-permissions/user-permissions.state';

@Component({
  selector: 'links-toolbar',
  templateUrl: './links-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksToolbarComponent implements OnChanges, OnInit {
  @Input()
  public collection: Collection;

  @Input()
  public permissions: AllowedPermissions;

  @Output()
  public createLink = new EventEmitter<[string, string]>();

  public collections$: Observable<Collection[]>;
  public projectPermissions$: Observable<AllowedPermissions>;

  public canLinkCollection: boolean;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.projectPermissions$ = this.store$.pipe(select(selectProjectPermissions));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collection) {
      this.collections$ = this.store$.pipe(
        select(selectReadableCollections),
        map(collections => collections.filter(collection => collection.id !== this.collection?.id))
      );
    }
    if (changes.permissions) {
      this.canLinkCollection = this.permissions?.roles?.Read;
    }
  }

  public onUseCollection(collection: Collection) {
    if (this.collection) {
      this.createLink.emit([this.collection?.id, collection.id]);
    }
  }
}
