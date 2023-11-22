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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';

import {ConstraintData} from '@lumeer/data-filters';

import {DocumentModel} from '../../../../../../../../core/store/documents/document.model';
import {View} from '../../../../../../../../core/store/views/view';
import {TaskAttributes} from '../../../../model/task-attributes';

@Component({
  selector: 'task-second-line',
  templateUrl: './task-second-line.component.html',
  styleUrls: ['./task-second-line.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-flex flex-row flex-nowrap text-truncate justify-content-end'},
})
export class TaskSecondLineComponent {
  @Input()
  public document: DocumentModel;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public attributes: TaskAttributes;

  @Input()
  public view: View;

  @Output()
  public commentClick = new EventEmitter();
}
