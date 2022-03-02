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

export const animateOpacityEnterLeave = trigger('enterOpacityAnimation', [
  transition(':enter', [style({opacity: 0}), animate('200ms ease-in-out', style({opacity: 1}))]),
  transition(':leave', [style({opacity: 1}), animate('200ms ease-in-out', style({opacity: 0}))]),
]);

export const animateVisible = trigger('animateVisible', [
  state('in', style({opacity: 1})),
  transition('void => *', [animate(500, keyframes([style({opacity: 0}), style({opacity: 1})]))]),
  transition('* => void', [animate(500, keyframes([style({opacity: 1}), style({opacity: 0})]))]),
]);

export const emptyEnterAnimation = trigger('enterEmpty', [transition(':enter', [])]);

export const enterLeftAnimation = trigger('enterLeftAnimation', [
  transition(':enter', [
    style({left: '100%', right: '-100%', opacity: 0.4}),
    animate('300ms ease-in-out', style({left: '0%', right: '0%', opacity: 1})),
  ]),
  transition(':leave', [
    style({left: '0%', right: '0%', opacity: 1}),
    animate('300ms ease-in-out', style({left: '100%', right: '-100%', opacity: 0.4})),
  ]),
]);

export const enterRightAnimation = trigger('enterRightAnimation', [
  transition(':enter', [
    style({left: '-100%', right: '100%', opacity: 0.4}),
    animate('300ms ease-in-out', style({left: '0%', right: '0%', opacity: 1})),
  ]),
  transition(':leave', [
    style({left: '0%', right: '0%', opacity: 1}),
    animate('300ms ease-in-out', style({left: '-100%', right: '100%', opacity: 0.4})),
  ]),
]);
