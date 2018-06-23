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

declare let $: any;

@Component({
  selector: 'icon-picker',
  templateUrl: './icon-picker.component.html',
  styleUrls: ['./icon-picker.component.scss']
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

  private filter = '';

  public page = 0;

  public readonly ICONS_ON_PAGE = 6 * 8;

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
      this.filteredIcons = this.icons.filter(icon => icon.indexOf(this.filter) >= 0);
      this.page = 0;
    } else {
      this.filteredIcons = [...this.icons];
    }
  }

  public pageStart(): number {
    return this.ICONS_ON_PAGE * this.page + 1;
  }

  public pageEnd(): number {
    return Math.min(this.ICONS_ON_PAGE * (this.page + 1), this.filteredIcons.length);
  }

  public canActivatePage(page: number): boolean {
    return ((page < this.page) && (page >= 0)) ||
      ((page > this.page) && (page < Math.ceil(this.filteredIcons.length / this.ICONS_ON_PAGE)));
  }

  public selectPage(page: number): void {
    this.page = page;
  }

  public iconsCount(): number {
    return this.filteredIcons.length;
  }

  public activatePageWithSelectedIcon(): void {
    const selectedIndex = this.filteredIcons.indexOf(this.selected);
    this.page = selectedIndex >= 0 ? Math.floor(selectedIndex / this.ICONS_ON_PAGE) : 0;
  }

  public preview(previewed: string) {
    this.iconChange.emit(previewed ? previewed : this.selected);
  }

  public select(selected: string) {
    this.selected = selected;
    this.selectedChange.emit(selected);
    this.iconChange.emit(selected);
  }

  public iconId(icon: string): string {
    return this.dropdownId + '-icon-' + icon.replace(/ /g, '.');
  }

  public range(start: number, end: number): number[] {
    const result = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  }

  public ngAfterViewInit(): void {
    if (this.dropdownId) {
      $(`#${this.dropdownId}`).on('show.bs.dropdown', () => {
        // needed for initial display when the dialog was never opened
        // however, it does not work in subsequent opens
        this.selected = this.icon;
        this.activatePageWithSelectedIcon();
      });
      $(`#${this.dropdownId}`).on('hide.bs.dropdown', () => {
        // needed to handle subsequent opens
        this.selected = this.icon;
        this.activatePageWithSelectedIcon();

        if (this.filter) {
          this.filter = '';
          this.applyFilter();
        }
      });
    }
  }

  public filterInput($event: KeyboardEvent): void {
    this.filter = (<HTMLInputElement>$event.target).value;
    this.applyFilter();
  }
}
