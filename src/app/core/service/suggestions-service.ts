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

import {Store, select} from '@ngrx/store';

import {Observable, combineLatest, of} from 'rxjs';
import {map} from 'rxjs/operators';

import {initialConditionType, initialConditionValues} from '@lumeer/data-filters';
import {arrayIntersection, removeAccentFromString, uniqueValues} from '@lumeer/utils';

import {AttributeQueryItem} from '../../shared/top-panel/search-box/query-item/model/attribute.query-item';
import {CollectionQueryItem} from '../../shared/top-panel/search-box/query-item/model/collection.query-item';
import {FulltextQueryItem} from '../../shared/top-panel/search-box/query-item/model/fulltext.query-item';
import {LinkAttributeQueryItem} from '../../shared/top-panel/search-box/query-item/model/link-attribute.query-item';
import {LinkQueryItem} from '../../shared/top-panel/search-box/query-item/model/link.query-item';
import {QueryItem} from '../../shared/top-panel/search-box/query-item/model/query-item';
import {QueryItemType} from '../../shared/top-panel/search-box/query-item/model/query-item-type';
import {ViewQueryItem} from '../../shared/top-panel/search-box/query-item/model/view.query-item';
import {convertQueryItemsToQueryModel} from '../../shared/top-panel/search-box/query-item/query-items.converter';
import {createRange, flattenMatrix} from '../../shared/utils/array.utils';
import {objectValues} from '../../shared/utils/common.utils';
import {getOtherLinkedCollectionId} from '../../shared/utils/link-type.utils';
import {generateId, sortResourcesLastUsed} from '../../shared/utils/resource.utils';
import {AppState} from '../store/app.state';
import {Attribute, Collection} from '../store/collections/collection';
import {selectAllCollections, selectCollectionsDictionary} from '../store/collections/collections.state';
import {
  selectAllCollectionsWithoutHiddenAttributes,
  selectAllLinkTypesWithoutHiddenAttributes,
  selectCollectionsByIdsWithoutHiddenAttributes,
  selectLinkTypesByIdsWithoutHiddenAttributes,
} from '../store/common/permissions.selectors';
import {selectAllLinkTypes} from '../store/link-types/link-types.state';
import {LinkType} from '../store/link-types/link.type';
import {collectionIdsChainForStem, getBaseCollectionIdsFromQuery} from '../store/navigation/query/query.util';
import {View} from '../store/views/view';
import {selectAllViews} from '../store/views/views.state';

const lastUsedThreshold = 5;
const mostUsedThreshold = 5;
const maxSuggestions = 15;

enum SuggestionScore {
  StartWith = 5,
  ContainsWord = 10,
  FullMatch = 20,
  Favorite = 8,
  LastUsed = 4,
  MostUsed = 2,
  Contains = 0,
  Restricted = Number.MIN_SAFE_INTEGER,
}

enum ViewSuggestionScore {
  EmptyQueryAndText = 100, // defines order when query and also text is empty (same below in other score enums)
}

enum CollectionSuggestionScore {
  EmptyQueryAndText = 70,
  AdditionalPoints = SuggestionScore.MostUsed + 1, // in order to prefer collection against attribute
}

enum LinkTypeSuggestionScore {
  EmptyQueryAndText = 45,
  IsDirectlyLinkable = 20, // can link to Collection or other LinkType
  IsLinkable = 10,
  IsLinkableDuplicated = 5, // can link but already is in current Stem
}

enum AttributeSuggestionScore {
  EmptyQueryAndText = 10,
  IsInCurrentStem = 20, // its Collection is in current Stem
  IsUsedInCurrentStem = 17, // is already used in current Stem
}

enum LinkAttributeSuggestionScore {
  EmptyQueryAndText = 0,
  IsInCurrentStem = 15, // its LinkType is in current Stem
  IsUsedInCurrentStem = 12, // is already used in current Stem
}

enum SuggestionType {
  View,
  Collection,
  LinkType,
  Attribute,
  LinkAttribute,
  FullText,
}

interface ObjectSuggestion {
  score: number;
  suggestionType: SuggestionType;
}

interface CollectionSuggestion extends ObjectSuggestion {
  collection: Collection;
  suggestionType: SuggestionType.Collection;
}

interface ViewSuggestion extends ObjectSuggestion {
  view: View;
  collection: Collection;
  suggestionType: SuggestionType.View;
}

interface LinkTypeSuggestion extends ObjectSuggestion {
  linkType: LinkType;
  suggestionType: SuggestionType.LinkType;
}

interface AttributeSuggestion extends ObjectSuggestion {
  collection: Collection;
  attribute: Attribute;
  suggestionType: SuggestionType.Attribute;
}

interface LinkAttributeSuggestion extends ObjectSuggestion {
  linkType: LinkType;
  attribute: Attribute;
  suggestionType: SuggestionType.LinkAttribute;
}

interface FullTextSuggestion extends ObjectSuggestion {
  text: string;
  suggestionType: SuggestionType.FullText;
}

@Injectable({
  providedIn: 'root',
})
export class SuggestionsService {
  constructor(private store$: Store<AppState>) {}

  public suggest(
    text: string,
    queryItems: QueryItem[],
    suggestByItems: boolean,
    restrictedTypes: QueryItemType[]
  ): Observable<QueryItem[]> {
    const textWithoutAccent = removeAccentFromString(text);
    return this.selectObjectsSorted(text, queryItems, suggestByItems, restrictedTypes).pipe(
      map(suggestions => this.addScoreByCurrentItems(suggestions, textWithoutAccent, queryItems || [])),
      map(suggestions => this.filterAndSortSuggestions(suggestions)),
      map(suggestions => this.sliceTopSuggestions(suggestions, textWithoutAccent, queryItems)),
      map(suggestions => suggestions.map(suggestion => suggestionToQueryItem(suggestion)))
    );
  }

  private selectObjectsSorted(
    text: string,
    queryItems: QueryItem[],
    suggestByItems: boolean,
    restrictedTypes: QueryItemType[]
  ): Observable<ObjectSuggestion[]> {
    const textWithoutAccent = removeAccentFromString(text);
    return combineLatest([
      !restrictedTypes?.includes(QueryItemType.View)
        ? this.selectViewsSuggestions$(textWithoutAccent, suggestByItems)
        : of([]),
      !restrictedTypes?.includes(QueryItemType.Collection)
        ? this.selectCollectionsSuggestions$(textWithoutAccent, suggestByItems)
        : of([]),
      !restrictedTypes?.includes(QueryItemType.Attribute)
        ? this.selectAttributesSuggestions$(textWithoutAccent, queryItems, suggestByItems)
        : of([]),
      !restrictedTypes?.includes(QueryItemType.Link)
        ? this.selectLinkTypesSuggestions$(textWithoutAccent, queryItems, suggestByItems)
        : of([]),
      !restrictedTypes?.includes(QueryItemType.LinkAttribute)
        ? this.selectLinkAttributesSuggestions$(textWithoutAccent, queryItems, suggestByItems)
        : of([]),
      !restrictedTypes?.includes(QueryItemType.Fulltext) ? this.selectFullTextsSuggestions(text) : of([]),
    ]).pipe(map(suggestions => flattenMatrix<ObjectSuggestion>(suggestions)));
  }

  private addScoreByCurrentItems(
    suggestions: ObjectSuggestion[],
    text: string,
    queryItems: QueryItem[]
  ): ObjectSuggestion[] {
    const stemsQueryItems = filterStemsQueryItems(queryItems);
    const lastStemItems = filterLastQueryStemItems(queryItems);
    const collectionIdsChain = getCollectionIdsChainForStemItems(lastStemItems);
    const linkTypeIdsChain = getLinkTypeIdsChainForStemItems(lastStemItems);
    const lastItem = lastStemItems[lastStemItems.length - 1];

    suggestions.forEach(suggestion => {
      switch (suggestion.suggestionType) {
        case SuggestionType.View:
          addViewScoreByCurrentItems(<ViewSuggestion>suggestion, text, stemsQueryItems);
          break;
        case SuggestionType.Collection:
          addCollectionScoreByCurrentItems(<CollectionSuggestion>suggestion, text, stemsQueryItems);
          break;
        case SuggestionType.LinkType:
          addLinkTypeScoreByCurrentItems(
            <LinkTypeSuggestion>suggestion,
            text,
            stemsQueryItems,
            lastItem,
            collectionIdsChain,
            linkTypeIdsChain
          );
          break;
        case SuggestionType.Attribute:
          addAttributeScoreByCurrentItems(<AttributeSuggestion>suggestion, text, lastStemItems, collectionIdsChain);
          break;
        case SuggestionType.LinkAttribute:
          addLinkAttributeScoreByCurrentItems(
            <LinkAttributeSuggestion>suggestion,
            text,
            lastStemItems,
            linkTypeIdsChain
          );
          break;
        case SuggestionType.FullText:
          addFullTextScoreByCurrentItems(<FullTextSuggestion>suggestion, queryItems);
          break;
      }
    });

    return suggestions;
  }

  private filterAndSortSuggestions(suggestions: ObjectSuggestion[]): ObjectSuggestion[] {
    return suggestions
      .filter(sug => sug.score >= 0)
      .sort((a, b) => {
        const result = b.score - a.score;
        if (result === 0) {
          return (suggestionText(a) || '').length - (suggestionText(b) || '').length;
        }
        return result;
      });
  }

  private sliceTopSuggestions(
    suggestions: ObjectSuggestion[],
    text: string,
    currentItems: QueryItem[]
  ): ObjectSuggestion[] {
    const maxCountMap = createMaxSuggestionTypesMap(text, currentItems);
    const maxCountMapKeys = Object.keys(maxCountMap);
    const slicedSuggestions: ObjectSuggestion[] = [];

    let indexes = createRange(0, suggestions.length);
    while (slicedSuggestions.length < maxSuggestions && indexes.length > 0) {
      const skippedIndexes = [];

      for (const index of indexes) {
        if (slicedSuggestions.length >= maxSuggestions) {
          break;
        }

        if (maxCountMap[suggestions[index].suggestionType] <= 0) {
          skippedIndexes.push(index);
          continue;
        }
        maxCountMap[suggestions[index].suggestionType]--;
        slicedSuggestions.push(suggestions[index]);
      }

      // settle for next round
      for (let i = 0; i < maxSuggestions - slicedSuggestions.length; i++) {
        const startIndex = i % maxCountMapKeys.length;
        const distributeIndexes = createRange(0, maxCountMapKeys.length).map(
          index => (index + startIndex) % maxCountMapKeys.length
        );
        for (const distributeIndex of distributeIndexes) {
          const suggestionType = maxCountMapKeys[distributeIndex];
          const containsSuggestionWithType = skippedIndexes.some(
            skippedIndex => suggestions[skippedIndex].suggestionType.toString() === suggestionType
          );

          if (containsSuggestionWithType) {
            maxCountMap[suggestionType]++;
            break;
          }
        }
      }

      indexes = skippedIndexes;
    }

    if (!slicedSuggestions.some(suggestion => suggestion.suggestionType === SuggestionType.FullText)) {
      const fulltextSuggestion = suggestions
        .reverse()
        .find(suggestion => suggestion.suggestionType === SuggestionType.FullText);
      if (fulltextSuggestion) {
        slicedSuggestions.push(fulltextSuggestion);
      }
    }

    return this.filterAndSortSuggestions(slicedSuggestions);
  }

  private selectViewsSuggestions$(text: string, suggestByItems: boolean): Observable<ViewSuggestion[]> {
    if (suggestByItems) {
      return of([]);
    }
    return combineLatest([
      this.store$.pipe(select(selectCollectionsDictionary)),
      this.store$.pipe(select(selectAllViews)),
    ]).pipe(
      map(([collectionsMap, views]) => {
        const sortedByLastUsed = sortResourcesLastUsed<View>(views).slice(0, lastUsedThreshold);
        return views.map(view => {
          let score = 0;
          const name = removeAccentFromString(view.name);
          if (text) {
            score += getScoreByMatch(name, text);
          }
          score += viewAdditionalScore(view, sortedByLastUsed);

          const collectionIds = getBaseCollectionIdsFromQuery(view.query);
          const collection = collectionIds.length > 0 ? collectionsMap[collectionIds[0]] : null;
          return {view, collection, suggestionType: SuggestionType.View, score};
        });
      })
    );
  }

  private selectCollectionsSuggestions$(text: string, suggestByItems: boolean): Observable<CollectionSuggestion[]> {
    if (suggestByItems) {
      return of([]);
    }
    return this.store$.pipe(
      select(selectAllCollections),
      map(collections => {
        const sortedByLastUsed = sortResourcesLastUsed<Collection>(collections).slice(0, lastUsedThreshold);
        return collections.map(collection => {
          let score = CollectionSuggestionScore.AdditionalPoints;
          const name = removeAccentFromString(collection.name);
          if (text) {
            score += getScoreByMatch(name, text);
          }
          score += collectionAdditionalScore(collection, sortedByLastUsed);

          return {collection, suggestionType: SuggestionType.Collection, score};
        });
      })
    );
  }

  private selectAttributesSuggestions$(
    text: string,
    queryItems: QueryItem[],
    suggestByItems: boolean
  ): Observable<AttributeSuggestion[]> {
    const collectionIds = (queryItems || [])
      .filter(queryItem => queryItem.type === QueryItemType.Collection)
      .map(queryItem => (<CollectionQueryItem>queryItem).collection?.id);
    const collectionsObservable$ = suggestByItems
      ? this.store$.pipe(select(selectCollectionsByIdsWithoutHiddenAttributes(uniqueValues(collectionIds))))
      : this.store$.pipe(select(selectAllCollectionsWithoutHiddenAttributes));
    return collectionsObservable$.pipe(
      map(collections => {
        const sortedCollections = sortResourcesLastUsed<Collection>(collections).slice(0, lastUsedThreshold);
        const attributesOrder = createAttributesOrder(collections).slice(0, mostUsedThreshold);

        return collections.reduce((suggestions, collection) => {
          const attributes = collection.attributes;

          const collectionSuggestions = attributes.map(attribute => {
            let score = 0;
            const name = removeAccentFromString(attribute.name);
            if (text) {
              score += getScoreByMatch(name, text);
            }
            score += collectionAdditionalScore(collection, sortedCollections);

            const attributeOrder = attributesOrder.findIndex(
              order => order.id === attributeOrderId(collection, attribute)
            );
            score += attributeOrder < mostUsedThreshold ? SuggestionScore.MostUsed : 0;

            return {attribute, collection, suggestionType: SuggestionType.Attribute, score};
          });
          suggestions.push(...collectionSuggestions);
          return suggestions;
        }, []);
      })
    );
  }

  private selectLinkTypesSuggestions$(
    text: string,
    queryItems: QueryItem[],
    suggestByItems: boolean
  ): Observable<LinkTypeSuggestion[]> {
    const linkTypesObservable$ = suggestByItems
      ? this.selectLinkTypesByLastCollectionId$(queryItems)
      : this.store$.pipe(select(selectAllLinkTypes));
    return combineLatest([this.store$.pipe(select(selectCollectionsDictionary)), linkTypesObservable$]).pipe(
      map(([collectionsMap, linkTypes]) => {
        const linkTypesWithCollections = linkTypes.map(linkType => mapLinkType(linkType, collectionsMap));
        const sortedCollections = sortResourcesLastUsed(objectValues(collectionsMap)).slice(0, lastUsedThreshold);

        return linkTypesWithCollections.map(linkType => {
          let score = 0;
          const name = removeAccentFromString(linkType.name);
          if (text) {
            score += getScoreByMatch(name, text);
          }

          if (linkType.collections?.length === 2) {
            score += collectionAdditionalScore(linkType.collections[0], sortedCollections, 2);
            score += collectionAdditionalScore(linkType.collections[1], sortedCollections, 2);
          }

          return {linkType, suggestionType: SuggestionType.LinkType, score};
        });
      })
    );
  }

  private selectLinkTypesByLastCollectionId$(queryItems: QueryItem[]): Observable<LinkType[]> {
    const query = convertQueryItemsToQueryModel(queryItems);
    return this.store$.pipe(
      select(selectAllLinkTypes),
      map(linkTypes => {
        const lastCollectionIds = (query.stems || []).reduce((ids, stem) => {
          const collectionIdsChain = collectionIdsChainForStem(stem, linkTypes);
          const lastCollectionId = collectionIdsChain[collectionIdsChain.length - 1];
          if (lastCollectionId && !ids.includes(lastCollectionId)) {
            ids.push(lastCollectionId);
          }
          return ids;
        }, []);
        return linkTypes.filter(linkType => arrayIntersection(linkType.collectionIds, lastCollectionIds).length > 0);
      })
    );
  }

  private selectLinkAttributesSuggestions$(
    text: string,
    queryItems: QueryItem[],
    suggestByItems: boolean
  ): Observable<LinkAttributeSuggestion[]> {
    const linkTypeIds = (queryItems || [])
      .filter(queryItem => queryItem.type === QueryItemType.Link)
      .map(queryItem => (<LinkQueryItem>queryItem).linkType?.id);
    const linkTypesObservable$ = suggestByItems
      ? this.store$.pipe(select(selectLinkTypesByIdsWithoutHiddenAttributes(uniqueValues(linkTypeIds))))
      : this.store$.pipe(select(selectAllLinkTypesWithoutHiddenAttributes));
    return combineLatest([this.store$.pipe(select(selectCollectionsDictionary)), linkTypesObservable$]).pipe(
      map(([collectionsMap, linkTypes]) => {
        const linkTypesWithCollections = linkTypes.map(linkType => mapLinkType(linkType, collectionsMap));
        const sortedCollections = sortResourcesLastUsed(objectValues(collectionsMap)).slice(0, lastUsedThreshold);

        return linkTypesWithCollections.reduce((suggestions, linkType) => {
          const attributes = linkType.attributes;

          const linkTypeSuggestions = attributes.map(attribute => {
            let score = 0;
            const name = removeAccentFromString(attribute.name);
            if (text) {
              score += getScoreByMatch(name, text);
            }

            if (linkType.collections?.length === 2) {
              score += collectionAdditionalScore(linkType.collections[0], sortedCollections, 2);
              score += collectionAdditionalScore(linkType.collections[1], sortedCollections, 2);
            }

            return {attribute, linkType, suggestionType: SuggestionType.LinkAttribute, score};
          });
          suggestions.push(...linkTypeSuggestions);
          return suggestions;
        }, []);
      })
    );
  }

  private selectFullTextsSuggestions(text: string): Observable<FullTextSuggestion[]> {
    const items = [];
    if (text) {
      items.push({suggestionType: SuggestionType.FullText, score: 0, text});
    }
    return of(items);
  }
}

function createMaxSuggestionTypesMap(text: string, currentItems: QueryItem[]): Record<SuggestionType, number> {
  const stemItems = filterStemsQueryItems(currentItems);
  const isEmptySearch = stemItems.length === 0 && !text;
  const halfMaxSuggestions = Math.ceil(maxSuggestions / 2);
  return {
    [SuggestionType.View]: isEmptySearch ? 3 : halfMaxSuggestions,
    [SuggestionType.Collection]: isEmptySearch ? 3 : halfMaxSuggestions,
    [SuggestionType.LinkType]: isEmptySearch ? 3 : halfMaxSuggestions,
    [SuggestionType.LinkAttribute]: isEmptySearch ? 3 : halfMaxSuggestions,
    [SuggestionType.Attribute]: isEmptySearch ? 3 : halfMaxSuggestions,
    [SuggestionType.FullText]: 1,
  };
}

function addViewScoreByCurrentItems(suggestion: ViewSuggestion, text: string, stemsQueryItems: QueryItem[]) {
  if (stemsQueryItems.length > 0) {
    suggestion.score += SuggestionScore.Restricted;
  } else if (!text) {
    suggestion.score += ViewSuggestionScore.EmptyQueryAndText;
  }
}

function addCollectionScoreByCurrentItems(
  suggestion: CollectionSuggestion,
  text: string,
  stemsQueryItems: QueryItem[]
) {
  if (stemsQueryItems.length === 0 && !text) {
    suggestion.score += CollectionSuggestionScore.EmptyQueryAndText;
  }
}

function addFullTextScoreByCurrentItems(suggestion: FullTextSuggestion, queryItems: QueryItem[]) {
  const fulltextQueryItems = queryItems.filter(item => item.type === QueryItemType.Fulltext);
  if (fulltextQueryItems.some(item => item.text === suggestion.text)) {
    suggestion.score += SuggestionScore.Restricted;
  }
}

function addLinkTypeScoreByCurrentItems(
  suggestion: LinkTypeSuggestion,
  text: string,
  stemsQueryItems: QueryItem[],
  lastItem: QueryItem,
  collectionIdsChain: string[],
  linkTypeIdsChain: string[]
) {
  if (stemsQueryItems.length === 0 && !text) {
    suggestion.score += LinkTypeSuggestionScore.EmptyQueryAndText;
  }

  if (!lastItem) {
    return;
  }

  const isAlreadyInStem = linkTypeIdsChain.includes(suggestion.linkType.id);
  if (lastItem.type === QueryItemType.Collection) {
    const collectionItem = <CollectionQueryItem>lastItem;
    // can directly link to Collection
    if (suggestion.linkType.collectionIds.includes(collectionItem.collection.id)) {
      suggestion.score += LinkTypeSuggestionScore.IsDirectlyLinkable;
    }
  } else if (lastItem.type === QueryItemType.Link) {
    const linkTypeItem = <LinkQueryItem>lastItem;
    // can directly link to LinkType
    if (arrayIntersection(linkTypeItem.linkType.collectionIds, suggestion.linkType.collectionIds).length > 0) {
      suggestion.score += isAlreadyInStem
        ? LinkTypeSuggestionScore.IsLinkableDuplicated
        : LinkTypeSuggestionScore.IsDirectlyLinkable;
    }
    // there are other items after after Collection/Link query items but can still link to last QueryStem
  } else if (
    collectionIdsChain.length > 0 &&
    suggestion.linkType.collectionIds.includes(collectionIdsChain[collectionIdsChain.length - 1])
  ) {
    suggestion.score += isAlreadyInStem
      ? LinkTypeSuggestionScore.IsLinkableDuplicated
      : LinkTypeSuggestionScore.IsLinkable;
  }
}

function addAttributeScoreByCurrentItems(
  suggestion: AttributeSuggestion,
  text: string,
  lastStemItems: QueryItem[],
  collectionIdsChain: string[]
) {
  if (lastStemItems.length === 0 && !text) {
    suggestion.score += AttributeSuggestionScore.EmptyQueryAndText;
  }

  const isAlreadyInStem = lastStemItems.some(
    item =>
      item.type === QueryItemType.Attribute &&
      (<AttributeQueryItem>item).attribute.id === suggestion.attribute.id &&
      (<AttributeQueryItem>item).collection.id === suggestion.collection.id
  );
  if (collectionIdsChain.includes(suggestion.collection.id)) {
    suggestion.score += isAlreadyInStem
      ? AttributeSuggestionScore.IsUsedInCurrentStem
      : AttributeSuggestionScore.IsInCurrentStem;
  }
}

function addLinkAttributeScoreByCurrentItems(
  suggestion: LinkAttributeSuggestion,
  text: string,
  lastStemItems: QueryItem[],
  linkTypeIdsChain: string[]
) {
  if (lastStemItems.length === 0 && !text) {
    suggestion.score += LinkAttributeSuggestionScore.EmptyQueryAndText;
  }

  const isAlreadyInStem = lastStemItems.some(
    item =>
      item.type === QueryItemType.LinkAttribute &&
      (<LinkAttributeQueryItem>item).attribute.id === suggestion.attribute.id &&
      (<LinkAttributeQueryItem>item).linkType.id === suggestion.linkType.id
  );
  if (linkTypeIdsChain.includes(suggestion.linkType.id)) {
    suggestion.score += isAlreadyInStem
      ? LinkAttributeSuggestionScore.IsUsedInCurrentStem
      : LinkAttributeSuggestionScore.IsInCurrentStem;
  }
}

function createAttributesOrder(collections: Collection[]): {id: string; usageCount: number}[] {
  return (collections || [])
    .reduce((arr, collection) => {
      arr.push(
        ...(collection.attributes || []).map(attribute => ({
          id: attributeOrderId(collection, attribute),
          usageCount: attribute.usageCount,
        }))
      );
      return arr;
    }, [])
    .sort((a, b) => b.usageCount - a.usageCount);
}

function attributeOrderId(collection: Collection, attribute: Attribute): string {
  return `${collection.id}:${attribute.id}`;
}

function findCollectionIndex(collections: Collection[], id: string): number {
  return (collections || []).findIndex(collection => collection.id === id);
}

function findViewIndex(views: View[], id: string): number {
  return (views || []).findIndex(view => view.id === id);
}

function mapLinkType(linkType: LinkType, collectionsMap: Record<string, Collection>): LinkType {
  return {
    ...linkType,
    collections: [collectionsMap[linkType.collectionIds[0]], collectionsMap[linkType.collectionIds[1]]],
  };
}

function suggestionToQueryItem(suggestion: ObjectSuggestion): QueryItem {
  switch (suggestion.suggestionType) {
    case SuggestionType.View:
      const viewSuggestion = <ViewSuggestion>suggestion;
      return new ViewQueryItem(viewSuggestion.view, viewSuggestion.collection);
    case SuggestionType.Collection:
      return new CollectionQueryItem(generateId(), (<CollectionSuggestion>suggestion).collection);
    case SuggestionType.LinkType:
      return new LinkQueryItem(generateId(), (<LinkTypeSuggestion>suggestion).linkType);
    case SuggestionType.Attribute:
      const attributeSuggestion = <AttributeSuggestion>suggestion;
      const attributeCondition = initialConditionType(attributeSuggestion.attribute.constraint);
      const attributeValues = initialConditionValues(attributeCondition, attributeSuggestion.attribute.constraint);
      return new AttributeQueryItem(
        generateId(),
        attributeSuggestion.collection,
        attributeSuggestion.attribute,
        attributeCondition,
        attributeValues,
        true
      );
    case SuggestionType.LinkAttribute:
      const linkSuggestion = <LinkAttributeSuggestion>suggestion;
      const linkCondition = initialConditionType(linkSuggestion.attribute.constraint);
      const linkValues = initialConditionValues(linkCondition, linkSuggestion.attribute.constraint);
      return new LinkAttributeQueryItem(
        generateId(),
        linkSuggestion.linkType,
        linkSuggestion.attribute,
        linkCondition,
        linkValues,
        true
      );
    case SuggestionType.FullText:
      return new FulltextQueryItem((<FullTextSuggestion>suggestion).text);
  }
}

function suggestionText(suggestion: ObjectSuggestion): string {
  switch (suggestion.suggestionType) {
    case SuggestionType.View:
      return (<ViewSuggestion>suggestion).view.name;
    case SuggestionType.Collection:
      return (<CollectionSuggestion>suggestion).collection.name;
    case SuggestionType.LinkType:
      return (<LinkTypeSuggestion>suggestion).linkType.name;
    case SuggestionType.Attribute:
      return (<AttributeSuggestion>suggestion).attribute.name;
    case SuggestionType.LinkAttribute:
      return (<LinkAttributeSuggestion>suggestion).attribute.name;
  }
}

function getScoreByMatch(value: string, compareValue: string): number {
  if (value.includes(compareValue)) {
    if (value === compareValue) {
      return SuggestionScore.FullMatch;
    } else if (value.split(' ').includes(compareValue)) {
      return SuggestionScore.ContainsWord;
    } else if (value.startsWith(compareValue)) {
      return SuggestionScore.StartWith;
    }
    return SuggestionScore.Contains;
  } else {
    return SuggestionScore.Restricted;
  }
}

function viewAdditionalScore(view: View, sortedByLastUsed: View[]): number {
  let score = 0;
  score += view.favorite ? SuggestionScore.Favorite : 0;

  const indexByLastUsed = findViewIndex(sortedByLastUsed, view.id);
  score += indexByLastUsed < lastUsedThreshold && indexByLastUsed >= 0 ? SuggestionScore.LastUsed : 0;
  return score;
}

function collectionAdditionalScore(collection: Collection, sortedByLastUsed: Collection[], divider = 1): number {
  let score = 0;
  score += collection?.favorite ? SuggestionScore.Favorite : 0;

  const indexByLastUsed = findCollectionIndex(sortedByLastUsed, collection?.id);
  score += indexByLastUsed < lastUsedThreshold && indexByLastUsed >= 0 ? SuggestionScore.LastUsed : 0;
  return score / divider;
}

function filterStemsQueryItems(queryItems: QueryItem[]): QueryItem[] {
  return queryItems.filter(queryItem => queryItem.type !== QueryItemType.Fulltext);
}

function filterLastQueryStemItems(queryItems: QueryItem[]): QueryItem[] {
  if ((queryItems || []).length === 0) {
    return [];
  }
  const lastCollectionIndex = findLastIndexOfCollectionItem(queryItems);
  return queryItems.slice(lastCollectionIndex).filter(item => item.type !== QueryItemType.Fulltext);
}

function findLastIndexOfCollectionItem(queryItems: QueryItem[]): number {
  let lastIndex = 0;
  for (let i = 0; i < queryItems.length; i++) {
    if (queryItems[i].type === QueryItemType.Collection) {
      lastIndex = i;
    }
  }
  return lastIndex;
}

function getCollectionIdsChainForStemItems(queryItems: QueryItem[]): string[] {
  if (!queryItems[0] || queryItems[0].type !== QueryItemType.Collection) {
    return [];
  }
  const chainIds = [(queryItems[0] as CollectionQueryItem).collection.id];
  for (let i = 1; i < queryItems.length; i++) {
    if (queryItems[i].type !== QueryItemType.Link) {
      break;
    }
    const linkItem = queryItems[i] as LinkQueryItem;
    const otherCollectionId = getOtherLinkedCollectionId(linkItem.linkType, chainIds[i - 1]);
    chainIds.push(otherCollectionId);
  }
  return chainIds;
}

function getLinkTypeIdsChainForStemItems(queryItems: QueryItem[]): string[] {
  if (!queryItems[0] || queryItems[0].type !== QueryItemType.Collection) {
    return [];
  }
  const chainIds = [];
  for (let i = 1; i < queryItems.length; i++) {
    if (queryItems[i].type !== QueryItemType.Link) {
      break;
    }
    chainIds.push((queryItems[i] as LinkQueryItem).linkType.id);
  }
  return chainIds;
}
