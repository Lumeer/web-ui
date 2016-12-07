export interface AutoCompleteOptions {
  displayKey: string;
  filterBy?: any;
  remoteAddr?: string;
  fetchResources?: () => any;
  filterFn?: (item) => boolean;
}
