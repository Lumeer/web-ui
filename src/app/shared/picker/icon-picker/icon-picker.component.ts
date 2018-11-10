/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {AfterViewInit, Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';

import * as Icons from './icons';
import {getPureIconName, searchIconsByMeta} from './icons';
import {IconIdPipe} from './icon-id.pipe';

declare let $: any;

@Component({
  selector: 'icon-picker',
  templateUrl: './icon-picker.component.html',
  styleUrls: ['./icon-picker.component.scss'],
})
export class IconPickerComponent implements OnInit, AfterViewInit {
  @Input()
  public icon: string;

  @Input()
  public dropdownId: string;

  @Output()
  private iconChange = new EventEmitter<string>();

  @Output()
  public selectedChange = new EventEmitter<string>();

  public selected: string;

  public icons = Icons.solid.concat(Icons.brand);

  public filteredIcons: string[];

  public filter = '';

  constructor(private iconIdPipe: IconIdPipe) {}

  @HostListener('click', ['$event'])
  public onClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  public ngOnInit(): void {
    this.selected = this.icon;
    this.applyFilter();
  }

  private applyFilter(): void {
    if (this.filter) {
      const iconsByMeta = searchIconsByMeta(this.filter);
      this.filteredIcons = this.icons.filter(icon => iconsByMeta.indexOf(getPureIconName(icon)) >= 0);
    } else {
      this.filteredIcons = [...this.icons];
    }
  }

  public preview(previewed: string) {
    this.iconChange.emit(previewed ? previewed : this.selected);
  }

  public select(selected: string) {
    this.selected = selected;
    this.selectedChange.emit(selected);
    this.iconChange.emit(selected);
  }

  public range(start: number, end: number): number[] {
    const result = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  }

  private scrollToSelection(): void {
    const elem = (document as any).getElementById(this.iconIdPipe.transform(this.selected, this.dropdownId));

    if (elem) {
      elem.parentElement.parentElement.scrollTop = elem.offsetTop - elem.parentElement.offsetTop;
    }
  }

  public ngAfterViewInit(): void {
    if (this.dropdownId) {
      $(`#${this.dropdownId}`).on('show.bs.dropdown', () => {
        // needed for initial display when the dialog was never opened
        // however, it does not work in subsequent opens
        this.selected = this.icon;
      });
      $(`#${this.dropdownId}`).on('shown.bs.dropdown', () => {
        this.scrollToSelection();
      });
      $(`#${this.dropdownId}`).on('hide.bs.dropdown', () => {
        // needed to handle subsequent opens
        this.selected = this.icon;

        if (this.filter) {
          this.filter = '';
          this.applyFilter();
        }
      });
    }
  }

  public filterInput(keyboardEvent: KeyboardEvent): void {
    if (keyboardEvent) {
      this.filter = (<HTMLInputElement>keyboardEvent.target).value;
    }
    this.applyFilter();
  }
}
