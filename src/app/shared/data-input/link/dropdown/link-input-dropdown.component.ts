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
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {AbstractControl, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, ValidatorFn} from '@angular/forms';

import {Observable} from 'rxjs';
import {distinctUntilChanged, map, startWith} from 'rxjs/operators';

import {parseLinkValue} from '@lumeer/data-filters';

import {DropdownPosition} from '../../../dropdown/dropdown-position';
import {DropdownComponent} from '../../../dropdown/dropdown.component';
import {KeyCode, keyboardEventCode} from '../../../key-code';
import {preventEvent} from '../../../utils/common.utils';
import {isUrlValid} from '../../../utils/url.utils';

@Component({
  selector: 'link-input-dropdown',
  templateUrl: './link-input-dropdown.component.html',
  styleUrls: ['./link-input-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkInputDropdownComponent implements OnInit, AfterViewInit {
  @Input()
  public titleValue: string;

  @Input()
  public linkValue: string;

  @Input()
  public origin: ElementRef | HTMLElement;

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public save = new EventEmitter<{link: string; title: string; enter?: boolean}>();

  @ViewChild(DropdownComponent)
  public dropdown: DropdownComponent;

  @ViewChild('linkElement')
  public linkInput: ElementRef<HTMLInputElement>;

  @ViewChild('titleElement')
  public titleInput: ElementRef<HTMLInputElement>;

  public readonly dropdownPositions = [
    DropdownPosition.BottomStart,
    DropdownPosition.BottomEnd,
    DropdownPosition.TopStart,
    DropdownPosition.TopEnd,
  ];

  public form: UntypedFormGroup;

  public invalid$: Observable<boolean>;

  constructor(private fb: UntypedFormBuilder) {
    this.form = this.fb.group(
      {
        link: '',
        title: '',
      },
      {validators: linkValidator}
    );
  }

  public get linkControl(): AbstractControl {
    return this.form.controls.link;
  }

  public get titleControl(): AbstractControl {
    return this.form.controls.title;
  }

  public ngOnInit() {
    this.invalid$ = this.form.statusChanges.pipe(
      startWith(''),
      map(() => this.form.invalid),
      distinctUntilChanged()
    );

    this.linkControl.setValue(this.linkValue);
    this.titleControl.setValue(this.titleValue);
  }

  public ngAfterViewInit() {
    this.dropdown.open();

    this.linkInput.nativeElement.focus();
    if (this.linkValue) {
      this.linkInput.nativeElement.setSelectionRange(this.linkValue.length, this.linkValue.length);
    }
  }

  public onSave(enter?: boolean): boolean {
    if (this.form.valid) {
      this.save.emit({
        link: (this.linkControl.value || '').trim(),
        title: (this.titleControl.value || '').trim(),
        enter,
      });
      return true;
    }
    return false;
  }

  public onCancel() {
    this.cancel.emit();
  }

  public close() {
    if (this.dropdown) {
      this.dropdown.close();
    }
  }

  public onLinkKeyDown(event: KeyboardEvent) {
    switch (keyboardEventCode(event)) {
      case KeyCode.Escape:
        this.close();
        this.onCancel();
        break;
      case KeyCode.Tab:
        !event.shiftKey && this.titleInput.nativeElement.focus();
        preventEvent(event);
        break;
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
        this.titleInput.nativeElement.focus();
        preventEvent(event);
        break;
      default:
        event.stopPropagation();
    }
  }

  public onTitleKeyDown(event: KeyboardEvent) {
    switch (keyboardEventCode(event)) {
      case KeyCode.Escape:
        this.close();
        this.onCancel();
        break;
      case KeyCode.Tab:
        event.shiftKey && this.linkInput.nativeElement.focus();
        preventEvent(event);
        break;
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
        if (!this.onSave(true)) {
          preventEvent(event);
        }
        break;
      default:
        event.stopPropagation();
    }
  }

  public onLinkBlur() {
    const {link, title} = parseLinkValue(this.linkControl.value);
    if (link && title) {
      this.linkControl.setValue(link);
      this.titleControl.setValue(title);
    }
  }
}

function linkValidator(): ValidatorFn {
  return (form: UntypedFormGroup): ValidationErrors | null => {
    const link = form.controls.link?.value || '';
    const title = form.controls.title?.value?.trim() || '';
    if (!link && !title) {
      return null;
    }

    if (!isUrlValid(form.value)) {
      return {urlInvalid: true};
    }

    return null;
  };
}
