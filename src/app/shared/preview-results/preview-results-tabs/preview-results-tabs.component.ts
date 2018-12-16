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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Collection} from '../../../core/store/collections/collection';

@Component({
  selector: 'preview-results-tabs',
  templateUrl: './preview-results-tabs.component.html',
  styleUrls: ['./preview-results-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewResultsTabsComponent implements OnInit {
  @Input()
  public collections: Collection[];

  @Input()
  public selectedCollection: string;

  @Output()
  public select = new EventEmitter<Collection>();

  public ngOnInit() {
    if (!this.selectedCollection) {
      this.setActiveCollection(this.collections[0]);
    }
  }

  public setActiveCollection(collection: Collection) {
    this.selectedCollection = collection.id;
    this.select.emit(collection);
  }
}
