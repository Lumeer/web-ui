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
import {WorkflowTableTitle} from '../../../model/workflow-table';
import {Collection} from '../../../../../../core/store/collections/collection';
import {WorkflowStemConfig} from '../../../../../../core/store/workflows/workflow';
import {DataInputConfiguration} from '../../../../../../shared/data-input/data-input-configuration';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {AttributesResource} from '../../../../../../core/model/resource';
import {ConstraintType, findResourceByQueryResource} from '@lumeer/data-filters';

@Component({
  selector: 'workflow-table-title',
  templateUrl: './workflow-table-title.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowTableTitleComponent implements OnChanges {
  @Input()
  public title: WorkflowTableTitle;

  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public stemConfig: WorkflowStemConfig;

  public readonly configuration: DataInputConfiguration = {color: {limitWidth: true}};
  public readonly constraintType = ConstraintType;

  public resource: AttributesResource;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collections || changes.linkTypes || changes.stemConfig) {
      this.resource = findResourceByQueryResource(this.stemConfig?.attribute, this.collections, this.linkTypes);
    }
  }
}
