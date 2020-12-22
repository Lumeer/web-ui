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

import {TextDataValue} from './text.data-value';
import {CaseStyle, TextConstraintConfig} from '../data/constraint-config';
import {ConditionType, ConditionValue} from '../attribute-filter';

describe('TextDataValue', () => {
  const config: TextConstraintConfig = {minLength: 2, maxLength: 4, caseStyle: CaseStyle.SentenceCase};

  describe('meet condition', () => {
    it('equals', () => {
      const compareDataValue: ConditionValue = {value: 'hello'};
      const dataValue1 = new TextDataValue('<p><b>hello</b></p>', config);
      expect(dataValue1.meetCondition(ConditionType.Equals, [compareDataValue])).toBeTruthy();

      const dataValue2 = new TextDataValue('<p>HeLLo</br></p>', config);
      expect(dataValue2.meetCondition(ConditionType.Equals, [compareDataValue])).toBeTruthy();

      const dataValue3 = new TextDataValue('<p>helllo</p>', config);
      expect(dataValue3.meetCondition(ConditionType.Equals, [compareDataValue])).toBeFalsy();

      const dataValue4 = new TextDataValue(null, config);
      expect(dataValue4.meetCondition(ConditionType.Equals, [{value: undefined}])).toBeTruthy();
    });

    it('not equals', () => {
      const compareDataValue: ConditionValue = {value: 'hello'};
      const dataValue1 = new TextDataValue('<p>hello</p>', config);
      expect(dataValue1.meetCondition(ConditionType.NotEquals, [compareDataValue])).toBeFalsy();

      const dataValue2 = new TextDataValue('<ul><li>HeLLo</li></ul>', config);
      expect(dataValue2.meetCondition(ConditionType.NotEquals, [compareDataValue])).toBeFalsy();

      const dataValue3 = new TextDataValue('<i>helllo</i></br>', config);
      expect(dataValue3.meetCondition(ConditionType.NotEquals, [compareDataValue])).toBeTruthy();
    });

    it('contains', () => {
      const compareDataValue: ConditionValue = {value: 'lumeer'};
      const dataValue1 = new TextDataValue('<p>klumEEr</p></br>', config);
      expect(dataValue1.meetCondition(ConditionType.Contains, [compareDataValue])).toBeTruthy();

      const dataValue2 = new TextDataValue('<h3>lumere</h3>', config);
      expect(dataValue2.meetCondition(ConditionType.Contains, [compareDataValue])).toBeFalsy();

      const dataValue3 = new TextDataValue('<h3>one <b>two</b> three <i>LUMEER</i> is the best</h3>', config);
      expect(dataValue3.meetCondition(ConditionType.Contains, [compareDataValue])).toBeTruthy();

      const dataValue4 = new TextDataValue('<p>hey <b>lume</b>er <b>super</b> <u>easy</u>', config);
      expect(dataValue4.meetCondition(ConditionType.Contains, [compareDataValue])).toBeTruthy();
    });

    it('starts with', () => {
      const compareDataValue: ConditionValue = {value: '<p><i>slo</i></p>'};
      const dataValue1 = new TextDataValue('SLOVAKIA', config);
      expect(dataValue1.meetCondition(ConditionType.StartsWith, [compareDataValue])).toBeTruthy();

      const dataValue2 = new TextDataValue('<h3>saslova</h3>', config);
      expect(dataValue2.meetCondition(ConditionType.StartsWith, [compareDataValue])).toBeFalsy();

      const dataValue3 = new TextDataValue('<p></p><p>  slot</p>', config);
      expect(dataValue3.meetCondition(ConditionType.StartsWith, [compareDataValue])).toBeTruthy();
    });

    it('ends with', () => {
      const compareDataValue: ConditionValue = {value: 'lala</br>'};
      const dataValue1 = new TextDataValue('<i>klala   </i>', config);
      expect(dataValue1.meetCondition(ConditionType.EndsWith, [compareDataValue])).toBeTruthy();

      const dataValue2 = new TextDataValue('<pre>lalaka</pre>', config);
      expect(dataValue2.meetCondition(ConditionType.EndsWith, [compareDataValue])).toBeFalsy();
    });

    it('is empty', () => {
      const dataValue1 = new TextDataValue('<p>     </p></br>', config);
      expect(dataValue1.meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();

      const dataValue2 = new TextDataValue('<h3>  l  </h3>', config);
      expect(dataValue2.meetCondition(ConditionType.IsEmpty, [])).toBeFalsy();
    });

    it('is not empty', () => {
      const dataValue1 = new TextDataValue('<ul><li></li></ul>     </br>', config);
      expect(dataValue1.meetCondition(ConditionType.NotEmpty, [])).toBeFalsy();

      const dataValue2 = new TextDataValue('<h4>  l  </h4></br>', config);
      expect(dataValue2.meetCondition(ConditionType.NotEmpty, [])).toBeTruthy();
    });
  });

  describe('meet fultexts', () => {
    it('single', () => {
      expect(new TextDataValue('<p>something</p></br>', config).meetFullTexts(['THIN'])).toBeTruthy();
      expect(new TextDataValue('<ul><li>hinks</li></ul></br>', config).meetFullTexts(['THIN'])).toBeFalsy();
    });

    it('multiple', () => {
      expect(
        new TextDataValue('<p>hey <i>somethi</i>ng <b>to</b> <u>type</u></p>', config).meetFullTexts([
          'hey',
          'thing',
          'pe',
          'to',
        ])
      ).toBeTruthy();
      expect(
        new TextDataValue('<p>some other words</p></br>', config).meetFullTexts(['the', 'wor', 'meo'])
      ).toBeFalsy();
    });
  });
});
