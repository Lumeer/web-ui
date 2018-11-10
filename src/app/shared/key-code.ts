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

export enum KeyCode {
  ArrowDown = 'ArrowDown',
  ArrowLeft = 'ArrowLeft',
  ArrowRight = 'ArrowRight',
  ArrowUp = 'ArrowUp',
  Backspace = 'Backspace',
  Delete = 'Delete',
  Enter = 'Enter',
  Escape = 'Escape',
  F1 = 'F1',
  F2 = 'F2',
  F3 = 'F3',
  F4 = 'F4',
  F5 = 'F5',
  F6 = 'F6',
  F7 = 'F7',
  F8 = 'F8',
  F9 = 'F9',
  F10 = 'F10',
  F11 = 'F11',
  F12 = 'F12',
  KeyA = 'KeyA',
  KeyB = 'KeyB',
  KeyC = 'KeyC',
  KeyD = 'KeyD',
  KeyE = 'KeyE',
  KeyF = 'KeyF',
  KeyG = 'KeyG',
  KeyH = 'KeyH',
  KeyI = 'KeyI',
  KeyJ = 'KeyJ',
  KeyK = 'KeyK',
  KeyL = 'KeyL',
  KeyM = 'KeyM',
  KeyN = 'KeyN',
  KeyO = 'KeyO',
  KeyP = 'KeyP',
  KeyQ = 'KeyQ',
  KeyR = 'KeyR',
  KeyS = 'KeyS',
  KeyT = 'KeyT',
  KeyU = 'KeyU',
  KeyV = 'KeyV',
  KeyW = 'KeyW',
  KeyX = 'KeyX',
  KeyY = 'KeyY',
  KeyZ = 'KeyZ',
  NumpadEnter = 'NumpadEnter',
  Space = 'Space',
  Tab = 'Tab',
}

export function isKeyPrintable(event: KeyboardEvent): boolean {
  return event.key.length === 1;
}
