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

import {UserConstraintConfig} from '../data/constraint-config';
import {UserDataValue} from './user.data-value';
import {ConstraintData} from '../data/constraint';
import {UserConstraintConditionValue} from '../data/constraint-condition';
import {ConditionType} from '../attribute-filter';

describe('UserDataValue', () => {
  const config: UserConstraintConfig = {
    multi: true,
    externalUsers: true,
  };

  const constraintData: ConstraintData = {
    users: [
      {email: 'one@lmr.com', name: 'One Lmr', groupsMap: {}},
      {email: 'two@lmr.com', name: 'Two Lmr', groupsMap: {}},
      {email: 'three@lmr.com', name: 'Three Lmr', groupsMap: {}},
      {email: 'four@lmr.com', name: 'Four Lmr', groupsMap: {}},
    ],
    currentUser: {email: 'two@lmr.com', name: 'Two Lmr', groupsMap: {}},
  };

  describe('meet condition', () => {
    it('in', () => {
      expect(
        new UserDataValue(['one@lmr.com', 'two@lmr.com'], config, constraintData).meetCondition(ConditionType.HasSome, [
          {value: 'one@lmr.com'},
        ])
      ).toBeTruthy();
      expect(
        new UserDataValue(
          ['one@lmr.com', 'two@lmr.com', 'three@lmr.com'],
          config,
          constraintData
        ).meetCondition(ConditionType.HasSome, [{value: ['two@lmr.com', 'three@lmr.com']}])
      ).toBeTruthy();
      expect(
        new UserDataValue(
          ['one@lmr.com', 'two@lmr.com', 'three@lmr.com'],
          config,
          constraintData
        ).meetCondition(ConditionType.HasSome, [{value: ['four@lmr.com']}])
      ).toBeFalsy();
      expect(
        new UserDataValue(['one@lmr.com', 'other@lmr.com'], config, constraintData).meetCondition(
          ConditionType.HasSome,
          [{value: ['lala@lmr.com', 'other@lmr.com']}]
        )
      ).toBeTruthy();
      expect(
        new UserDataValue(['one@lmr.com', 'two@lmr.com'], config, constraintData).meetCondition(ConditionType.HasSome, [
          {type: UserConstraintConditionValue.CurrentUser},
        ])
      ).toBeTruthy();
    });

    it('not in', () => {
      expect(
        new UserDataValue(['one@lmr.com', 'two@lmr.com'], config, constraintData).meetCondition(
          ConditionType.HasNoneOf,
          [{value: 'other@lmr.com'}]
        )
      ).toBeTruthy();
      expect(
        new UserDataValue(['one@lmr.com', 'two@lmr.com'], config, constraintData).meetCondition(
          ConditionType.HasNoneOf,
          [{value: 'one@lmr.com'}]
        )
      ).toBeFalsy();
      expect(
        new UserDataValue(
          ['one@lmr.com', 'two@lmr.com', 'three@lmr.com'],
          config,
          constraintData
        ).meetCondition(ConditionType.HasNoneOf, [{value: ['other@lmr.com', 'four@lmr.com', 'l@lmr.com']}])
      ).toBeTruthy();
      expect(
        new UserDataValue(
          ['one@lmr.com', 'two@lmr.com', 'three@lmr.com'],
          config,
          constraintData
        ).meetCondition(ConditionType.HasNoneOf, [{type: UserConstraintConditionValue.CurrentUser}])
      ).toBeFalsy();
    });

    it('is empty', () => {
      expect(new UserDataValue('0', config, constraintData).meetCondition(ConditionType.IsEmpty, [])).toBeFalsy();
      expect(new UserDataValue('  ', config, constraintData).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();
      expect(new UserDataValue(null, config, constraintData).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();
      expect(
        new UserDataValue('some@lmr.com', config, constraintData).meetCondition(ConditionType.IsEmpty, [])
      ).toBeFalsy();
    });

    it('is not empty', () => {
      expect(new UserDataValue(' 0', config, constraintData).meetCondition(ConditionType.NotEmpty, [])).toBeTruthy();
      expect(new UserDataValue(null, config, constraintData).meetCondition(ConditionType.NotEmpty, [])).toBeFalsy();
      expect(new UserDataValue('  ', config, constraintData).meetCondition(ConditionType.NotEmpty, [])).toBeFalsy();
    });
  });

  describe('meet fultexts', () => {
    it('single', () => {
      expect(
        new UserDataValue(['one@lmr.com', 'two@lmr.com', 'three@lmr.com'], config, constraintData).meetFullTexts([
          'Lmr',
          'One',
          'Two',
          'Three',
        ])
      ).toBeTruthy();
      expect(
        new UserDataValue(['other@lmr.com', 'else@lmr.com', 'three@lmr.com'], config, constraintData).meetFullTexts([
          'other@lmr',
          'else@',
          'Three',
        ])
      ).toBeTruthy();
      expect(
        new UserDataValue(['one@lmr.com', 'two@lmr.com', 'three@lmr.com'], config, constraintData).meetFullTexts([
          'Lmr.com',
        ])
      ).toBeFalsy();
    });
  });
});
