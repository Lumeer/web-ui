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
  OnInit,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {Collection} from '../../../../core/store/collections/collection';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {AllowedPermissions, AllowedPermissionsMap} from '../../../../core/model/allowed-permissions';
import {selectAllCollections} from '../../../../core/store/collections/collections.state';

@Component({
  selector: 'links-toolbar',
  templateUrl: './links-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksToolbarComponent implements OnChanges {
  @Input()
  public collection: Collection;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public collectionsPermissions: AllowedPermissionsMap;

  @Output()
  public createLink = new EventEmitter<[string, string]>();

  public writableCollections$: Observable<Collection[]>;

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collection || changes.collectionsPermissions) {
      this.writableCollections$ = this.store$.pipe(
        select(selectAllCollections),
        map(collections =>
          collections.filter(
            collection =>
              collection.id !== this.collection?.id && this.collectionsPermissions?.[collection.id]?.writeWithView
          )
        )
      );
    }
  }

  public onUseCollection(collection: Collection) {
    if (this.collection) {
      this.createLink.emit([this.collection?.id, collection.id]);
    }
  }
}
