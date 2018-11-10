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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';

import {LinkTypeModel} from '../../../../core/store/link-types/link-type.model';

@Component({
  selector: 'links-list-tabs',
  templateUrl: './links-list-tabs.component.html',
  styleUrls: ['./links-list-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksListTabsComponent {
  @Input()
  public linkTypes: LinkTypeModel[];

  @Input()
  public selectedLinkType: LinkTypeModel;

  @Output()
  public select = new EventEmitter<LinkTypeModel>();

  public selectLink(linkType: LinkTypeModel) {
    if (!this.selectedLinkType || this.selectedLinkType.id !== linkType.id) {
      this.select.emit(linkType);
    }
  }

  public trackByLinkTypes(index: number, linkType: LinkTypeModel): string {
    return linkType.id;
  }
}
