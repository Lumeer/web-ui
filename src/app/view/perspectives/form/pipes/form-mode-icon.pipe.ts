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

import {Pipe, PipeTransform} from '@angular/core';
import {FormMode} from '../../../../core/store/form/form-model';

@Pipe({
  name: 'formModeIcon',
})
export class FormModeIconPipe implements PipeTransform {
  public transform(mode: FormMode): string {
    switch (mode) {
      case FormMode.Build:
        return 'fas fa-hammer';
      case FormMode.Create:
        return 'fas fa-plus';
      case FormMode.Update:
        return 'fas fa-pencil';
      default:
        return '';
    }
  }
}
