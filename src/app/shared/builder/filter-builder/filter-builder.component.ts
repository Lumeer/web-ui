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

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter,
} from '@angular/core';
import {Attribute} from '../../../core/store/collections/collection';
import {DropdownPosition} from '../../dropdown/dropdown-position';
import {DropdownComponent} from '../../dropdown/dropdown.component';
import {ConstraintData} from '../../../core/model/data/constraint';
import {ConstraintDataService} from '../../../core/service/constraint-data.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'filter-builder',
  templateUrl: './filter-builder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBuilderComponent implements OnInit {
  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public attribute: Attribute;

  @Input()
  public value: any;

  @Input()
  public condition: string;

  @Output()
  public valueChange = new EventEmitter<{condition: string; value: any}>();

  @ViewChild(DropdownComponent, {static: false})
  public dropdown: DropdownComponent;

  public readonly dropdownPositions = [DropdownPosition.BottomStart];

  public constraintData$: Observable<ConstraintData>;

  constructor(private constraintDataService: ConstraintDataService) {}

  public ngOnInit() {
    this.constraintData$ = this.constraintDataService.observeConstraintData();
  }

  public open() {
    if (this.dropdown) {
      this.dropdown.open();
    }
  }

  public close() {
    if (this.dropdown) {
      this.dropdown.close();
    }
  }
}
