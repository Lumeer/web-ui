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
import {FormConfig, FormRow, FormSection} from '../../../../../core/store/form/form-model';
import {Collection} from '../../../../../core/store/collections/collection';
import {generateId} from '../../../../../shared/utils/resource.utils';

const DEFAULT_SECTION_ID = 'default';

@Component({
  selector: 'form-editor',
  templateUrl: './form-editor.component.html',
  styleUrls: ['./form-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEditorComponent implements OnChanges {
  @Input()
  public config: FormConfig;

  @Input()
  public collection: Collection;

  @Output()
  public configChange = new EventEmitter<FormConfig>();

  // first section without title and description
  public emptySection: FormSection;
  public sectionIds: string[];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.emptySection = {id: DEFAULT_SECTION_ID, rows: this.config?.rows};
      this.sectionIds = [DEFAULT_SECTION_ID, ...(this.config?.sections || []).map(section => section.id)];
    }
  }

  public onEmptySectionChanged(section: FormSection) {
    const config = {...this.config, rows: section.rows};
    this.configChange.emit(config);
  }

  public onSectionChanged(section: FormSection, index: number) {
    const sections = [...(this.config?.sections || [])];
    sections[index] = section;
    this.configChange.emit({...this.config, sections});
  }

  public addSection() {
    const sections = [...(this.config?.sections || [])];
    sections.push({id: generateId(), rows: []});
    this.configChange.emit({...this.config, sections});
  }

  public trackBySection(index: number, section: FormSection): string {
    return section.id;
  }

  public onRowMoveToSection(data: {fromSection: string; toSection: string; from: number; to: number}) {
    const defaultRows = [...(this.config?.rows || [])];
    const sections = [...(this.config?.sections || [])];

    let row: FormRow;
    if (data.fromSection === DEFAULT_SECTION_ID) {
      row = defaultRows.splice(data.from, 1)[0];
    } else {
      const sectionIndex = sections.findIndex(section => section.id === data.fromSection);
      const section = sections[sectionIndex];
      const rows = [...(section.rows || [])];
      row = rows.splice(data.from, 1)[0];
      sections[sectionIndex] = {...section, rows};
    }

    if (data.toSection === DEFAULT_SECTION_ID) {
      defaultRows.splice(data.to, 0, row);
    } else {
      const sectionIndex = sections.findIndex(section => section.id === data.toSection);
      const section = sections[sectionIndex];
      const rows = [...(section.rows || [])];
      rows.splice(data.to, 0, row);
      sections[sectionIndex] = {...section, rows};
    }

    this.configChange.emit({...this.config, rows: defaultRows, sections});
  }

  public onSectionDelete(index: number) {
    const sections = [...(this.config?.sections || [])];
    sections.splice(index, 1);
    this.configChange.emit({...this.config, sections});
  }
}
