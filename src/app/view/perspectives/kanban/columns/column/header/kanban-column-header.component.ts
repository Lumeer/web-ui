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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output, OnChanges, SimpleChanges} from '@angular/core';
import {BooleanConstraint} from '../../../../../../core/model/constraint/boolean.constraint';
import {UserConstraint} from '../../../../../../core/model/constraint/user.constraint';
import {KanbanAttribute, KanbanColumn} from '../../../../../../core/store/kanbans/kanban';
import {ConstraintType} from '../../../../../../core/model/data/constraint';
import {SelectConstraint} from '../../../../../../core/model/constraint/select.constraint';
import {Constraint} from '../../../../../../core/model/constraint';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {Collection} from '../../../../../../core/store/collections/collection';
import {PivotAttribute} from '../../../../../../core/store/pivots/pivot';
import {AttributesResource, AttributesResourceType} from '../../../../../../core/model/resource';
import {findAttributeConstraint} from '../../../../../../core/store/collections/collection.util';

@Component({
  selector: 'kanban-column-header',
  templateUrl: './kanban-column-header.component.html',
  styleUrls: ['./kanban-column-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanColumnHeaderComponent implements OnChanges {
  @Input()
  public column: KanbanColumn;

  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Output()
  public remove = new EventEmitter();

  public readonly constraintTypes = ConstraintType;

  public readonly booleanConstraint = new BooleanConstraint();
  public readonly userConstraint = new UserConstraint({externalUsers: true});
  public readonly selectConstraint = new SelectConstraint({options: []});

  public columnConstraint: Constraint;

  public ngOnChanges(changes: SimpleChanges) {
    this.columnConstraint = this.createColumnConstraint();
  }

  private createColumnConstraint(): Constraint {
    const createdFromAttributes = (this.column && this.column.createdFromAttributes) || [];
    const constraints = createdFromAttributes
      .map(attr => {
        const resource = this.findResource(attr);
        return resource && findAttributeConstraint(resource.attributes, attr.attributeId);
      })
      .filter(attr => !!attr);
    return constraints[0];
  }

  private findResource(kanbanAttribute: KanbanAttribute): AttributesResource {
    if (kanbanAttribute.resourceType === AttributesResourceType.Collection) {
      return (this.collections || []).find(collection => collection.id === kanbanAttribute.resourceId);
    } else if (kanbanAttribute.resourceType === AttributesResourceType.LinkType) {
      return (this.linkTypes || []).find(linkType => linkType.id === kanbanAttribute.resourceId);
    }

    return null;
  }

  public onRemove() {
    this.remove.emit();
  }
}
