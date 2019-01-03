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

import {animate, keyframes, state, style, transition, trigger} from '@angular/animations';

export const animateOpacityFromUp = trigger('animateOpacityFromUp', [
  state('in', style({transform: 'translateY(0)', opacity: 1})),
  transition('void => *', [
    animate(
      300,
      keyframes([
        style({transform: 'translateY(-50px)', opacity: 0, offset: 0}),
        style({transform: 'translateY(0)', opacity: 1, offset: 1}),
      ])
    ),
  ]),
  transition('* => void', [
    animate(
      300,
      keyframes([
        style({transform: 'translateY(0)', opacity: 1, offset: 0}),
        style({transform: 'translateY(-50px)', opacity: 0, offset: 1}),
      ])
    ),
  ]),
]);

export const animateVisible = trigger('animateVisible', [
  state('in', style({opacity: 1})),
  transition('void => *', [animate(500, keyframes([style({opacity: 0}), style({opacity: 1})]))]),
  transition('* => void', [animate(500, keyframes([style({opacity: 1}), style({opacity: 0})]))]),
]);
