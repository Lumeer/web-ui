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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Constraint, ConstraintData, DataValue} from '@lumeer/data-filters';
import {isNullOrUndefined, objectsByIdMap} from '../../../../../../utils/common.utils';
import {AttributesResource} from '../../../../../../../core/model/resource';
import {DataInputConfiguration} from '../../../../../../data-input/data-input-configuration';

interface ChangeEntry {
  label?: string;
  attributeId: string;
  dataValue: DataValue;
  constraint: Constraint;
  deleted: boolean;
}

@Component({
  selector: 'audit-log-entries',
  templateUrl: './audit-log-entries.component.html',
  styleUrls: ['./audit-log-entries.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogEntriesComponent implements OnChanges {
  @Input()
  public constraintData: ConstraintData;

  @Input()
  public parent: AttributesResource;

  @Input()
  public changes: Record<string, any>;

  @Input()
  public valueClasses: string;

  public entries: ChangeEntry[];

  public readonly configuration: DataInputConfiguration = {color: {limitWidth: true}};

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.parent || changes.changes || changes.constraintData) {
      this.createEntries();
    }
  }

  public createEntries() {
    const attributesMap = objectsByIdMap(this.parent?.attributes);
    this.entries = Object.keys(this.changes || {}).reduce<ChangeEntry[]>((array, attributeId) => {
      const attribute = attributesMap[attributeId];
      const value = this.changes?.[attributeId];
      if (attribute) {
        array.push({
          attributeId,
          constraint: attribute.constraint,
          label: attribute.name,
          dataValue: attribute.constraint?.createDataValue(value, this.constraintData),
          deleted: isNullOrUndefined(value),
        });
      }

      return array;
    }, []);
  }
}
