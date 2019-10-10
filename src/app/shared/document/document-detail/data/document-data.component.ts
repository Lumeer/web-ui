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
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  SimpleChanges,
  EventEmitter,
  Output,
  SimpleChange, OnDestroy
} from '@angular/core';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {DataRow, DataRowService} from '../../../data/data-row.service';
import {getSaveValue} from '../../../utils/data.utils';

@Component({
  selector: 'document-data',
  templateUrl: './document-data.component.html',
  styleUrls: ['./document-data.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DataRowService],
})
export class DocumentDataComponent implements OnChanges, OnDestroy {
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

  constructor(public dataRowService: DataRowService) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (this.objectChanged(changes.collection) || this.objectChanged(changes.document)) {
      if (this.collection && this.document) {
        this.dataRowService.init(this.collection, this.document);
      }
    }
  }

  private objectChanged(change: SimpleChange): boolean {
    return change && (!change.previousValue || change.previousValue.id !== change.currentValue.id);
  }

  public onNewKey(value: string, index: number) {
    this.dataRowService.updateRow(index, value);
  }

  public onNewValue(value: any, row: DataRow, index: number) {
    const saveValue = getSaveValue(value, row.attribute && row.attribute.constraint, this.constraintData);
    this.dataRowService.updateRow(index, null, saveValue);
  }

  public ngOnDestroy() {
    this.dataRowService.destroy();
  }
}
