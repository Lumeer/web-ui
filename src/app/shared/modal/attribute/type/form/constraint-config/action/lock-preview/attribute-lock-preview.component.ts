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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {Attribute, AttributeLock} from '../../../../../../../../core/store/collections/collection';
import {ModalService} from '../../../../../../modal.service';
import {AttributesResource, AttributesResourceType} from '../../../../../../../../core/model/resource';
import {getAttributesResourceType} from '../../../../../../../utils/resource.utils';
import {AttributeFilter} from '@lumeer/data-filters/dist/model/attribute-filter';

@Component({
  selector: 'attribute-lock-preview',
  templateUrl: './attribute-lock-preview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeLockPreviewComponent implements OnChanges {
  @Input()
  public attribute: Attribute;

  @Input()
  public resource: AttributesResource;

  @Input()
  public overrideLock: AttributeLock;

  @Output()
  public lockChange = new EventEmitter<AttributeLock>();

  public lock: AttributeLock;
  public filters: AttributeFilter[];

  constructor(private modalService: ModalService) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.overrideLock || changes.attribute) {
      this.lock = this.overrideLock || this.attribute?.lock;
      this.filters = (this.lock?.exceptionGroups || []).reduce((filters, group) => {
        filters.push(...(group.equation?.equations?.map(eq => eq.filter) || []));
        return filters;
      }, []);
    }
  }

  public onClick() {
    const resourceType = getAttributesResourceType(this.resource);
    const collectionId = resourceType === AttributesResourceType.Collection ? this.resource.id : null;
    const linkTypeId = resourceType === AttributesResourceType.Collection ? this.resource.id : null;
    const ref = this.modalService.showAttributeLock(
      this.attribute.id,
      collectionId,
      linkTypeId,
      true,
      this.overrideLock
    );
    ref.content.onSubmit$.subscribe(lock => this.lockChange.emit(lock));
  }
}
