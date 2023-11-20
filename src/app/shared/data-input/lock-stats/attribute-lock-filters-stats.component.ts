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
import {AttributeLock, AttributeLockFiltersStats, ConstraintData} from '@lumeer/data-filters';
import {Attribute} from '../../../core/store/collections/collection';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {Observable, of} from 'rxjs';
import {selectCollectionById} from '../../../core/store/collections/collections.state';
import {map} from 'rxjs/operators';
import {selectLinkTypeById} from '../../../core/store/link-types/link-types.state';
import {objectsByIdMap} from '@lumeer/utils';

@Component({
  selector: 'attribute-lock-filters-stats',
  templateUrl: './attribute-lock-filters-stats.component.html',
  styleUrls: ['./attribute-lock-filters-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeLockFiltersStatsComponent implements OnChanges {
  @Input()
  public lock: AttributeLock;

  @Input()
  public stats: AttributeLockFiltersStats;

  @Input()
  public collectionId: string;

  @Input()
  public linkTypeId: string;

  @Input()
  public attributesMap: Record<string, Attribute>;

  @Input()
  public constraintData: ConstraintData;

  constructor(private store$: Store<AppState>) {}

  public attributesMap$: Observable<Record<string, Attribute>>;

  public trackByIndex(index: number, object: any): string {
    return String(index);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.attributesMap || changes.collectionId || changes.linkTypeId) {
      if (this.attributesMap) {
        this.attributesMap$ = of(this.attributesMap);
      } else if (this.collectionId) {
        this.attributesMap$ = this.store$.pipe(
          select(selectCollectionById(this.collectionId)),
          map(collection => objectsByIdMap(collection?.attributes))
        );
      } else if (this.linkTypeId) {
        this.attributesMap$ = this.store$.pipe(
          select(selectLinkTypeById(this.collectionId)),
          map(linkType => objectsByIdMap(linkType?.attributes))
        );
      } else {
        this.attributesMap$ = of({});
      }
    }
  }
}
