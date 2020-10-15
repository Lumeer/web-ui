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

import {LanguageCode} from '../../../shared/top-panel/user-panel/user-menu/language';
import {environment} from '../../../../environments/environment';

export enum LanguageTag {
  Denmark = 'da-DK',
  Switzerland = 'de-CH',
  NewZealand = 'en-NZ',
  FrenchCanada = 'fr-CA',
  Canada = 'en-CA',
  Sweden = 'sv-SE',
  Norway = 'nb-NO',
  Finland = 'fi-FI',
  Israel = 'he-IL',
  Spain = 'es-ES',
  France = 'fr-FR',
  Italy = 'it-IT',
  England = 'en-GB',
  Portugal = 'pt-PT',
  Poland = 'pl-PL',
  Czech = 'cs-CZ',
  Slovak = 'sk-SK',
  Hungary = 'hu-HU',
  Austria = 'de-AT',
  Germany = 'de-DE',
  USA = 'en-US',
  Brazil = 'pt-BR',
  Taiwan = 'zh-TW',
  Netherlands = 'nl-NL',
  China = 'zh-CN',
  Russia = 'ru-RU',
  Japan = 'ja-JP',
  Australia = 'en-AU',
  Ireland = 'en-IE',
  Malta = 'en-MT',
  Turkey = 'tr-TR',
  Ukraine = 'uk-UA',
  India = 'en-IN',
}

export const localeLanguageTags: Record<string, LanguageTag> = {
  [LanguageCode.EN]: LanguageTag.USA,
  [LanguageCode.CZ]: LanguageTag.Czech,
};

export function currentLocaleLanguageTag(): LanguageTag {
  return localeLanguageTags[environment.locale];
}
