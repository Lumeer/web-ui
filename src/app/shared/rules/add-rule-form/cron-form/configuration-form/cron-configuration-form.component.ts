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
import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {AbstractControl, UntypedFormGroup} from '@angular/forms';

import {Store, select} from '@ngrx/store';

import * as moment from 'moment';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {isDateValid} from '@lumeer/utils';

import {ConfigurationService} from '../../../../../configuration/configuration.service';
import {LanguageCode} from '../../../../../core/model/language';
import {ChronoUnit, Rule, maxIntervalByChronoUnit} from '../../../../../core/model/rule';
import {AppState} from '../../../../../core/store/app.state';
import {Collection} from '../../../../../core/store/collections/collection';
import {selectAllCollections} from '../../../../../core/store/collections/collections.state';
import {selectViewsByReadSorted} from '../../../../../core/store/common/permissions.selectors';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {getBaseCollectionIdsFromQuery} from '../../../../../core/store/navigation/query/query.util';
import {View} from '../../../../../core/store/views/view';
import {SelectItemModel} from '../../../../select/select-item/select-item.model';
import {createRange} from '../../../../utils/array.utils';
import {bitClear, bitSet, objectChanged} from '../../../../utils/common.utils';
import {defaultDateFormat} from '../../../../utils/date.utils';
import {generateId} from '../../../../utils/resource.utils';

interface DayOfWeek {
  bit: number;
  order: number;
  id: string;
  title: string;
  tooltip: string;
}

@Component({
  selector: 'cron-configuration-form',
  templateUrl: './cron-configuration-form.component.html',
  styleUrls: ['./cron-configuration-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CronConfigurationFormComponent implements OnInit, OnChanges {
  @Input()
  public configForm: UntypedFormGroup;

  @Input()
  public collection: Collection;

  @Input()
  public linkType: LinkType;

  @Input()
  public rule: Rule;

  public readonly unitsItems: SelectItemModel[];
  public readonly hoursItems: SelectItemModel[];
  public readonly dayOfWeeks: DayOfWeek[];
  public readonly dateFormat: string;

  public viewsByCollection$: Observable<View[]>;
  public collections$: Observable<Collection[]>;

  constructor(
    private configurationService: ConfigurationService,
    private store$: Store<AppState>
  ) {
    this.unitsItems = [
      {id: ChronoUnit.Days, value: $localize`:@@cron.unit.days.title:Days`},
      {id: ChronoUnit.Weeks, value: $localize`:@@cron.unit.weeks.title:Weeks`},
      {id: ChronoUnit.Months, value: $localize`:@@cron.unit.months.title:Months`},
    ];

    const offset = this.configurationService.getConfiguration().locale === LanguageCode.EN ? 1 : 0;
    this.dayOfWeeks = $localize`:@@cron.daysOfWeek.units:M|T|W|T|F|S|S`
      .split('|')
      .map((title, index) => ({
        id: generateId(),
        bit: index,
        order: (index + offset) % 7,
        title,
        tooltip: moment.weekdays()[(index + offset) % 7],
      }))
      .sort((a, b) => a.order - b.order);

    this.hoursItems = createRange(0, 24).map(hour => ({
      id: hour.toString(),
      value: moment(hour.toString(), 'HH').format('LT'),
    }));

    this.dateFormat = defaultDateFormat(this.configurationService.getConfiguration().locale);
  }

  public get unitControl(): AbstractControl {
    return this.configForm.get('unit');
  }

  public get hourControl(): AbstractControl {
    return this.configForm.get('hour');
  }

  public get intervalControl(): AbstractControl {
    return this.configForm.get('interval');
  }

  public get startsOnControl(): AbstractControl {
    return this.configForm.get('startsOn');
  }

  public get endsOnControl(): AbstractControl {
    return this.configForm.get('endsOn');
  }

  public get executionsControl(): AbstractControl {
    return this.configForm.get('executionsLeft');
  }

  public get daysOfWeekControl(): AbstractControl {
    return this.configForm.get('daysOfWeek');
  }

  public get viewControl(): AbstractControl {
    return this.configForm.get('viewId');
  }

  public ngOnInit() {
    this.collections$ = this.store$.pipe(select(selectAllCollections));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (objectChanged(changes.collection) && this.collection) {
      this.updateData();
    }
  }

  private updateData() {
    this.viewsByCollection$ = this.store$.pipe(
      select(selectViewsByReadSorted),
      map(views => views.filter(view => getBaseCollectionIdsFromQuery(view.query).includes(this.collection.id)))
    );
  }

  public onUnitSelect(unit: ChronoUnit) {
    this.unitControl.setValue(unit);

    const maxInterval = maxIntervalByChronoUnit(unit);
    if (maxInterval < this.intervalControl.value) {
      this.intervalControl.setValue(maxInterval);
    }
  }

  public onDayOfWeekChange(dayOfWeek: DayOfWeek, checked: boolean) {
    if (checked) {
      this.daysOfWeekControl.setValue(bitSet(this.daysOfWeekControl.value, dayOfWeek.bit));
    } else {
      this.daysOfWeekControl.setValue(bitClear(this.daysOfWeekControl.value, dayOfWeek.bit));
    }
  }

  public onEndDateChange(date: Date) {
    this.executionsControl.setValue(undefined);
    this.endsOnControl.setValue(date);
  }

  public onNeverChecked(checked: boolean) {
    if (checked) {
      this.executionsControl.setValue(undefined);
      this.endsOnControl.setValue(undefined);
    }
  }

  public onEndsOnChecked(checked: boolean) {
    if (checked) {
      const startDate = this.startsOnControl.value;
      if (isDateValid(startDate)) {
        const startMoment = moment(startDate).add(1, 'year');
        this.onEndDateChange(startMoment.toDate());
      } else {
        const endMoment = moment().startOf('day').add(1, 'year');
        this.onEndDateChange(endMoment.toDate());
      }
    }
  }

  public onExecutionsChecked(checked: boolean) {
    if (checked) {
      this.executionsControl.setValue(10);
      this.endsOnControl.setValue(undefined);
    }
  }

  public onSelectView(viewId: string) {
    this.viewControl.setValue(viewId);
  }

  public onRemoveView() {
    this.viewControl.setValue(undefined);
  }
}
