/**
 * This class is used to describe a payment object which has a property amount.
 */
export default class Payment
{
  private _amount: number;

  public constructor(value: number)
  {
    this._amount = value;
  }

  get amount():number
  {
    return this._amount;
  }

  set amount(a:number)
  {
    this._amount = a;
  }
}
