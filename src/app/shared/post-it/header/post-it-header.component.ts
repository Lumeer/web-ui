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
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {AttributesResource, AttributesResourceType} from '../../../core/model/resource';
import {PostItTag} from '../post-it.component';

@Component({
  selector: 'post-it-header',
  templateUrl: './post-it-header.component.html',
  styleUrls: ['./post-it-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostItHeaderComponent {

  @Input()
  public resource: AttributesResource;

  @Input()
  public tag: PostItTag;

  @Input()
  public icons: string[];

  @Input()
  public colors: string[];

  @Input()
  public allowedPermissions: AllowedPermissions;

  @Input()
  public favorite: boolean;

  @Input()
  public resourceType: AttributesResourceType;

  @Output()
  public remove = new EventEmitter();

  @Output()
  public toggleFavorite = new EventEmitter();

  public readonly resourceTypeCollection: AttributesResourceType.Collection;

  public onRemove() {
    this.remove.emit();
  }

  public onToggleFavorite() {
    this.toggleFavorite.emit();
  }
}
