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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {animate, style, transition, trigger} from '@angular/animations';
import {BehaviorSubject} from 'rxjs';

@Component({
  selector: 'resizable-sidebar',
  templateUrl: './resizable-sidebar.component.html',
  styleUrls: ['./resizable-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger(
      'enterAnimation', [
        transition(':enter', [
          style({transform: 'translateX(100%)', width: 0}),
          animate('300ms ease-in-out', style({transform: 'translateX(0)', width: '*'}))
        ]),
        transition(':leave', [
          style({transform: 'translateX(0)', width: '*'}),
          animate('300ms ease-in-out', style({transform: 'translateX(100%)', width: '0'}))
        ])
      ]
    )
  ],
})
export class ResizableSidebarComponent {
  @Input()
  public opened: boolean;

  @Input()
  public width: number;

  @Output()
  public widthChanged = new EventEmitter<number>();

  public resizeOverlay$ = new BehaviorSubject(false);
}
