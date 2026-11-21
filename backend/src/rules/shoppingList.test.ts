import { describe, expect, it } from 'vitest';
import { loadFixture } from '../../test/fixtures.ts';
import { type ListBasket, type ListItem, listToBasket } from './shoppingList.ts';

const fx = loadFixture<{
  catalogue_ids: string[];
  cases: { name: string; items: ListItem[]; expected: ListBasket }[];
}>('rules/shopping_list.json');

describe('listToBasket', () => {
  it.each(fx.cases)('$name', ({ items, expected }) => {
    expect(listToBasket(items, fx.catalogue_ids)).toEqual(expected);
  });

  it('does not change the items it was given', () => {
    const items: ListItem[] = [
      { raw_text: 'milk', product_id: 'milk', quantity: 2 },
      { raw_text: 'milk', product_id: 'milk', quantity: 3 },
    ];
    const copy = structuredClone(items);
    listToBasket(items, ['milk']);
    expect(items).toEqual(copy);
  });
});
