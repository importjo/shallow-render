import { DebugElement } from '@angular/core';

export class QueryMatch extends DebugElement {
  length = this._matches.length;

  constructor(private _matches: DebugElement[]) {
    super(
      _matches[0] && _matches[0].nativeNode,
      _matches[0] && _matches[0].parent,
      _matches[0] && (_matches[0] as any)._debugContext
    );
  }

  forEach(fn: (item: DebugElement, index: number, array: DebugElement[]) => void, thisArg?: any) {
    return this._matches.forEach(fn, thisArg);
  }

  map(fn: <T>(item: DebugElement, index: number, array: DebugElement[]) => T, thisArg?: any) {
    return this._matches.map(fn, thisArg);
  }
}

export class NoMatchesError extends Error {
  constructor(propertyName: string) {
    super(`Could not find the element you were looking for. Your test tried to access the '${propertyName}' property on a QureyResult but your query had no results.`);
  }
}

export class EmptyQueryMatch {
  length = 0;
  forEach = [].forEach;
  map = [].forEach;
}

/////////////////////////////////////////////
// TODO: Is there a better way to do this?
/////////////////////////////////////////////
// When the query returns no results, protect the tester
// by throwing errors when any of the DebugElement's properties
// are accessed in their tests.
// This 'magic' lets us apply this logic in a way that is type-safe by
// forcing us to have all attributes of DebugElement in the list below.
const debugElementProps: {[key in keyof DebugElement]: undefined} = {
  attributes: undefined,
  childNodes: undefined,
  children: undefined,
  classes: undefined,
  componentInstance: undefined,
  context: undefined,
  injector: undefined,
  listeners: undefined,
  name: undefined,
  nativeElement: undefined,
  nativeNode: undefined,
  parent: undefined,
  properties: undefined,
  providerTokens: undefined,
  references: undefined,
  styles: undefined,
  addChild: undefined,
  insertBefore: undefined,
  insertChildrenAfter: undefined,
  query: undefined,
  queryAll: undefined,
  queryAllNodes: undefined,
  removeChild: undefined,
  triggerEventHandler: undefined,
}
Object.keys(debugElementProps).forEach(key => {
  Object.defineProperty(
    EmptyQueryMatch.prototype,
    key,
    {
      get() { throw new NoMatchesError(key); },
      set() { throw new NoMatchesError(key); },
   }
  );
});
