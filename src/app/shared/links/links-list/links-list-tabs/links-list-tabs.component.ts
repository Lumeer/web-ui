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

import {Component, EventEmitter, Input, Output} from '@angular/core';

declare const $: any;

@Component({
  selector: 'links-list-tabs',
  templateUrl: './links-list-tabs.component.html',
  styleUrls: ['./links-list-tabs.component.scss']
})
export class LinksListTabsComponent {

  @Input()
  public links: string[];

  @Input()
  public selectedLink: string;

  @Output()
  public select = new EventEmitter<string>();

  public selectLink(linkName: string) {
    this.selectedLink = linkName;
    this.select.emit(linkName);
  }

  public getLinkColors(linkName: string) {
    const colors = [['#e06666', '#f6b26b'], ['#ffd966', '#93c47d'], ['#76a5af', '#6fa8dc'], ['#8e7cc3', '#c27ba0']];

    return colors[this.links.indexOf(linkName)];
  }

  public getLinkIcons(linkName: string) {
    const icon = [['fas fa-cubes', 'fas fa-curling'], ['fas fa-cut', 'fas fa-database'], ['fas fa-deaf', 'fas fa-desktop'], ['fas fa-deaf', 'fas fa-cubes']];

    return icon[this.links.indexOf(linkName)];
  }

  public createNewLink() {
    $(`#newLinkDialogModal`).modal('show');
  }

}
