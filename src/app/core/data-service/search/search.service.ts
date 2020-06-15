/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General abstract License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General abstract License for more details.
 *
 * You should have received a copy of the GNU General abstract License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Observable} from 'rxjs';
import {SuggestionQueryDto} from '../../dto/suggestion-query.dto';
import {DocumentDto, LinkInstanceDto, QueryDto, SuggestionsDto} from '../../dto';
import {Workspace} from '../../store/navigation/workspace';

export abstract class SearchService {
  abstract suggest(dto: SuggestionQueryDto): Observable<SuggestionsDto>;

  abstract searchLinkInstances(query: QueryDto, workspace?: Workspace): Observable<LinkInstanceDto[]>;

  abstract searchDocuments(query: QueryDto, workspace?: Workspace): Observable<DocumentDto[]>;
}
