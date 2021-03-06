/**
 * Generated types defined in namespace:
 * 
 *    |                
 *    |➔  ns:foo.multi
 *    |
 *
 * By:
 *    @platform/cell.typesystem@0.0.208
 * 
 * Notes: 
 * 
 *    - DO NOT manually edit this file (it will be regenerated automatically).
 *    - DO check this file into source control.
 *    - Usage
 *        Import the [.d.ts] file within the consuming module
 *        that uses a [TypedSheet] to programatically manipulate 
 *        the namespace in a strongly-typed manner, for example:
 * 
 *            import * as t from './<filename>;
 * 
 */

/**
 * Complete index of types available within the sheet.
 * Use by passing into a sheet at creation, for example:
 *
 *    const sheet = await TypedSheet.load<t.TypeIndex>({ ns, fetch });
 *
 */
export declare type TypeIndex = {
  MyOne: MyOne;
  MyTwo: MyTwo;
};

export declare type MyOne = {
  title: string;
  foo: string;
};

export declare type MyTwo = {
  bar: string;
  name: string;
};
