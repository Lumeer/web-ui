export interface CustomTag {
  readOnly?: any[];
  sticky?: boolean;
  source?: any[];
  operand?: string;
  equality?: string;
  type: string;
}

export interface QueryTag extends CustomTag {
  colName: string;
  colValue: string;
}

export const NUMBER = 'number';
export const STRING = 'string';
