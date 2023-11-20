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
import {ChangeDetectionStrategy, Component} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {take} from 'rxjs/operators';

import {AppState} from '../../../core/store/app.state';
import {Collection} from '../../../core/store/collections/collection';
import {createEmptyCollection} from '../../../core/store/collections/collection.util';
import {CollectionsAction} from '../../../core/store/collections/collections.action';
import {NavigationAction} from '../../../core/store/navigation/navigation.action';
import {queryIsNotEmpty} from '../../../core/store/navigation/query/query.util';
import {NotificationsAction} from '../../../core/store/notifications/notifications.action';
import {selectViewQuery} from '../../../core/store/views/views.state';

@Component({
  selector: 'table-import-button',
  templateUrl: './table-import-button.component.html',
  styleUrls: ['./table-import-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableImportButtonComponent {
  public dragging: boolean = false;

  constructor(private store$: Store<AppState>) {}

  public handleDrop(event) {
    this.dragging = false;
    event.preventDefault();
    this.fileChange(event.dataTransfer.files);
  }

  public fileChange(files: FileList) {
    if (files.length) {
      const file = files[0];
      const reader = new FileReader();
      const indexOfSuffix = file.name.lastIndexOf('.');
      const name = indexOfSuffix !== -1 ? file.name.substring(0, indexOfSuffix) : file.name;
      reader.onloadend = () => {
        this.onImport(String(reader.result), name);
      };
      reader.readAsText(file);
    } else {
      this.onError();
    }
  }

  private onError() {
    const message = $localize`:@@files.input.button.empty:File input is empty`;
    this.store$.dispatch(new NotificationsAction.Error({message}));
  }

  private onImport(result: string, name: string) {
    const newCollection = {...createEmptyCollection(), name};
    const importedCollection = {collection: newCollection, data: result};
    const format = 'csv';

    this.store$.dispatch(
      new CollectionsAction.Import({
        format,
        importedCollection,
        onSuccess: collection => this.onCreateCollection(collection),
      })
    );
  }

  private onCreateCollection(collection: Collection) {
    this.store$.pipe(select(selectViewQuery), take(1)).subscribe(query => {
      if (queryIsNotEmpty(query)) {
        this.store$.dispatch(new NavigationAction.AddCollectionToQuery({collectionId: collection.id}));
      }
    });
  }
}
