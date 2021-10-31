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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnChanges, SimpleChanges} from '@angular/core';
import {FormConfig} from '../../../../core/store/form/form-model';
import {Collection} from '../../../../core/store/collections/collection';
import {Query} from '../../../../core/store/navigation/query/query';

@Component({
  selector: 'form-perspective-content',
  templateUrl: './form-perspective-content.component.html',
  styleUrls: ['./form-perspective-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormPerspectiveContentComponent implements OnChanges {

  @Input()
  public config: FormConfig;

  @Input()
  public collections: Collection[];

  @Input()
  public query: Query;

  @Output()
  public configChange = new EventEmitter<FormConfig>();

  public basicCollection: Collection;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collections || changes.query) {
      this.basicCollection = this.findBasicCollection();
    }
  }

  private findBasicCollection(): Collection {
    const collectionId = this.query?.stems?.[0]?.collectionId;
    if (collectionId) {
      return (this.collections || []).find(collection => collection.id === collectionId);
    }
    return null;
  }

}
