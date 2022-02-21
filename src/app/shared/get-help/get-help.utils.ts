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

import {animate, sequence, state, style, transition, trigger} from '@angular/animations';

export const borderRadiusAnimation = trigger('borderRadius', [
  state(
    'open',
    style({
      borderRadius: '0.5rem',
    })
  ),
  state(
    'closed',
    style({
      borderRadius: '1rem',
    })
  ),
]);

export const shrinkOutAnimation = trigger('shrinkOut', [
  transition(
    ':enter',
    sequence([
      style({width: 0, height: 0, opacity: 0}),
      animate('0.3s ease', style({width: '*', height: '*'})),
      animate('0.2s ease', style({opacity: 1})),
    ])
  ),
  transition(
    ':leave',
    sequence([
      style({width: '*', height: '*', opacity: 0}),
      animate('0.3s ease', style({width: 0, height: 0, opacity: 0})),
    ])
  ),
]);
