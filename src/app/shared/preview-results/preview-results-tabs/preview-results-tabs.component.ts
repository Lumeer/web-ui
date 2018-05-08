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

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'preview-results-tabs',
  templateUrl: './preview-results-tabs.component.html',
  styleUrls: ['./preview-results-tabs.component.scss']
})
export class PreviewResultsTabsComponent implements OnInit {

  @Input()
  public collections: string[];

  @Input()
  public selectedCollection: string;

  @Output()
  public select = new EventEmitter<string>();

  constructor() { }

  ngOnInit() {
  }

  public selectCollection(collection: string) {
    this.selectedCollection = collection;
    this.select.emit(collection);
  }

  public getCollectionColor(collection: string) {
    const colors = ['#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6fa8dc', '#8e7cc3', '#c27ba0'];

    return colors[this.collections.indexOf(collection)];
  }

  public getCollectionIcon(collection: string) {
    const icon = ['fa-cubes', 'fa-curling', 'fa-cut', 'fa-database', 'fa-deaf', 'fa-desktop'];

    return icon[this.collections.indexOf(collection)];
  }

}
