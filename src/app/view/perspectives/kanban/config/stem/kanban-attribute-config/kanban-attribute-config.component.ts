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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {SelectItemModel} from '../../../../../../shared/select/select-item/select-item.model';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {KanbanAttribute} from '../../../../../../core/store/kanbans/kanban';

@Component({
  selector: 'kanban-attribute-config',
  templateUrl: './kanban-attribute-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanAttributeConfigComponent {
  @Input()
  public kanbanAttribute: KanbanAttribute;

  @Input()
  public availableAttributes: SelectItemModel[];

  @Input()
  public icon: string;

  @Output()
  public attributeSelect = new EventEmitter<KanbanAttribute>();

  @Output()
  public attributeRemove = new EventEmitter();

  public readonly buttonClasses = 'flex-grow-1 text-truncate';
  public readonly emptyValueString: string;

  constructor(private i18n: I18n) {
    this.emptyValueString = i18n({id: 'kanban.config.attribute.empty', value: 'Select attribute'});
  }

  public onAttributeSelected(attribute: KanbanAttribute) {
    this.attributeSelect.emit(attribute);
  }

  public onAttributeRemoved() {
    this.attributeRemove.emit();
  }
}
