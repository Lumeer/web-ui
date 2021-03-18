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

export interface Language {
  code: LanguageCode;
  name: string;
  translatedName: string;
  icon: string;
}

export enum LanguageCode {
  CZ = 'cs',
  EN = 'en',
  HU = 'hu',
}

export const availableLanguages: Language[] = [
  {
    code: LanguageCode.CZ,
    name: 'Čeština',
    translatedName: $localize`:@@language.czech:Czech`,
    icon: 'flag-icon flag-icon-cz',
  },
  {
    code: LanguageCode.EN,
    name: 'English',
    translatedName: $localize`:@@language.english:English`,
    icon: 'flag-icon flag-icon-gb',
  },
  {
    code: LanguageCode.HU,
    name: 'Magyar',
    translatedName: $localize`:@@language.hungary:Hungarian`,
    icon: 'flag-icon flag-icon-hu',
  },
];
