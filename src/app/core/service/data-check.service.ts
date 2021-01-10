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
import {selectAllCollections, selectCollectionsLoaded} from '../store/collections/collections.state';
import {filter, pairwise, skipUntil, startWith} from 'rxjs/operators';
import {Attribute} from '../store/collections/collection';
import {deepObjectsEquals, objectsByIdMap} from '../../shared/utils/common.utils';
import {DocumentsAction} from '../store/documents/documents.action';
import {selectAllLinkTypes, selectLinkTypesLoaded} from '../store/link-types/link-types.state';
import {AttributesResource} from '../model/resource';
import {LinkInstancesAction} from '../store/link-instances/link-instances.action';

@Injectable()
export class DataCheckService {
  constructor(private store$: Store<{}>) {}

  public init(): Promise<boolean> {
    this.checkCollectionAttributesChanged();
    this.checkLinkTypesAttributesChanged();
    return Promise.resolve(true);
  }

  private checkCollectionAttributesChanged() {
    this.store$
      .pipe(
        select(selectAllCollections),
        skipUntil(
          this.store$.pipe(
            select(selectCollectionsLoaded),
            filter(loaded => loaded)
          )
        ),
        startWith(null),
        pairwise(),
        filter(([previousCollections]) => !!previousCollections)
      )
      .subscribe(([previousCollections, collections]) => {
        const changedCollectionsMap = changedResourceAttributesMap(previousCollections, collections);
        if (Object.keys(changedCollectionsMap).length) {
          this.store$.dispatch(
            new DocumentsAction.TransformDataValues({collectionAttributesMap: changedCollectionsMap})
          );
        }
      });
  }

  private checkLinkTypesAttributesChanged() {
    this.store$
      .pipe(
        select(selectAllLinkTypes),
        skipUntil(
          this.store$.pipe(
            select(selectLinkTypesLoaded),
            filter(loaded => loaded)
          )
        ),
        startWith(null),
        pairwise(),
        filter(([previousLinkTypes]) => !!previousLinkTypes)
      )
      .subscribe(([previousLinkTypes, linkTypes]) => {
        const changedLinkTypesMap = changedResourceAttributesMap(previousLinkTypes, linkTypes);
        if (Object.keys(changedLinkTypesMap).length) {
          this.store$.dispatch(
            new LinkInstancesAction.TransformDataValues({linkTypeAttributesMap: changedLinkTypesMap})
          );
        }
      });
  }
}

function changedResourceAttributesMap(
  previousResources: AttributesResource[],
  resources: AttributesResource[]
): Record<string, string[]> {
  const previousResourcesMap = objectsByIdMap(previousResources);
  return resources.reduce((resourcesMap, resource) => {
    const changedAttributes = changedOrAddedAttributes(
      previousResourcesMap[resource.id]?.attributes,
      resource.attributes
    );
    if (changedAttributes.length) {
      resourcesMap[resource.id] = changedAttributes.map(attribute => attribute.id);
    }
    return resourcesMap;
  }, {});
}

function changedOrAddedAttributes(previousAttributes: Attribute[], currentAttributes: Attribute[]): Attribute[] {
  const previousAttributesMap = objectsByIdMap(previousAttributes);
  return (currentAttributes || []).reduce((attributes, attribute) => {
    const previousAttribute = previousAttributesMap[attribute.id];
    if (
      !previousAttribute ||
      previousAttribute.constraint?.type !== attribute.constraint?.type ||
      !deepObjectsEquals(previousAttribute.constraint?.config, attribute.constraint?.config)
    ) {
      attributes.push(attribute);
    }
    return attributes;
  }, []);
}
