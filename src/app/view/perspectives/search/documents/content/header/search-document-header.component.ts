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
import {ConstraintData} from '../../../../../../core/model/data/constraint';
import {ResourceType} from '../../../../../../core/model/resource-type';

import {Collection} from '../../../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../../../core/store/documents/document.model';
import {SizeType} from '../../../../../../shared/slider/size-type';
import {Role} from '../../../../../../core/model/role';
import {findAttributeConstraint, getDefaultAttributeId} from '../../../../../../core/store/collections/collection.util';
import {Constraint} from '../../../../../../core/model/constraint';

@Component({
  selector: 'search-document-header',
  templateUrl: './search-document-header.component.html',
  styleUrls: ['./search-document-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchDocumentHeaderComponent implements OnChanges {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public isOpened: boolean;

  @Input()
  public size: SizeType;

  @Output()
  public detail = new EventEmitter();

  @Output()
  public toggleFavorite = new EventEmitter();

  public readonly collectionType = ResourceType.Collection;
  public readonly sizeType = SizeType;
  public readonly readRole = Role.Read;

  public defaultAttributeId: string;
  public defaultConstraint: Constraint;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collection) {
      this.defaultAttributeId = getDefaultAttributeId(this.collection);
      this.defaultConstraint = findAttributeConstraint(
        this.collection && this.collection.attributes,
        this.defaultAttributeId
      );
    }
  }

  public onDetail() {
    this.detail.emit();
  }

  public onToggleFavorite() {
    this.toggleFavorite.emit();
  }
}
