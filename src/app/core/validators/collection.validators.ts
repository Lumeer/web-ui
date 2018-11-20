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

import {Injectable} from '@angular/core';
import {AbstractControl} from '@angular/forms';
import {AsyncValidatorFn} from '@angular/forms/src/directives/validators';
import {Store} from '@ngrx/store';
import {filter, map, take} from 'rxjs/operators';
import {AppState} from '../store/app.state';
import {CollectionsAction} from '../store/collections/collections.action';
import {selectCollectionNames} from '../store/collections/collections.state';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {isNullOrUndefined} from 'util';

@Injectable()
export class CollectionValidators {
  constructor(private store: Store<AppState>) {
    this.store
      .select(selectWorkspace)
      .pipe(filter(workspace => Boolean(workspace && workspace.organizationCode && workspace.projectCode)))
      .subscribe(() => this.store.dispatch(new CollectionsAction.GetNames()));
  }

  public uniqueName(excludeName?: string): AsyncValidatorFn {
    return (control: AbstractControl) =>
      this.store.select(selectCollectionNames).pipe(
        filter(collectionNames => !isNullOrUndefined(collectionNames)),
        map(collectionNames => {
          const names = collectionNames.map(name => name.toLowerCase());
          const value = control.value.trim().toLowerCase();

          if (excludeName && excludeName.toLowerCase() !== value && names.includes(value)) {
            return {uniqueName: true};
          } else {
            return null;
          }
        }),
        take(1)
      );
  }
}
