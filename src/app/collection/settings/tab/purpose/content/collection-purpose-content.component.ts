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

import {Component, ChangeDetectionStrategy, Input, SimpleChange, SimpleChanges, OnChanges} from '@angular/core';
import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
import {Workspace} from '../../../../../core/store/navigation/workspace';
import {Collection, CollectionPurposeType} from '../../../../../core/store/collections/collection';

@Component({
  selector: 'collection-purpose-content',
  templateUrl: './collection-purpose-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionPurposeContentComponent implements OnChanges {
  @Input()
  public collection: Collection;

  @Input()
  public workspace: Workspace;

  public form = new FormGroup({
    type: new FormControl(),
    metaData: new FormGroup({}),
  });

  public get typeControl(): AbstractControl {
    return this.form.get('type');
  }

  public get metaDataForm(): AbstractControl {
    return this.form.get('metaData');
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (this.purposeTypeChanges(changes.collection) && this.collection) {
      this.typeControl.setValue(this.collection.purpose?.type || CollectionPurposeType.None);
    }
  }

  private purposeTypeChanges(change: SimpleChange): boolean {
    return (
      change && (!change.previousValue || change.previousValue.purpose?.type !== change.currentValue?.purpose?.type)
    );
  }
}
