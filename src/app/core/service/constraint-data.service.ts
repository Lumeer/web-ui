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
import {select, Store} from '@ngrx/store';
import {ConstraintData, ConstraintType, CurrencyData} from '@lumeer/data-filters';
import {TranslationService} from './translation.service';
import {ConstraintDataAction} from '../store/constraint-data/constraint-data.action';
import {Attribute} from '../store/collections/collection';
import {Observable} from 'rxjs';
import {selectConstraintData} from '../store/constraint-data/constraint-data.state';
import {map, switchMap} from 'rxjs/operators';
import {selectDocumentsByCollectionId} from '../store/documents/documents.state';
import {selectLinkInstancesByType} from '../store/link-instances/link-instances.state';
import {DataResource} from '../model/resource';
import {AppState} from '../store/app.state';
import {ConfigurationService} from '../../configuration/configuration.service';
import {localeLanguageTags} from '../model/language-tag';

@Injectable()
export class ConstraintDataService {
  constructor(
    private store$: Store<AppState>,
    private translationService: TranslationService,
    private configurationService: ConfigurationService
  ) {}

  public init(): Promise<boolean> {
    const durationUnitsMap = this.translationService.createDurationUnitsMap();
    const abbreviations = this.translationService.createCurrencyAbbreviations();
    const ordinals = this.translationService.createCurrencyOrdinals();
    const locale = localeLanguageTags[this.configurationService.getConfiguration().locale];
    const currencyData: CurrencyData = {abbreviations, ordinals};
    this.store$.dispatch(new ConstraintDataAction.Init({data: {durationUnitsMap, currencyData, locale}}));
    return Promise.resolve(true);
  }

  public selectWithInvalidValues$(
    attribute: Attribute,
    collectionId: string,
    linkTypeId: string
  ): Observable<ConstraintData> {
    const constraintData$ = this.store$.pipe(select(selectConstraintData));
    if (attribute?.constraint) {
      if (collectionId) {
        return constraintData$.pipe(
          switchMap(constraintData =>
            this.store$.pipe(
              select(selectDocumentsByCollectionId(collectionId)),
              map(documents => mapDataResourcesInvalidValues(constraintData, attribute, documents))
            )
          )
        );
      } else if (linkTypeId) {
        return constraintData$.pipe(
          switchMap(constraintData =>
            this.store$.pipe(
              select(selectLinkInstancesByType(linkTypeId)),
              map(linkInstances => mapDataResourcesInvalidValues(constraintData, attribute, linkInstances))
            )
          )
        );
      }
    }
    return constraintData$;
  }
}

function mapDataResourcesInvalidValues(
  constraintData: ConstraintData,
  attribute: Attribute,
  dataResources: DataResource[]
): ConstraintData {
  const invalidValues = attribute.constraint?.filterInvalidValues(dataResources, attribute.id, constraintData);
  const invalidValuesMap = {[attribute.constraint.type]: invalidValues} as Record<ConstraintType, Set<any>>;
  return {...constraintData, invalidValuesMap};
}
