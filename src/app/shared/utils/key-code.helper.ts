/*
 * Lumeer, Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
 *
 * This program is free software, you can redistribute it and/or modify
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
 * along with this program.  If not, see <http,//www.gnu.org/licenses/>.
 */

import {KeyCode} from '../key-code';

const notPrintableKeys: number[] = [
  KeyCode.LeftArrow,
  KeyCode.UpArrow,
  KeyCode.RightArrow,
  KeyCode.DownArrow,
  KeyCode.Escape,
  KeyCode.Enter,
  KeyCode.Backspace,
  KeyCode.Delete,
  KeyCode.Alt,
  KeyCode.Ctrl,
  KeyCode.Shift,
  KeyCode.Tab,
  KeyCode.CapsLock,
  KeyCode.NumLock,
  KeyCode.F1,
  KeyCode.F2,
  KeyCode.F3,
  KeyCode.F4,
  KeyCode.F5,
  KeyCode.F6,
  KeyCode.F7,
  KeyCode.F8,
  KeyCode.F9,
  KeyCode.F10,
  KeyCode.F11,
  KeyCode.F12,
  KeyCode.Insert,
  KeyCode.ScrollLock,
  KeyCode.Home,
  KeyCode.End,
  KeyCode.PageUp,
  KeyCode.PageDown,
  KeyCode.PageBackward,
  KeyCode.PageForward,
  KeyCode.PauseBreak,
  KeyCode.SelectKey
];

export function isKeyPrintable(keyCode: number): boolean {
  return !notPrintableKeys.includes(keyCode);
}
