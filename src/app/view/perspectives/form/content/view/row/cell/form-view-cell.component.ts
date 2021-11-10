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

import {ChangeDetectionStrategy, Component, Input, OnChanges, Output, SimpleChanges, EventEmitter} from '@angular/core';
import {
  FormAttributeCellConfig,
  FormCell,
  FormCellType,
  FormLinkCellConfig,
} from '../../../../../../../core/store/form/form-model';
import {Attribute, Collection} from '../../../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../../../core/store/link-types/link.type';
import {ConstraintData, DataValue} from '@lumeer/data-filters';
import {findAttribute} from '../../../../../../../core/store/collections/collection.util';
import {BehaviorSubject} from 'rxjs';
import {DataInputConfiguration} from '../../../../../../../shared/data-input/data-input-configuration';
import {DocumentModel} from '../../../../../../../core/store/documents/document.model';

@Component({
  selector: 'form-view-cell',
  templateUrl: './form-view-cell.component.html',
  styleUrls: ['./form-view-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormViewCellComponent implements OnChanges {
  @Input()
  public cell: FormCell;

  @Input()
  public document: DocumentModel;

  @Input()
  public collection: Collection;

  @Input()
  public collectionLinkTypes: LinkType[];

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public attributeValueChange = new EventEmitter<{attributeId: string; dataValue: DataValue}>();

  public readonly type = FormCellType;
  public readonly dataInputConfiguration: DataInputConfiguration = {
    common: {allowRichText: true},
  };

  public editing$ = new BehaviorSubject(false);

  public attribute: Attribute;
  public dataValue: DataValue;
  public mandatory: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.cell) {
      this.initVariables();
    }
    if (changes.cell || changes.constraintData || changes.document) {
      this.initDataVariables();
    }
  }

  private initDataVariables() {
    switch (this.cell?.type) {
      case FormCellType.Attribute:
        this.initAttributeDataVariables();
        break;
    }
  }

  private initAttributeDataVariables() {
    const config = <FormAttributeCellConfig>this.cell?.config;

    this.attribute = findAttribute(this.collection?.attributes, config?.attributeId);
    const value = this.document?.data?.[this.attribute?.id];
    this.dataValue = this.attribute?.constraint?.createDataValue(value, this.constraintData);
  }

  private initVariables() {
    switch (this.cell?.type) {
      case FormCellType.Attribute:
        this.initAttributeVariables();
        break;
      case FormCellType.Link:
        this.initLinkVariables();
        break;
    }
  }

  private initAttributeVariables() {
    const config = <FormAttributeCellConfig>this.cell?.config;

    this.mandatory = config?.mandatory;
  }

  private initLinkVariables() {
    const config = <FormLinkCellConfig>this.cell?.config;

    this.mandatory = config?.minLinks > 0;
  }

  public onDataInputClick(event: MouseEvent) {
    if (!this.editing$.value) {
      this.editing$.next(true);
    }
  }

  public onValueSave(dataValue: DataValue) {
    this.editing$.next(false);

    if (this.attribute) {
      this.attributeValueChange.emit({attributeId: this.attribute.id, dataValue});
    }
  }

  public onCancelEditing() {
    this.editing$.next(false);
  }
}
