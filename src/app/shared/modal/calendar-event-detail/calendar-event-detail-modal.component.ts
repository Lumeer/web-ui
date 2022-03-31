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

import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {Collection} from '../../../core/store/collections/collection';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {Query} from '../../../core/store/navigation/query/query';
import {selectAllCollections, selectCollectionById} from '../../../core/store/collections/collections.state';
import {map, take} from 'rxjs/operators';
import {CalendarBar, CalendarConfig, CalendarStemConfig} from '../../../core/store/calendars/calendar';
import {ResourcesPermissions} from '../../../core/model/allowed-permissions';
import * as moment from 'moment';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../core/model/resource';
import {constraintContainsHoursInConfig, subtractDatesToDurationCountsMap} from '../../utils/date.utils';
import {selectAllLinkTypes, selectLinkTypeById} from '../../../core/store/link-types/link-types.state';
import {findAttributeConstraint} from '../../../core/store/collections/collection.util';
import {toNumber} from '../../utils/common.utils';
import {LinkType} from '../../../core/store/link-types/link.type';
import {generateDocumentData} from '../../../core/store/documents/document.utils';
import {
  AttributeFilter,
  ConstraintData,
  ConstraintType,
  DurationConstraint,
  durationCountsMapToString,
} from '@lumeer/data-filters';
import {selectResourcesPermissionsByView} from '../../../core/store/common/permissions.selectors';
import {View} from '../../../core/store/views/view';

@Component({
  templateUrl: './calendar-event-detail-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarEventDetailModalComponent implements OnInit {
  @Input()
  public resource: AttributesResource;

  @Input()
  public dataResource: DataResource;

  @Input()
  public stemIndex: number = 0;

  @Input()
  public start: Date;

  @Input()
  public end: Date;

  @Input()
  public config: CalendarConfig;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public view: View;

  @Input()
  public query: Query;

  public resource$: Observable<AttributesResource>;
  public dataResource$: Observable<DataResource>;
  public query$: Observable<Query>;
  public collections$: Observable<Collection[]>;
  public linkTypes$: Observable<LinkType[]>;
  public permissions$: Observable<ResourcesPermissions>;

  public stemIndex$ = new BehaviorSubject<number>(0);

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.collections$ = this.store$.pipe(select(selectAllCollections));
    this.linkTypes$ = this.store$.pipe(select(selectAllLinkTypes));
    this.permissions$ = this.store$.pipe(select(selectResourcesPermissionsByView(this.view)));

    this.initResources();
  }

  private initResources() {
    if (this.dataResource && this.resource) {
      this.dataResource$ = of(this.dataResource);
      this.resource$ = of(this.resource);
      this.stemIndex$.next(this.stemIndex);
    } else {
      this.onStemIndexSelect(0);
    }
  }

  private getStemConfig(stemIndex: number): CalendarStemConfig {
    return this.config?.stemsConfigs?.[stemIndex];
  }

  private selectResourceByStemIndex$(index: number): Observable<AttributesResource> {
    const stemConfig = this.getStemConfig(index);
    if (stemConfig) {
      const dataModel = stemConfig.name || stemConfig.start;
      if (dataModel?.resourceType === AttributesResourceType.Collection) {
        return this.store$.pipe(select(selectCollectionById(dataModel.resourceId)));
      } else if (dataModel?.resourceType === AttributesResourceType.LinkType) {
        return this.store$.pipe(select(selectLinkTypeById(dataModel.resourceId)));
      }
    }
    return of(null);
  }

  private selectNewDataResource$(stemIndex: number): Observable<DataResource> {
    return this.selectResourceByStemIndex$(stemIndex).pipe(
      map(resource => {
        const stemConfig = this.getStemConfig(stemIndex);
        const dataModel = stemConfig?.name || stemConfig?.start;
        const startMoment = moment(this.start);

        const data = generateDocumentData(
          resource,
          this.queryStemFilters(this.query, stemIndex, dataModel),
          this.constraintData
        );

        if (this.dataResource?.data && resource.id === this.dataResource?.id) {
          Object.keys(this.dataResource.data).forEach(key => (data[key] = this.dataResource.data[key]));
        }

        if (this.modelsAreFromSameResources(stemConfig?.name, dataModel)) {
          data[stemConfig.name.attributeId] = this.getInitialTitleName();
        }

        if (this.modelsAreFromSameResources(stemConfig?.start, dataModel)) {
          data[stemConfig.start.attributeId] = startMoment.toISOString();
        }

        if (this.modelsAreFromSameResources(stemConfig?.end, dataModel)) {
          const constraint = findAttributeConstraint(resource.attributes, stemConfig.end.attributeId);
          if (constraint?.type === ConstraintType.Duration) {
            const durationCountsMap = subtractDatesToDurationCountsMap(this.end, this.start);
            const durationString = durationCountsMapToString(durationCountsMap);
            const dataValue = (<DurationConstraint>constraint).createDataValue(durationString, this.constraintData);

            data[stemConfig.end.attributeId] = toNumber(dataValue.serialize());
          } else {
            const endMoment = moment(this.end);
            const endMomentStartOfDay = moment(this.end).startOf('day');
            if (
              !constraintContainsHoursInConfig(constraint) &&
              startMoment.day() !== endMoment.day() &&
              endMoment.isSame(endMomentStartOfDay)
            ) {
              data[stemConfig.end.attributeId] = endMoment.subtract(1, 'days').toISOString();
            } else {
              data[stemConfig.end.attributeId] = endMoment.toISOString();
            }
          }
        }
        return {
          data,
          collectionId: dataModel?.resourceType === AttributesResourceType.Collection ? resource?.id : undefined,
          linkTypeId: dataModel?.resourceType === AttributesResourceType.LinkType ? resource?.id : undefined,
        };
      }),
      take(1)
    );
  }

  private queryStemFilters(query: Query, stemIndex: number, model: CalendarBar): AttributeFilter[] {
    const queryStem = query?.stems?.[stemIndex];
    if (model.resourceType === AttributesResourceType.Collection) {
      return queryStem?.filters?.filter(attributeFilter => attributeFilter.collectionId === model.resourceId) || [];
    }
    return queryStem?.linkFilters?.filter(attributeFilter => attributeFilter.linkTypeId === model.resourceId) || [];
  }

  private modelsAreFromSameResources(model1: CalendarBar, model2: CalendarBar): boolean {
    return model1 && model2 && model1.resourceId === model2.resourceId && model1.resourceType === model2.resourceType;
  }

  private getInitialTitleName(): string {
    return $localize`:@@dialog.create.calendar.event.default.title:New event`;
  }

  public onStemIndexSelect(index: number) {
    this.resource$ = this.selectResourceByStemIndex$(index);
    this.dataResource$ = this.selectNewDataResource$(index);
    this.stemIndex$.next(index);
  }
}
