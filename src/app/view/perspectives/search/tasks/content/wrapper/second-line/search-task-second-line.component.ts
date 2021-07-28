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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output} from '@angular/core';
import {DocumentModel} from '../../../../../../../core/store/documents/document.model';
import {ConstraintData} from '@lumeer/data-filters';
import {TaskAttributes} from '../../../model/task-attributes';

@Component({
  selector: 'search-task-second-line',
  templateUrl: './search-task-second-line.component.html',
  styleUrls: ['./search-task-second-line.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-flex flex-row flex-nowrap text-truncate justify-content-end'},
})
export class SearchTaskSecondLineComponent {
  @Input()
  public document: DocumentModel;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public attributes: TaskAttributes;

  @Output()
  public commentClick = new EventEmitter();
}
