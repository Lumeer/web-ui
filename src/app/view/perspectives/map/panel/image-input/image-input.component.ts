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
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
  OnInit,
  OnDestroy,
} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup} from '@angular/forms';
import {Subscription} from 'rxjs';
import {LanguageCode} from '../../../../../shared/top-panel/user-panel/user-menu/language';
import {ConfigurationService} from '../../../../../configuration/configuration.service';

@Component({
  selector: 'image-input',
  templateUrl: './image-input.component.html',
  styleUrls: ['./image-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageInputComponent implements OnChanges, OnInit, OnDestroy {
  @Input()
  public imageUrl: string;

  @Output()
  public valueChange = new EventEmitter<string>();

  public readonly formControlName = 'imageUrl';
  public readonly form: FormGroup;
  public helpLink: string;

  private subscriptions = new Subscription();

  constructor(private fb: FormBuilder, private configurationService: ConfigurationService) {
    this.form = this.fb.group({[this.formControlName]: null}, {updateOn: 'blur'});
  }

  public ngOnInit(): void {
    this.subscriptions.add(this.subscribeToValueChanges());
    this.helpLink =
      this.configurationService.getConfiguration().locale === LanguageCode.CZ
        ? 'https://www.lumeer.io/cs/mapa-cors'
        : 'https://www.lumeer.io/map-cors';
  }

  private subscribeToValueChanges(): Subscription {
    return this.imageUrlControl.valueChanges.subscribe(value => {
      const trimmed = value?.trim();
      if (trimmed !== this.imageUrl) {
        this.valueChange.emit(trimmed);
      }
    });
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.imageUrl) {
      this.imageUrlControl.setValue(this.imageUrl);
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public get imageUrlControl(): AbstractControl {
    return this.form.get(this.formControlName);
  }

  public resetInput() {
    this.imageUrlControl.setValue(this.imageUrl);
  }
}
