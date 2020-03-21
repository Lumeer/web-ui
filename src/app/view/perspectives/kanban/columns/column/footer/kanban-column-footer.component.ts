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
  EventEmitter,
  Output,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {Collection} from '../../../../../../core/store/collections/collection';
import {AttributesResource} from '../../../../../../core/model/resource';
import {QueryStem} from '../../../../../../core/store/navigation/query/query';
import {KanbanAttribute} from '../../../../../../core/store/kanbans/kanban';
import {DropdownOption} from '../../../../../../shared/dropdown/options/dropdown-option';
import {OptionsDropdownComponent} from '../../../../../../shared/dropdown/options/options-dropdown.component';

export interface KanbanResourceCreate {
  resource: AttributesResource;
  stem: QueryStem;
  kanbanAttribute: KanbanAttribute;
}

@Component({
  selector: 'kanban-column-footer',
  templateUrl: './kanban-column-footer.component.html',
  styleUrls: ['./kanban-column-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanColumnFooterComponent implements OnChanges {
  @Input()
  public resources: KanbanResourceCreate[];

  @Input()
  public count: number = 0;

  @Output()
  public selectResource = new EventEmitter<KanbanResourceCreate>();

  @ViewChild(OptionsDropdownComponent)
  public dropdown: OptionsDropdownComponent;

  public dropdownOptions: DropdownOption[] = [];

  public ngOnChanges(changes: SimpleChanges) {
    this.dropdownOptions = (this.resources || []).map(resourceCreate => ({
      value: resourceCreate,
      displayValue: resourceCreate.resource.name,
      icons: [(<Collection>resourceCreate.resource).icon],
      iconColors: [(<Collection>resourceCreate.resource).color],
    }));
  }

  public onButtonClick() {
    this.dropdown.open();
  }

  public onOptionSelect(option: DropdownOption) {
    const value = option.value as KanbanResourceCreate;
    this.selectResource.emit(value);
  }
}
