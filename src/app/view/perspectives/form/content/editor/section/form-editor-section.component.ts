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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {CdkDragDrop} from '@angular/cdk/drag-drop';

import {FormRow, FormRowLayoutType, FormSection} from '../../../../../../core/store/form/form-model';
import {Collection} from '../../../../../../core/store/collections/collection';
import {generateCorrelationId} from '../../../../../../shared/utils/resource.utils';
import {COLOR_GRAY700} from '../../../../../../core/constants';
import {LinkType} from '../../../../../../core/store/link-types/link.type';

@Component({
  selector: 'form-editor-section',
  templateUrl: './form-editor-section.component.html',
  styleUrls: ['./form-editor-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEditorSectionComponent {
  @Input()
  public section: FormSection;

  @Input()
  public collection: Collection;

  @Input()
  public collectionLinkTypes: LinkType[];

  @Input()
  public sectionIds: string[];

  @Input()
  public usedAttributeIds: string[];

  @Input()
  public usedLinkTypeIds: string[];

  @Output()
  public sectionChange = new EventEmitter<FormSection>();

  @Output()
  public delete = new EventEmitter();

  @Output()
  public rowMoveToSection = new EventEmitter<{fromSection: string; toSection: string; from: number; to: number}>();

  public readonly descriptionColor = COLOR_GRAY700;

  public addRow(layout: FormRowLayoutType) {
    const newRows = [...(this.section?.rows || [])];
    const cells = layout.map((span, index) => ({id: `${generateCorrelationId()}${index}`, span}));
    newRows.push({id: generateCorrelationId(), cells});
    this.onRowsChange(newRows);
  }

  public onRowsChange(rows: FormRow[]) {
    const section = {...this.section, rows};
    this.sectionChange.emit(section);
  }

  public onRowChange(row: FormRow, index: number) {
    const newRows = [...(this.section?.rows || [])];
    newRows[index] = row;
    this.onRowsChange(newRows);
  }

  public onRowDelete(index: number) {
    const newRows = [...(this.section?.rows || [])];
    newRows.splice(index, 1);
    this.onRowsChange(newRows);
  }

  public rowDropped(event: CdkDragDrop<FormRow, FormSection>) {
    this.rowMoveToSection.emit({
      fromSection: event.previousContainer.id,
      toSection: event.container.id,
      from: event.previousIndex,
      to: event.currentIndex,
    });
  }

  public trackByRow(index: number, row: FormRow): string {
    return row.id;
  }

  public onNewTitle(title: string) {
    const section = {...this.section, title};
    this.sectionChange.emit(section);
  }

  public onNewDescription(description: string) {
    const section = {...this.section, description};
    this.sectionChange.emit(section);
  }
}
