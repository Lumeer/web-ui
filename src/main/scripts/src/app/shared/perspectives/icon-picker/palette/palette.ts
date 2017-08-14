/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';

export abstract class Palette implements OnInit, OnDestroy {

  @Output()
  private change = new EventEmitter<string>();

  @Input()
  public active: string;

  @Output()
  private selection = new EventEmitter<string>();

  public selected: string;

  public ngOnInit(): void {
    if (!this.active) {
      throw new Error('Palette requires active attribute (the output of picking objects from palette).');
    }

    this.selected = this.active;
  }

  public preview(newActive: string): void {
    this.active = newActive;
    newActive ? this.change.emit(newActive) : this.change.emit(this.selected);
  }

  public select(newSelected: string): void {
    this.selected = newSelected;
    this.change.emit(newSelected);
    this.selection.emit(newSelected);
  }

  public ngOnDestroy(): void {
    this.change.emit(this.selected);
  }

}
