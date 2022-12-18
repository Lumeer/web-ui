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

import {Injectable} from '@angular/core';
import {AbstractControl, AsyncValidatorFn} from '@angular/forms';
import {map} from 'rxjs/operators';
import {ProjectService} from '../data-service';
import {Observable, of} from 'rxjs';

@Injectable()
export class ProjectValidators {
  private currentOrganizationId: string;

  constructor(private projectService: ProjectService) {}

  public setOrganizationId(id: string) {
    this.currentOrganizationId = id;
  }

  public checkCodeValid(value: string): Observable<boolean> {
    return this.projectService.checkCodeValid(this.currentOrganizationId, value);
  }

  public uniqueCode(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      const value = control.value.trim();
      if (value.length < 2) {
        return of(null);
      }
      return this.checkCodeValid(value).pipe(
        map(valid => {
          if (valid) {
            return null;
          } else {
            return {notUniqueCode: true};
          }
        })
      );
    };
  }
}
