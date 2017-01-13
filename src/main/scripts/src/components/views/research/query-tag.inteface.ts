import {CustomTag} from '../../common/helpers/tag.interface';

export interface ITagOptions {
  display: {colName: CustomTag[], colValue: CustomTag[]};
  values: CustomTag[];
  operandTypes: ITypeOperand;
  equalityValues: {string: ITypeOperand, number: ITypeOperand};
  withColNames(colNames: CustomTag[]): ITagOptions;
  withColValues(colValues: CustomTag[]): ITagOptions;
}

export interface ITagBuilder {
  withOperands(operands: string[]): ITagBuilder;
  withStringEquality(stringEquality: ITypeIcon[]): ITagBuilder;
  withNumberEquality(numberEquality: string[]): ITagBuilder;
}

export interface ITypeOperand {
  type: 'icon' | 'string';
  values: ITypeIcon[] | string[];
}

export interface ITypeIcon {
  icon: string;
  value: string;
  title?: string;
}

export class TagBuilder implements ITagBuilder {
  public display: any;
  public values: any;
  public operandTypes: any;
  public equalityValues: any;

  constructor() {
    this.equalityValues = {};
  }

  public withOperands(operands: string[]) {
    this.operandTypes = new TypeOperand('string', operands);
    return this;
  }

  public withStringEquality(stringEquality: ITypeIcon[]) {
    this.equalityValues.string = new TypeOperand('icon', stringEquality);
    return this;
  }

  public withNumberEquality(numberEquality: string[]) {
    this.equalityValues.number = new TypeOperand('string', numberEquality);
    return this;
  }

  public build() {
    this.display = {
      colName: [],
      colValue: []
    };
    return new TagOptions(this);
  }
}

export class TagOptions implements ITagOptions {
  public display: {colName: CustomTag[]; colValue: CustomTag[]};
  public values: CustomTag[];
  public operandTypes: ITypeOperand;
  public equalityValues: {string: ITypeOperand; number: ITypeOperand};

  constructor(tagBuilder?: TagBuilder) {
    this.display = tagBuilder.display;
    this.values = tagBuilder.values;
    this.operandTypes = tagBuilder.operandTypes;
    this.equalityValues = tagBuilder.equalityValues;
  }

  public withColNames(colNames: CustomTag[]) {
    this.display.colName = colNames;
    return this;
  }

  public withColValues(colValues:  CustomTag[]) {
    this.display.colValue = colValues;
    return this;
  }
}

class TypeOperand implements ITypeOperand {
  constructor(public type, public values) {}
}
