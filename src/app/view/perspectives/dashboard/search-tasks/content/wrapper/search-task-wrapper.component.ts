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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {ResourceType} from '../../../../../../core/model/resource-type';

import {Collection} from '../../../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../../../core/store/documents/document.model';
import {SizeType} from '../../../../../../shared/slider/size/size-type';
import {RoleType} from '../../../../../../core/model/role-type';
import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';
import {ConstraintData} from '@lumeer/data-filters';
import {TaskAttributes} from '../../model/task-attributes';
import {User} from '../../../../../../core/store/users/user';
import {View} from '../../../../../../core/store/views/view';

@Component({
  selector: 'search-task-wrapper',
  templateUrl: './search-task-wrapper.component.html',
  styleUrls: ['./search-task-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchTaskWrapperComponent implements OnChanges {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public isOpened: boolean;

  @Input()
  public size: SizeType;

  @Input()
  public view: View;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public attributes: TaskAttributes;

  @Input()
  public currentUser: User;

  @Output()
  public detail = new EventEmitter();

  @Output()
  public toggleFavorite = new EventEmitter();

  public readonly collectionType = ResourceType.Collection;
  public readonly sizeType = SizeType;
  public readonly readRole = RoleType.Read;

  public small: boolean;
  public medium: boolean;
  public large: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.size || changes.isOpened) {
      this.small = this.size === SizeType.S;
      this.medium = this.size === SizeType.M;
      this.large = this.size === SizeType.L || this.size === SizeType.XL || this.isOpened;
    }
  }

  public onDetail() {
    this.detail.emit();
  }

  public onToggleFavorite() {
    this.toggleFavorite.emit();
  }
}
