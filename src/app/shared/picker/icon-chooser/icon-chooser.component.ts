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

declare let $: any;

const DEFAULT_SIZE = 'fa-6x';

@Component({
  selector: 'icon-chooser',
  templateUrl: './icon-chooser.component.html',
  styleUrls: ['./icon-chooser.component.scss']
})
export class IconComponent implements OnInit, AfterViewInit {

  @Input()
  public color: string;

  @Input()
  public icon: string;

  @Input()
  public readonly: boolean;

  @Input()
  public size: string = DEFAULT_SIZE;

  @Input()
  public url: string; // TODO use for redirecting on click if readonly

  @Output()
  public colorChange = new EventEmitter<string>();

  @Output()
  public iconChange = new EventEmitter<string>();

  public oldColor: string;
  public oldIcon: string;

  public clickedComponent: any;

  public dropdownId: string;

  public constructor() {
    this.dropdownId = 'dropdown-' + IconComponent.generateId();
  }

  @HostListener('document:click', ['$event'])
  public documentClicked($event): void {
    if (this.clickedComponent && $event.target !== this.clickedComponent) {
      this.icon = this.oldIcon || this.icon;
      this.color = this.oldColor || this.color;
      $event.stopPropagation();
    }
  }

  private static generateId() {
    return Math.floor((1 + Math.random()) * 1000000000000).toString(16);
  }

  public ngOnInit() {
  }

  public ngAfterViewInit(): void {
    $(`#${this.dropdownId}`).on('hide.bs.dropdown', () => this.detectChanges());
  }

  public detectChanges(): void {
    if (this.color !== this.oldIcon) {
      this.colorChange.emit(this.color);
    }
    if (this.icon !== this.oldIcon) {
      this.iconChange.emit(this.icon);
    }
  }

  public saveSelectedColor($event: MouseEvent): void {
    this.detectChanges();
  }

  public revertSelectedColor($event: MouseEvent): void {
    this.color = this.oldColor;
    this.icon = this.oldIcon;
  }

  public storeIconAndColor($event: MouseEvent): void {
    this.clickedComponent = $event.target;
    this.oldColor = this.color;
    this.oldIcon = this.icon;
  }

}
