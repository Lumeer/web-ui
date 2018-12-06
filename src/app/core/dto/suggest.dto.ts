import {SuggestionType} from './suggestion-type';

export interface SuggestDto {
  text: string;
  type: SuggestionType;
  priorityCollectionIds: string[];
}
