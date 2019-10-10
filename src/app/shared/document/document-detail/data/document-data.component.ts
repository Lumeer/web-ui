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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, EventEmitter, Output} from '@angular/core';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';

export interface DetailDataRow {
  attribute?: Attribute;
  key?: string;
  value: any;
  isDefault?: boolean;
}

@Component({
  selector: 'document-data',
  templateUrl: './document-data.component.html',
  styleUrls: ['./document-data.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentDataComponent implements OnChanges {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public defaultAttribute: Attribute;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public permissions: AllowedPermissions;

  @Output()
  public patchData = new EventEmitter<Document>();

  public rows: DetailDataRow[];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collection || changes.document || changes.constraintData) {
      this.createRows();
    }
  }

  private createRows() {
    const data = (this.document && this.document.data) || {};
    this.rows = ((this.collection && this.collection.attributes) || []).map(attribute => ({
      attribute,
      value: data[attribute.id],
      isDefault: this.defaultAttribute && this.defaultAttribute.id === attribute.id,
    }));
  }

  public onNewValue(value: any, row: DetailDataRow) {}
}
