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
import {ConstraintData} from '@lumeer/data-filters';
import {DocumentModel} from '../../../../../../core/store/documents/document.model';
import {View} from '../../../../../../core/store/views/view';
import {User} from '../../../../../../core/store/users/user';
import {TaskAttributes} from '../../model/task-attributes';
import {AllowedPermissionsMap} from '../../../../../../core/model/allowed-permissions';
import {Collection} from '../../../../../../core/store/collections/collection';
import {DataInputConfiguration} from '../../../../../../shared/data-input/data-input-configuration';
import {SizeType} from '../../../../../../shared/slider/size/size-type';
import {SearchTasksConfig} from '../../../../../../core/store/searches/search';

@Component({
  selector: 'tasks-group',
  templateUrl: './tasks-group.component.html',
  styleUrls: ['./tasks-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksGroupComponent {
  @Input()
  public tasks: DocumentModel[];

  @Input()
  public title: string;

  @Input()
  public isTruncated: boolean;

  @Input()
  public view: View;

  @Input()
  public currentUser: User;

  @Input()
  public taskAttributes: Record<string, TaskAttributes>;

  @Input()
  public permissions: AllowedPermissionsMap;

  @Input()
  public collectionsMap: Record<string, Collection>;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public views: View[];

  @Input()
  public currentSize: SizeType;

  @Input()
  public config: SearchTasksConfig;

  @Output()
  public showAll = new EventEmitter();

  @Output()
  public detail = new EventEmitter<DocumentModel>();

  @Output()
  public toggleFavorite = new EventEmitter<DocumentModel>();

  @Output()
  public toggleOpen = new EventEmitter<DocumentModel>();

  public readonly configuration: DataInputConfiguration = {color: {limitWidth: true}};
  public readonly sizeType = SizeType;

  public trackByDocument(index: number, document: DocumentModel): string {
    return document.id;
  }

  public trackByEntry(index: number, entry: {attributeId: string}): string {
    return entry.attributeId;
  }
}
