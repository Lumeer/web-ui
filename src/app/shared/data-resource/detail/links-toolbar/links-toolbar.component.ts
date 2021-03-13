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

import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {Collection} from '../../../../core/store/collections/collection';
import {Observable} from 'rxjs';
import {selectCollectionsByWritePermission} from '../../../../core/store/common/permissions.selectors';
import {map} from 'rxjs/operators';
import {ModalService} from '../../../modal/modal.service';

@Component({
  selector: 'links-toolbar',
  templateUrl: './links-toolbar.component.html',
  styleUrls: ['./links-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksToolbarComponent implements OnInit {
  @Input()
  public collection: Collection;

  public writableCollections$: Observable<Collection[]>;

  constructor(private store$: Store<AppState>, private modalService: ModalService) {}

  public ngOnInit() {
    this.writableCollections$ = this.store$.pipe(
      select(selectCollectionsByWritePermission),
      map(writableCollections => {
        if (!writableCollections.some(collection => collection.id === this.collection?.id)) {
          return [];
        }
        return writableCollections.filter(collection => collection.id !== this.collection?.id);
      })
    );
  }

  public onUseCollection(collection: Collection) {
    if (this.collection) {
      this.modalService.showCreateLink([this.collection?.id, collection.id]);
    }
  }
}
