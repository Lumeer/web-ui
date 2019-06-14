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

import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {Portal, TemplatePortal} from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
import * as moment from 'moment';
import {BsDatepickerInlineConfig, BsLocaleService} from 'ngx-bootstrap/datepicker';
import {Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';
import {KeyCode} from '../../key-code';
import {DateTimeOptions, detectDatePickerViewMode} from '../date-time-options';

@Component({
  selector: 'date-time-picker',
  templateUrl: './date-time-picker.component.html',
  styleUrls: ['./date-time-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateTimePickerComponent implements OnChanges, OnInit, AfterViewInit, OnDestroy {
  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public min: Date;

  @Input()
  public max: Date;

  @Input()
  public options: DateTimeOptions;

  @Input()
  public value: Date;

  @Output()
  public valueChange = new EventEmitter<Date>();

  @Output()
  public save = new EventEmitter<Date>();

  @Output()
  public cancel = new EventEmitter();

  @ViewChild('dateTimePicker', {static: true})
  public dateTimePicker: TemplateRef<any>;

  public form = new FormGroup({
    date: new FormControl(),
  });

  public datePickerConfig: Partial<BsDatepickerInlineConfig>;

  public timeZone = `UTC${moment().format('Z')}, ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;

  private overlayRef: OverlayRef;
  private portal: Portal<any>;

  private subscriptions = new Subscription();

  constructor(localeService: BsLocaleService, private overlay: Overlay, private viewContainer: ViewContainerRef) {
    localeService.use(environment.locale);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.value && this.value) {
      this.dateControl.setValue(this.value);
    }
    if (changes.options && this.options) {
      this.datePickerConfig = {
        containerClass: 'box-shadow-none theme-default',
        minMode: detectDatePickerViewMode(this.options),
      };
    }
  }

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToDateChange());
  }

  private subscribeToDateChange(): Subscription {
    return this.dateControl.valueChanges
      .pipe(filter(value => value !== this.value))
      .subscribe(value => this.valueChange.emit(value));
  }

  public ngAfterViewInit() {
    this.portal = new TemplatePortal(this.dateTimePicker, this.viewContainer);
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.close();
  }

  public onClick(event: MouseEvent) {
    // otherwise it is immediately closed in table
    event.stopPropagation();
  }

  public open() {
    if (this.overlayRef) {
      return;
    }

    this.overlayRef = this.overlay.create({
      disposeOnNavigation: true,
      panelClass: ['position-absolute', 'w-max-content'],
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.origin)
        .withFlexibleDimensions(false)
        .withViewportMargin(8)
        .withLockedPosition()
        .withPositions([
          {
            originX: 'start',
            originY: 'bottom',
            overlayX: 'start',
            overlayY: 'top',
          },
          {
            originX: 'start',
            originY: 'top',
            overlayX: 'start',
            overlayY: 'bottom',
          },
          {
            originX: 'end',
            originY: 'bottom',
            overlayX: 'end',
            overlayY: 'top',
          },
          {
            originX: 'end',
            originY: 'top',
            overlayX: 'end',
            overlayY: 'bottom',
          },
          {
            originX: 'end',
            originY: 'center',
            overlayX: 'start',
            overlayY: 'center',
          },
          {
            originX: 'start',
            originY: 'center',
            overlayX: 'end',
            overlayY: 'center',
          },
        ]),
    });
    this.overlayRef.attach(this.portal);
  }

  public close() {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }

  public onTimePickerKeyDown(event: KeyboardEvent) {
    if (([KeyCode.Backspace, KeyCode.Delete] as string[]).includes(event.code)) {
      event.stopPropagation();
    }
  }

  public onDateChange(date: Date) {
    this.dateControl.setValue(date);
  }

  public onCancelClick() {
    this.close();
    this.cancel.emit();
  }

  public onSaveClick() {
    this.close();
    this.save.emit(this.dateControl.value);
  }

  public get dateControl(): AbstractControl {
    return this.form.get('date');
  }
}
