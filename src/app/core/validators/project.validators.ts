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
import {isNullOrUndefined} from 'util';
import {OrganizationsAction} from '../store/organizations/organizations.action';
import {selectOrganizationCodes} from '../store/organizations/organizations.state';
import {ProjectsAction} from '../store/projects/projects.action';
import {selectProjectsCodesForOrganization} from '../store/projects/projects.state';

@Injectable()
export class ProjectValidators {
  private currentOrganizationId: string;

  constructor(private store: Store<AppState>) {}

  public setOrganizationId(id: string) {
    this.currentOrganizationId = id;
    this.store.dispatch(new ProjectsAction.GetCodes({organizationId: id}));
  }

  public uniqueCode(excludeCode?: string): AsyncValidatorFn {
    return (control: AbstractControl) =>
      this.store.select(selectProjectsCodesForOrganization(this.currentOrganizationId)).pipe(
        filter(codes => !isNullOrUndefined(codes)),
        map(codes => {
          const codesLowerCase = codes.map(code => code.toLowerCase());
          const value = control.value.trim().toLowerCase();

          if ((!excludeCode || excludeCode.toLowerCase() !== value) && codesLowerCase.includes(value)) {
            return {notUniqueCode: true};
          } else {
            return null;
          }
        }),
        take(1)
      );
  }
}
