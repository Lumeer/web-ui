export interface AutoCompleteOptions {
  displayKey: string;
  filterBy?: any;
  remoteAddr?: string;
  fetchResources?: () => any;
  filterFn?: (item, currentValue?) => boolean;
  limit?: number;
}
