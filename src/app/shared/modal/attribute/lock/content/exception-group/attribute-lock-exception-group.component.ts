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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AbstractControl, UntypedFormArray, UntypedFormGroup} from '@angular/forms';

import {Store, select} from '@ngrx/store';

import {BehaviorSubject, Observable, combineLatest} from 'rxjs';
import {distinctUntilChanged, map, startWith} from 'rxjs/operators';

import {
  AttributeLockExceptionGroup,
  AttributeLockGroupType,
  UserConstraintType,
  UserDataValue,
} from '@lumeer/data-filters';

import {AttributesResource} from '../../../../../../core/model/resource';
import {AppState} from '../../../../../../core/store/app.state';
import {selectConstraintData} from '../../../../../../core/store/constraint-data/constraint-data.state';
import {SelectItem2Model} from '../../../../../select/select-item2/select-item2.model';
import {deepArrayEquals} from '../../../../../utils/array.utils';

@Component({
  selector: 'attribute-lock-exception-group',
  templateUrl: './attribute-lock-exception-group.component.html',
  styleUrls: ['./attribute-lock-exception-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeLockExceptionGroupComponent implements OnInit {
  @Input()
  public locked: boolean;

  @Input()
  public group: UntypedFormGroup;

  @Input()
  public exceptionGroup: AttributeLockExceptionGroup;

  @Input()
  public resource: AttributesResource;

  @Output()
  public delete = new EventEmitter();

  public type = AttributeLockGroupType;
  public typeItems: SelectItem2Model[];

  public editing$ = new BehaviorSubject(false);

  public userDataValue$: Observable<UserDataValue>;

  constructor(private store$: Store<AppState>) {
    this.typeItems = [
      {
        id: AttributeLockGroupType.Everyone,
        value: $localize`:@@resource.attribute.lock.group.type.everyone:Everyone`,
        icons: ['fas fa-users'],
      },
      {
        id: AttributeLockGroupType.UsersAndTeams,
        value: $localize`:@@resource.attribute.lock.group.type.users:Users and Teams`,
        icons: ['fas fa-user-cog'],
      },
    ];
  }

  public ngOnInit() {
    const value$ = this.valueControl.valueChanges.pipe(
      startWith(''),
      map(() => this.valueControl.value),
      distinctUntilChanged((a, b) => deepArrayEquals(a, b))
    );
    this.userDataValue$ = combineLatest([this.store$.pipe(select(selectConstraintData)), value$]).pipe(
      map(
        ([constraintData, value]) =>
          new UserDataValue(
            value,
            {multi: true, externalUsers: false, type: UserConstraintType.UsersAndTeams},
            constraintData
          )
      )
    );
  }

  public get typeControl(): AbstractControl {
    return this.group.controls.type;
  }

  public get valueControl(): AbstractControl {
    return this.group.controls.typeValue;
  }

  public get filtersControl(): UntypedFormArray {
    return <UntypedFormArray>this.group.controls.filters;
  }

  public onSave(data: {dataValue: UserDataValue}) {
    this.valueControl.setValue(data.dataValue.serialize());
    this.editing$.next(false);
  }

  public onClick() {
    this.editing$.next(true);
  }

  public onCancel() {
    this.editing$.next(false);
  }

  public onTypePathSelected(path: SelectItem2Model[]) {
    this.typeControl.setValue(path[0].id);
  }
}
