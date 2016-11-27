export interface CustomTag {
  readOnly?: any[];
  sticky?: boolean;
  source?: any[];
}

export interface QueryTag extends CustomTag {
  colName: string;
  colValue: string;
}
