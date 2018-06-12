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

  @HostListener('click', ['$event'])
  public onClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  public tabs: { icon: string, selected: boolean}[] = [];

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

  public tab = 0;

  public TABS = 18;

  public ngOnInit(): void {
    this.selected = this.icon;
    this.generateTabs();
    this.updateTab();
  }

  public preview(previewed: string) {
    this.iconChange.emit(previewed ? previewed : this.selected);
  }

  private updateTab() {
    let newTab = Math.floor(this.icons.indexOf(this.selected) / this.iconsPerTab());

    if (newTab !== this.tab) {
      this.selectTab(newTab);
    }
  }

  private generateTabs() {
    let icons = [];
    this.range(0, this.TABS).forEach(i => icons.push({ icon: this.tabIcon(i), selected: i === this.tab }));
    this.tabs = icons;
  }

  public select(selected: string) {
    this.selected = selected;
    this.selectedChange.emit(selected);
    this.iconChange.emit(selected);
  }

  public iconHighlight(icon: string): string {
    if (icon === this.selected) {
      return 'selected';
    }

    if (icon === this.icon) {
      return 'active';
    }

    return '';
  }

  public range(start: number, end: number): number[] {
    const result = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  }

  public tabIcon(tabIndex: number): string {
    const iconsPerTab = this.iconsPerTab(); //this.icons.length / this.TABS;
    const start = Math.floor(tabIndex * iconsPerTab);
    return this.icons[start];
  }

  public iconsInTab(tabIndex: number): string[] {
    const iconsPerTab = this.iconsPerTab(); //this.icons.length / this.TABS;
    const start = Math.floor(tabIndex * iconsPerTab);
    return this.icons.slice(start, start + iconsPerTab);
  }

  private iconsPerTab() {
    return Math.ceil(this.icons.length / this.TABS / 9) * 9;
  }

  public ngAfterViewInit(): void {
    if (this.dropdownId) {
      $(`#${this.dropdownId}`).on('hide.bs.dropdown', () => {
        this.updateTab();
      });
    }
  }

  public selectTab(i: number): void {
    if (i !== this.tab) {
      this.tabs[this.tab].selected = false;
      this.tabs[i].selected = true;
      this.tab = i;
    }
  }
}
