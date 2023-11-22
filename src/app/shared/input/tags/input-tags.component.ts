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
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {UntypedFormArray, UntypedFormControl, UntypedFormGroup} from '@angular/forms';

import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';

import {DropdownOption} from '../../dropdown/options/dropdown-option';
import {OptionsDropdownComponent} from '../../dropdown/options/options-dropdown.component';
import {KeyCode} from '../../key-code';

@Component({
  selector: 'input-tags',
  templateUrl: './input-tags.component.html',
  styleUrls: ['./input-tags.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-block'},
})
export class InputTagsComponent implements OnInit, OnChanges {
  @Input()
  public formGroup: UntypedFormGroup;

  @Input()
  public controlName: string;

  @Input()
  public suggestions: string[];

  @Input()
  public removeTagTitle: string;

  @Input()
  public placeholderTitle: string;

  @Output()
  public focus = new EventEmitter();

  @Output()
  public blur = new EventEmitter();

  @ViewChild(OptionsDropdownComponent)
  public dropdown: OptionsDropdownComponent;

  public readonly removeTagTitleDefault: string;
  public readonly placeholderTitleDefault: string;

  public text = '';
  public suggestionOptions: DropdownOption[];

  public tags$: Observable<string[]>;

  constructor() {
    this.removeTagTitle = $localize`:@@tag.remove:Remove tag`;
    this.placeholderTitleDefault = $localize`:@@projects.tab.template.metadata.tags.placeholder:Type tag name and press Enter`;
  }

  public get tagsControl(): UntypedFormArray {
    return <UntypedFormArray>this.formGroup.get(this.controlName);
  }

  public get tags(): string[] {
    return this.tagsControl?.value;
  }

  public ngOnInit() {
    this.tags$ = this.tagsControl?.valueChanges.pipe(
      startWith(this.tagsControl?.value),
      map(() => this.tagsControl?.value)
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.suggestions) {
      this.suggestionOptions = (this.suggestions || []).map(suggestion => ({
        value: suggestion,
        displayValue: suggestion,
      }));
    }
  }

  public onInput(event: Event) {
    this.text = event.target['value'];
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
        this.submitTag(event);
        return;
      case KeyCode.Tab:
        event.preventDefault();
        this.submitTag(event);
        return;
      case KeyCode.Backspace:
        this.removeLastTag();
        return;
    }
    this.dropdown?.onKeyDown(event);
  }

  private submitTag(event?: KeyboardEvent) {
    const activeOption = this.dropdown?.getActiveOption();
    if (activeOption) {
      this.onSelectOption(activeOption);
      return;
    }
    const hasText = !!this.text;
    const tag = (this.text || '').trim();
    if (tag && !this.tags.includes(tag)) {
      this.tagsControl?.push(new UntypedFormControl(tag));
      this.text = '';
    }
    if (!hasText) {
      (<HTMLInputElement>event?.target)?.blur();
    }
  }

  private removeLastTag() {
    if (!this.text && this.tags.length > 0) {
      this.removeTag(this.tags.length - 1);
    }
  }

  public removeTag(index: number) {
    this.tagsControl?.removeAt(index);
  }

  public onSelectOption(option: DropdownOption) {
    this.tagsControl?.push(new UntypedFormControl(option.value));
    this.text = '';
    this.updateDropdown();
  }

  private updateDropdown() {
    setTimeout(() => {
      if (this.dropdown?.isOpen()) {
        this.dropdown?.updatePosition();
      } else {
        this.dropdown?.open();
      }
    });
  }

  public onFocus() {
    this.dropdown?.open();
    this.focus.emit();
  }

  public onBlur() {
    this.submitTag();
    this.dropdown?.close();
    this.blur.emit();
  }
}
