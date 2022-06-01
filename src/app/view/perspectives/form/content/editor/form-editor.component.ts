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
import {transferArrayItem} from '@angular/cdk/drag-drop';
import {FormButtonsConfig, FormConfig, FormSection} from '../../../../../core/store/form/form-model';
import {Collection} from '../../../../../core/store/collections/collection';
import {generateId} from '../../../../../shared/utils/resource.utils';
import {collectAttributesIdsFromFormConfig, collectLinkIdsFromFormConfig} from '../../form-utils';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {AttributesSettings, View} from '../../../../../core/store/views/view';

@Component({
  selector: 'form-editor',
  templateUrl: './form-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEditorComponent implements OnChanges {
  @Input()
  public config: FormConfig;

  @Input()
  public collection: Collection;

  @Input()
  public collectionLinkTypes: LinkType[];

  @Input()
  public attributesSettings: AttributesSettings;

  @Input()
  public view: View;

  @Output()
  public configChange = new EventEmitter<FormConfig>();

  public sectionIds: string[];
  public usedAttributeIds: string[];
  public usedLinkTypeIds: string[];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.sectionIds = [...(this.config?.sections || []).map(section => section.id)];
      this.usedAttributeIds = collectAttributesIdsFromFormConfig(this.config);
      this.usedLinkTypeIds = collectLinkIdsFromFormConfig(this.config);
    }
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
    const sections = [...(this.config?.sections || [])].map(section => ({...section, rows: [...(section.rows || [])]}));
    const previousSection = sections.find(section => section.id === data.fromSection);
    const currentSection = sections.find(section => section.id === data.toSection);
    transferArrayItem(previousSection.rows, currentSection.rows, data.from, data.to);

    this.configChange.emit({...this.config, sections});
  }

  public onSectionDelete(index: number) {
    const sections = [...(this.config?.sections || [])];
    sections.splice(index, 1);
    this.configChange.emit({...this.config, sections});
  }

  public onButtonsChange(buttons: FormButtonsConfig) {
    this.configChange.emit({...this.config, buttons});
  }

  public createOnlyModeChanged(createOnly: boolean) {
    this.configChange.emit({...this.config, createOnly});
  }
}
