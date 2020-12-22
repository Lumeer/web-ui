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

import {Injectable} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import numbro from 'numbro';
import NumbroLanguage = numbro.NumbroLanguage;
import {environment} from '../../../environments/environment';
import {LanguageTag} from '../model/data/language-tag';
import {objectValues} from '../../shared/utils/common.utils';

export interface Currency {
  symbol: string;
  code: string;
  placement: CurrencyPlacement;
  spaceSeparated: boolean;
  decimalSeparator: string;
  thousandSeparator: string;
}

export enum CurrencyPlacement {
  prefix = 'prefix',
  suffix = 'suffix',
}

export const currencies: Record<string, Currency> = {
  [LanguageTag.Denmark]: {
    symbol: 'kr',
    code: 'DKK',
    placement: CurrencyPlacement.suffix,
    spaceSeparated: true,
    decimalSeparator: ',',
    thousandSeparator: '.',
  },
  [LanguageTag.Switzerland]: {
    symbol: 'CHF',
    code: 'CHF',
    placement: CurrencyPlacement.suffix,
    spaceSeparated: true,
    decimalSeparator: ',',
    thousandSeparator: '’',
  },
  [LanguageTag.NewZealand]: {
    symbol: '$',
    code: 'NZD',
    placement: CurrencyPlacement.prefix,
    spaceSeparated: true,
    decimalSeparator: '.',
    thousandSeparator: ',',
  },
  [LanguageTag.FrenchCanada]: {
    symbol: '$',
    code: 'CAD',
    placement: CurrencyPlacement.suffix,
    spaceSeparated: true,
    decimalSeparator: '.',
    thousandSeparator: '\u00a0',
  },
  [LanguageTag.Canada]: {
    symbol: '$',
    code: 'CAD',
    placement: CurrencyPlacement.prefix,
    spaceSeparated: false,
    decimalSeparator: '.',
    thousandSeparator: ',',
  },
  [LanguageTag.Sweden]: {
    symbol: 'kr',
    code: 'SEK',
    placement: CurrencyPlacement.suffix,
    spaceSeparated: true,
    decimalSeparator: ',',
    thousandSeparator: '\u00a0',
  },
  [LanguageTag.Norway]: {
    symbol: 'kr',
    code: 'NOK',
    placement: CurrencyPlacement.suffix,
    spaceSeparated: true,
    decimalSeparator: ',',
    thousandSeparator: '\u00a0',
  },
  [LanguageTag.Finland]: {
    symbol: '€',
    code: 'EUR',
    placement: CurrencyPlacement.suffix,
    spaceSeparated: true,
    decimalSeparator: ',',
    thousandSeparator: '\u00a0',
  },
  [LanguageTag.Israel]: {
    symbol: '₪',
    code: 'ILS',
    placement: CurrencyPlacement.prefix,
    spaceSeparated: true,
    decimalSeparator: '.',
    thousandSeparator: ',',
  },
  [LanguageTag.Spain]: {
    symbol: '€',
    code: 'EUR',
    placement: CurrencyPlacement.suffix,
    spaceSeparated: true,
    decimalSeparator: ',',
    thousandSeparator: '.',
  },
  [LanguageTag.France]: {
    symbol: '€',
    code: 'EUR',
    placement: CurrencyPlacement.suffix,
    spaceSeparated: true,
    decimalSeparator: ',',
    thousandSeparator: '\u00a0',
  },
  [LanguageTag.Italy]: {
    symbol: '€',
    code: 'EUR',
    placement: CurrencyPlacement.suffix,
    spaceSeparated: true,
    decimalSeparator: ',',
    thousandSeparator: '.',
  },
  [LanguageTag.England]: {
    symbol: '£',
    code: 'GBP',
    placement: CurrencyPlacement.prefix,
    spaceSeparated: true,
    decimalSeparator: '.',
    thousandSeparator: ',',
  },
  [LanguageTag.Portugal]: {
    symbol: '€',
    code: 'EUR',
    placement: CurrencyPlacement.suffix,
    spaceSeparated: true,
    decimalSeparator: ',',
    thousandSeparator: '\u00a0',
  },
  [LanguageTag.Poland]: {
    symbol: 'zł',
    code: 'PLN',
    placement: CurrencyPlacement.suffix,
    spaceSeparated: true,
    decimalSeparator: ',',
    thousandSeparator: '\u00a0',
  },
  [LanguageTag.Czech]: {
    symbol: 'Kč',
    code: 'CZK',
    placement: CurrencyPlacement.suffix,
    spaceSeparated: true,
    decimalSeparator: ',',
    thousandSeparator: '\u00a0',
  },
  [LanguageTag.Slovak]: {
    symbol: '€',
    code: 'EUR',
    placement: CurrencyPlacement.suffix,
    spaceSeparated: true,
    decimalSeparator: ',',
    thousandSeparator: '\u00a0',
  },
  [LanguageTag.Hungary]: {
    symbol: 'Ft',
    code: 'HUF',
    placement: CurrencyPlacement.suffix,
    spaceSeparated: true,
    decimalSeparator: ',',
    thousandSeparator: '\u00a0',
  },
  [LanguageTag.Austria]: {
    symbol: '€',
    code: 'EUR',
    placement: CurrencyPlacement.prefix,
    spaceSeparated: true,
    decimalSeparator: ',',
    thousandSeparator: '\u00a0',
  },
  [LanguageTag.Germany]: {
    symbol: '€',
    code: 'EUR',
    placement: CurrencyPlacement.suffix,
    spaceSeparated: true,
    decimalSeparator: ',',
    thousandSeparator: '.',
  },
  [LanguageTag.USA]: {
    symbol: '$',
    code: 'USD',
    placement: CurrencyPlacement.prefix,
    spaceSeparated: false,
    decimalSeparator: '.',
    thousandSeparator: ',',
  },
  [LanguageTag.Brazil]: {
    symbol: 'R$',
    code: 'BRL',
    placement: CurrencyPlacement.prefix,
    spaceSeparated: false,
    decimalSeparator: ',',
    thousandSeparator: '.',
  },
  [LanguageTag.Taiwan]: {
    symbol: 'NT$',
    code: 'TWD',
    placement: CurrencyPlacement.prefix,
    spaceSeparated: false,
    decimalSeparator: '.',
    thousandSeparator: ',',
  },
  [LanguageTag.Netherlands]: {
    symbol: '€',
    code: 'EUR',
    placement: CurrencyPlacement.prefix,
    spaceSeparated: true,
    decimalSeparator: ',',
    thousandSeparator: '.',
  },
  [LanguageTag.China]: {
    symbol: '¥',
    code: 'CNY',
    placement: CurrencyPlacement.prefix,
    spaceSeparated: false,
    decimalSeparator: '.',
    thousandSeparator: ',',
  },
  [LanguageTag.Russia]: {
    symbol: '₽',
    code: 'RUB',
    placement: CurrencyPlacement.suffix,
    spaceSeparated: false,
    decimalSeparator: ',',
    thousandSeparator: '\u00a0',
  },
  [LanguageTag.Japan]: {
    symbol: '¥',
    code: 'JPY',
    placement: CurrencyPlacement.prefix,
    spaceSeparated: true,
    decimalSeparator: '.',
    thousandSeparator: ',',
  },
  [LanguageTag.Australia]: {
    symbol: '$',
    code: 'AUD',
    placement: CurrencyPlacement.prefix,
    spaceSeparated: true,
    decimalSeparator: '.',
    thousandSeparator: ',',
  },
  [LanguageTag.Ireland]: {
    symbol: '€',
    code: 'EUR',
    placement: CurrencyPlacement.prefix,
    spaceSeparated: false,
    decimalSeparator: '.',
    thousandSeparator: ',',
  },
  [LanguageTag.Malta]: {
    symbol: '€',
    code: 'EUR',
    placement: CurrencyPlacement.prefix,
    spaceSeparated: false,
    decimalSeparator: '.',
    thousandSeparator: ',',
  },
  [LanguageTag.Turkey]: {
    symbol: '\u20BA',
    code: 'TRY',
    placement: CurrencyPlacement.suffix,
    spaceSeparated: true,
    decimalSeparator: ',',
    thousandSeparator: '.',
  },
  [LanguageTag.Ukraine]: {
    symbol: '\u20B4',
    code: 'UAH',
    placement: CurrencyPlacement.suffix,
    spaceSeparated: false,
    decimalSeparator: ',',
    thousandSeparator: '\u00a0',
  },
  [LanguageTag.India]: {
    symbol: '₹',
    code: 'INR',
    placement: CurrencyPlacement.prefix,
    spaceSeparated: false,
    decimalSeparator: '.',
    thousandSeparator: ',',
  },
};

@Injectable()
export class CurrencyFormatService {
  private readonly abbreviations: string[];
  private readonly ordinals: string[];

  public constructor(private i18n: I18n) {
    this.abbreviations = i18n({id: 'currency.abbreviations', value: 'k|m|b|t'}).split('|');
    this.ordinals = i18n({id: 'currency.ordinals', value: 'st|nd|rd|th'}).split('|');
  }

  public init(): Promise<boolean> {
    objectValues(LanguageTag).forEach(lang => numbro.registerLanguage(this.getNumbroLanguage(lang), false));
    return Promise.resolve(true);
  }

  public ordinal(num: number): string {
    const b = num % 10;
    return ~~((num % 100) / 10) === 1
      ? this.ordinals[3] || ''
      : b === 1
      ? this.ordinals[0] || ''
      : b === 2
      ? this.ordinals[1] || ''
      : b === 3
      ? this.ordinals[2] || ''
      : this.ordinals[3] || '';
  }

  public getNumbroLanguage(language: LanguageTag): NumbroLanguage {
    return {
      languageTag: language,
      delimiters: {
        thousands: currencies[language].thousandSeparator,
        decimal: currencies[language].decimalSeparator,
      },
      abbreviations: {
        thousand: this.abbreviations[0] || '',
        million: this.abbreviations[1] || '',
        billion: this.abbreviations[2] || '',
        trillion: this.abbreviations[3] || '',
      },
      ordinal: this.ordinal.bind(this),
      currency: {
        symbol: currencies[language].symbol,
        code: currencies[language].code,
        position: currencies[language].placement === CurrencyPlacement.prefix ? 'prefix' : 'postfix',
      },
      currencyFormat: {
        totalLength: 4,
        spaceSeparated: environment.locale === 'cs',
        spaceSeparatedCurrency: currencies[language].spaceSeparated,
      },
      formats: {
        fourDigits: {
          totalLength: 4,
          spaceSeparated: environment.locale === 'cs',
        },
        fullWithTwoDecimals: {
          output: 'currency',
          mantissa: 2,
          spaceSeparated: environment.locale === 'cs',
        },
        fullWithNoDecimals: {
          output: 'currency',
          spaceSeparated: environment.locale === 'cs',
          mantissa: 0,
        },
        fullWithTwoDecimalsNoCurrency: {
          mantissa: 2,
        },
      },
    };
  }
}
