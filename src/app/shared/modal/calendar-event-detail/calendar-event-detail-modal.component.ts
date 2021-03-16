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
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {Query} from '../../../core/store/navigation/query/query';
import {selectAllCollections, selectCollectionById} from '../../../core/store/collections/collections.state';
import {map, take, tap} from 'rxjs/operators';
import {CalendarBar, CalendarConfig, CalendarStemConfig} from '../../../core/store/calendars/calendar';
import {isAllDayEvent, isAllDayEventSingle} from '../../../view/perspectives/calendar/util/calendar-util';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import * as moment from 'moment';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {AttributesResource, AttributesResourceType, DataResource, DataResourceData} from '../../../core/model/resource';
import {
  constraintContainsHoursInConfig,
  parseDateTimeByConstraint,
  subtractDatesToDurationCountsMap,
} from '../../utils/date.utils';
import {selectAllLinkTypes, selectLinkTypeById} from '../../../core/store/link-types/link-types.state';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {findAttributeConstraint} from '../../../core/store/collections/collection.util';
import {toNumber} from '../../utils/common.utils';
import {LinkType} from '../../../core/store/link-types/link.type';
import {generateDocumentData} from '../../../core/store/documents/document.utils';
import {selectViewQuery} from '../../../core/store/views/views.state';
import {selectCollectionsPermissions} from '../../../core/store/user-permissions/user-permissions.state';
import {
  AttributeFilter,
  ConstraintData,
  ConstraintType,
  DurationConstraint,
  durationCountsMapToString,
} from '@lumeer/data-filters';

const DEFAULT_EVENT_DURATION = 60;

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

  public resource$: Observable<AttributesResource>;
  public dataResource$: Observable<DataResource>;
  public query$: Observable<Query>;
  public collections$: Observable<Collection[]>;
  public linkTypes$: Observable<LinkType[]>;
  public permissions$: Observable<Record<string, AllowedPermissions>>;

  public allDay$ = new BehaviorSubject(false);
  public stemIndex$ = new BehaviorSubject<number>(0);

  private currentResource: AttributesResource;
  private currentDataResource: DataResource;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.query$ = this.store$.pipe(select(selectViewQuery));
    this.collections$ = this.store$.pipe(select(selectAllCollections));
    this.linkTypes$ = this.store$.pipe(select(selectAllLinkTypes));
    this.permissions$ = this.store$.pipe(select(selectCollectionsPermissions));

    this.initResources();
  }

  private initResources() {
    if (this.dataResource && this.resource) {
      this.dataResource$ = of(this.dataResource);
      this.resource$ = of(this.resource);
      this.checkIsAllDay(this.stemIndex, this.dataResource, this.resource);

      this.stemIndex$.next(this.stemIndex);
    } else {
      this.onStemIndexSelect(0);
      this.allDay$.next(this.end ? isAllDayEvent(this.start, this.end) : isAllDayEventSingle(this.start));
    }
  }

  private checkIsAllDay(stemIndex: number, dataResource: DataResource, resource: AttributesResource) {
    const stemConfig = this.getStemConfig(stemIndex);
    if (stemConfig) {
      const startProperty = stemConfig.start;
      const endProperty = stemConfig.end;

      const start =
        startProperty &&
        parseDateTimeByConstraint(
          dataResource.data?.[startProperty.attributeId],
          findAttributeConstraint(resource?.attributes, startProperty.attributeId)
        );
      const end =
        endProperty &&
        parseDateTimeByConstraint(
          dataResource.data?.[endProperty.attributeId],
          findAttributeConstraint(resource?.attributes, endProperty.attributeId)
        );
      this.allDay$.next(end ? isAllDayEvent(start, end) : isAllDayEventSingle(start));
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
    return combineLatest([this.selectResourceByStemIndex$(stemIndex), this.store$.pipe(select(selectViewQuery))]).pipe(
      tap(([resource]) => (this.currentResource = resource)),
      map(([resource, query]) => {
        const stemConfig = this.getStemConfig(stemIndex);
        const dataModel = stemConfig?.name || stemConfig?.start;
        const startMoment = moment(this.start);

        const data = generateDocumentData(
          resource,
          this.queryStemFilters(query, stemIndex, dataModel),
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
      take(1),
      tap(dataResource => (this.currentDataResource = dataResource))
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

  public onDataResourceChanged(dataResource: DataResource) {
    this.checkIsAllDay(this.stemIndex, dataResource, this.currentResource);
    this.currentDataResource = dataResource;
  }

  public onAllDayChecked(allDay: boolean) {
    const data = {};
    const stemConfig = this.getStemConfig(this.stemIndex$.value);
    if (stemConfig) {
      const end = <Date>this.end;
      const startProperty = stemConfig.start;
      const endProperty = stemConfig.end;
      let newStart = null;
      if (startProperty) {
        if (allDay) {
          const start = this.currentDataResource?.data?.[startProperty.attributeId];
          newStart = start && this.cleanDateWhenAllDay(start, startProperty);
          data[startProperty.attributeId] = newStart;
        } else if (endProperty ? isAllDayEvent(this.start, end) : isAllDayEventSingle(this.start)) {
          const cleaned = this.cleanDateWhenAllDay(this.start, startProperty);
          cleaned.setHours(9);
          newStart = cleaned;
          data[startProperty.attributeId] = cleaned;
        } else if (this.start) {
          newStart = this.start;
          data[startProperty.attributeId] = this.start;
        }
      }

      if (endProperty) {
        const currentEnd = this.currentDataResource?.data?.[endProperty.attributeId];
        if (allDay) {
          if (this.end) {
            data[endProperty.attributeId] = this.cleanDateWhenAllDay(this.end, endProperty);
          } else {
            data[endProperty.attributeId] = currentEnd && this.cleanDateWhenAllDay(currentEnd, endProperty);
          }
        } else if (isAllDayEvent(this.start, currentEnd)) {
          data[endProperty.attributeId] = moment(newStart).add(DEFAULT_EVENT_DURATION, 'minutes').toDate();
        } else if (this.end) {
          data[endProperty.attributeId] = this.end;
        } else if (newStart) {
          data[endProperty.attributeId] = moment(newStart).add(DEFAULT_EVENT_DURATION, 'minutes').toDate();
        }
      }

      if (Object.keys(data).length) {
        this.allDay$.next(allDay);

        Object.keys(data).forEach(key => {
          data[key] = moment(data[key]).toISOString();
        });

        this.emitNewDataResource(this.currentDataResource, data, this.stemConfigResourceType(stemConfig));
      }
    }
  }

  private stemConfigResourceType(stemConfig: CalendarStemConfig): AttributesResourceType {
    return (stemConfig.name || stemConfig.start).resourceType;
  }

  private emitNewDataResource(
    dataResource: DataResource,
    patchData: DataResourceData,
    resourceType: AttributesResourceType
  ) {
    if (dataResource.id) {
      if (resourceType === AttributesResourceType.Collection) {
        this.store$.dispatch(
          new DocumentsAction.PatchData({
            document: {
              ...(dataResource as DocumentModel),
              data: patchData,
            },
          })
        );
      } else if (resourceType === AttributesResourceType.LinkType) {
        this.store$.dispatch(
          new LinkInstancesAction.PatchData({
            linkInstance: {
              ...(dataResource as LinkInstance),
              data: patchData,
            },
          })
        );
      }
    } else {
      this.dataResource$ = of({...dataResource, data: {...dataResource.data, ...patchData}});
    }
  }

  public onStemIndexSelect(index: number) {
    this.resource$ = this.selectResourceByStemIndex$(index);
    this.dataResource$ = this.selectNewDataResource$(index);
    this.stemIndex$.next(index);
  }

  private cleanDateWhenAllDay(date: any, property: CalendarBar): Date {
    return moment(date).hours(0).minutes(0).seconds(0).milliseconds(0).toDate();
  }
}
