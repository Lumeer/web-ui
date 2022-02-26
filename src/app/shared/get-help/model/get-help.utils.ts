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

import {animate, group, state, style, transition, trigger} from '@angular/animations';

export enum ButtonState {
  Open = 'open',
  Closed = 'closed',
  Compact = 'compact',
  Entered = 'entered',
}

export const rotateAnimation = trigger('rotate', [
  state(
    ButtonState.Open,
    style({
      transform: 'rotate(180deg)',
    })
  ),
  state(
    ButtonState.Closed,
    style({
      transform: 'rotate(0deg)',
    })
  ),
  state(
    ButtonState.Entered,
    style({
      transform: 'rotate(0deg)',
    })
  ),
  transition(`${ButtonState.Open} <=> ${ButtonState.Closed}`, [animate('0.3s')]),
  transition(`${ButtonState.Open} <=> ${ButtonState.Entered}`, [animate('0.3s')]),
]);

export const scaleAnimation = trigger('scale', [
  state(
    ButtonState.Open,
    style({
      fontSize: '100%',
    })
  ),
  state(
    ButtonState.Entered,
    style({
      fontSize: '130%',
    })
  ),
  state(
    ButtonState.Compact,
    style({
      fontSize: '130%',
    })
  ),
  transition(`${ButtonState.Open} <=> ${ButtonState.Closed}`, [animate('0.3s')]),
  transition(`${ButtonState.Open} <=> ${ButtonState.Entered}`, [animate('0.3s')]),
]);

export const shrinkOutAnimation = trigger('shrinkOut', [
  transition(':enter', [
    style({width: 0, height: 0, opacity: 0}),
    group([animate('0.3s ease', style({width: '*', height: '*'})), animate('0.2s 0.1s ease', style({opacity: 1}))]),
  ]),
  transition(':leave', [
    style({width: '*', height: '*', opacity: 1}),
    group([animate('0.3s 0.1s ease', style({width: 0, height: 0})), animate('0.2s ease', style({opacity: 0}))]),
  ]),
]);
