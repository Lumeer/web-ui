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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, Output, EventEmitter} from '@angular/core';
import {FormRow, FormSection} from '../../../../../../core/store/form/form-model';
import {Collection} from '../../../../../../core/store/collections/collection';
import {ConstraintData, DataValue} from '@lumeer/data-filters';
import {FormError} from '../validation/form-validation';
import {FormLinkData, FormLinkSelectedData} from '../model/form-link-data';
import {DataInputSaveAction} from '../../../../../../shared/data-input/data-input-save-action';
import {FormCoordinates} from '../model/form-coordinates';
import {DocumentModel} from '../../../../../../core/store/documents/document.model';
import {AttributesSettings} from '../../../../../../core/store/views/view';

@Component({
  selector: 'form-view-section',
  templateUrl: './form-view-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormViewSectionComponent implements OnChanges {
  @Input()
  public section: FormSection;

  @Input()
  public collection: Collection;

  @Input()
  public dataValues: Record<string, DataValue>;

  @Input()
  public linkValues: Record<string, FormLinkData>;

  @Input()
  public documentId: string;

  @Input()
  public viewId: string;

  @Input()
  public documentEditable: boolean;

  @Input()
  public originalDocument: DocumentModel;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public editedCell: FormCoordinates;

  @Input()
  public attributesSettings: AttributesSettings;

  @Input()
  public formErrors: FormError[];

  @Output()
  public attributeValueChange = new EventEmitter<{
    attributeId: string;
    dataValue: DataValue;
    rowId: string;
    cellId: string;
    action?: DataInputSaveAction;
  }>();

  @Output()
  public linkValueChange = new EventEmitter<{
    linkTypeId: string;
    selectedData: FormLinkSelectedData;
    rowId: string;
    cellId: string;
    action?: DataInputSaveAction;
  }>();

  @Output()
  public editStart = new EventEmitter<{rowId: string; cellId: string}>();

  @Output()
  public editCancel = new EventEmitter<{rowId: string; cellId: string}>();

  public title: string;
  public description: string;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.section) {
      this.title = (this.section?.title || '').trim();
      this.description = (this.section?.description || '').trim();
    }
  }

  public trackByRow(index: number, row: FormRow): string {
    return row.id;
  }

  public onAttributeValueChange(
    data: {attributeId: string; dataValue: DataValue; action?: DataInputSaveAction; cellId: string},
    rowId: string
  ) {
    this.attributeValueChange.emit({...data, rowId});
  }

  public onLinkValueChange(
    data: {linkTypeId: string; selectedData: FormLinkSelectedData; action?: DataInputSaveAction; cellId: string},
    rowId: string
  ) {
    this.linkValueChange.emit({...data, rowId});
  }

  public onEditCancel(rowId: string, cellId: string) {
    this.editCancel.emit({rowId, cellId});
  }

  public onEditStart(rowId: string, cellId: string) {
    this.editStart.emit({rowId, cellId});
  }
}
