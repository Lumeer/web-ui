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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {Collection} from '../../../../core/store/collections/collection';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {convertQueryModelToString} from '../../../../core/store/navigation/query/query.converter';
import {Query} from '../../../../core/store/navigation/query/query';
import {IconColorPickerComponent} from '../../../picker/icon-color/icon-color-picker.component';
import {Perspective} from '../../../../view/perspectives/perspective';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {QueryParam} from '../../../../core/store/navigation/query-param';
import {permissionsCanManageCollectionDetail} from '../../../utils/permission.utils';
import {createCollectionQueryStem, createOpenCollectionQuery} from '../../../../core/store/navigation/query/query.util';

@Component({
  selector: 'post-it-collection',
  templateUrl: './post-it-collection.component.html',
  styleUrls: ['./post-it-collection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostItCollectionComponent implements OnChanges {
  @Input()
  public collection: Collection;

  @Input()
  public workspace: Workspace;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public query: Query;

  @Input()
  public shouldCollectionDisplayHint: boolean;

  @Output()
  public update = new EventEmitter<Collection>();

  @Output()
  public create = new EventEmitter<Collection>();

  @Output()
  public delete = new EventEmitter();

  @Output()
  public favoriteToggle = new EventEmitter();

  @Output()
  public selected = new EventEmitter();

  @Output()
  public unselected = new EventEmitter();

  @ViewChild(IconColorPickerComponent)
  public iconColorDropdownComponent: IconColorPickerComponent;

  public canManageDetail: boolean;

  public path: any[];
  public queryParams: any;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.permissions) {
      this.canManageDetail = permissionsCanManageCollectionDetail(this.permissions);
    }
    if (changes.collection || changes.workspace || changes.query) {
      if (this.collection?.id) {
        this.path = ['/w', this.workspace?.organizationCode, this.workspace?.projectCode, 'view', Perspective.Table];
        this.queryParams = {[QueryParam.Query]: this.queryForCollectionDocuments()};
      } else {
        this.path = null;
        this.queryParams = null;
      }
    }
  }

  public onNameChanged(name: string) {
    if (name === '') {
      return;
    }
    const resourceModel = {...this.collection, name};
    if (this.collection.id) {
      this.update.emit(resourceModel);
    } else {
      this.create.emit(resourceModel);
    }
  }

  public onDelete() {
    this.delete.emit();
  }

  public toggleFavorite() {
    this.favoriteToggle.emit();
  }

  public queryForCollectionDocuments(): string {
    return convertQueryModelToString(createOpenCollectionQuery(this.collection, this.query));
  }

  public togglePicker() {
    this.iconColorDropdownComponent.toggle();
  }

  public onIconColorChange(data: {icon: string; color: string}) {
    // we know that uncreated collection is not in store
    this.collection.icon = data.icon;
    this.collection.color = data.color;
  }

  public onHintDismissed() {
    //console.log('Dismissed');
  }
}
