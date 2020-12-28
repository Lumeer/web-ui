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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {KeyCode} from '../../../../../shared/key-code';
import {KanbanStemConfig} from '../../../../../core/store/kanbans/kanban';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'project-template-tags',
  templateUrl: './project-template-tags.component.html',
  styleUrls: ['./project-template-tags.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTemplateTagsComponent implements OnInit {
  @Input()
  public formGroup: FormGroup;

  @Output()
  public focus = new EventEmitter();

  @Output()
  public blur = new EventEmitter();

  public text = '';

  public tags$: Observable<string[]>;

  public get tagsControl(): FormArray {
    return <FormArray>this.formGroup.controls.tags;
  }

  public get tags(): string[] {
    return this.tagsControl.value;
  }

  public ngOnInit() {
    this.tags$ = this.tagsControl.valueChanges.pipe(
      startWith(this.tagsControl.value),
      map(() => this.tagsControl.value)
    );
  }

  public onInput(event: Event) {
    this.text = event.target['value'];
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
        this.submitTag();
        break;
      case KeyCode.Backspace:
        this.removeLastTag();
        break;
    }
  }

  private submitTag() {
    const tag = (this.text || '').trim();
    if (tag && !this.tags.includes(tag)) {
      this.tagsControl.push(new FormControl(tag));
      this.text = '';
    }
  }

  private removeLastTag() {
    if (!this.text && this.tags.length > 0) {
      this.removeTag(this.tags.length - 1);
    }
  }

  public removeTag(index: number) {
    this.tagsControl.removeAt(index);
  }
}
