import Filter from './filter';


export default class MediaSearchFilter implements Filter
{

  private _term: String = "";

  get term(): String
  {
    return this._term;
  }

  set term(newTerm: String)
  {
    this._term = newTerm;
  }

  //the search term as well as the targetNodes are transformed to lowercase and then checked with contains
  public meetCriteria(data: any): any
  {
    let resultData = new Array<any>();

    if(this._term === null || this._term === undefined || this._term === "")
      return data;

    for(let entry of data)
    {
      let term = this._term.toLowerCase();
      let value = entry.targetNode.toLowerCase();
      //value contains term?
      if(value.indexOf(term) !== -1)
        resultData.push(entry);
    }

    return resultData;
  }

  public printData(): void
  {
    console.log("Media Search Filter: " + this._term);
  }
}
