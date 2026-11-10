import test from 'node:test';
import assert from 'node:assert/strict';
import { priceAt, cartTotals, changeCart, parseMoney, summarize, budgetDecision, cairoDate, monthOptions, moveToCheapest, lowestStore, isAvailable, sampleAreas, budgetForMonth, campaignProducts } from '../src/domain/model.ts';

const milk = { id: 'milk', price: 38, high: 47 };
test('the selected store and quantity determine totals and savings', () => {
  const cart = changeCart([], 'milk', 1, 2);
  assert.equal(priceAt(milk, 1), 4100);
  assert.deepEqual(cartTotals(cart, [milk]), { count: 2, subtotal: 8200, savings: 1200 });
});
test('the same product at different stores remains separate', () => {
  const cart = changeCart(changeCart([], 'milk', 0, 1), 'milk', 3, 1);
  assert.equal(cart.length, 2);
  assert.equal(cartTotals(cart, [milk]).subtotal, 8500);
});
test('removing the final quantity leaves a genuinely empty basket', () => {
  const cart = changeCart(changeCart([], 'milk', 0, 1), 'milk', 0, -1);
  assert.deepEqual(cart, []);
  assert.deepEqual(cartTotals(cart, [milk]), { count: 0, subtotal: 0, savings: 0 });
});
test('quantity bounds and invalid store inputs are enforced', () => {
  assert.deepEqual(changeCart([], 'milk', 0, 100), []);
  assert.deepEqual(changeCart([], 'milk', 8, 1), []);
  assert.deepEqual(changeCart([], 'milk', 0, 1.5), []);
  assert.throws(() => priceAt(milk, -1));
});

test('moving to the cheapest store preserves every unit beyond 99', () => {
  const cart = [{ productId: 'milk', storeId: 0, quantity: 80 }, { productId: 'milk', storeId: 1, quantity: 99 }, { productId: 'milk', storeId: 3, quantity: 99 }];
  const moved = moveToCheapest(cart,[milk]);
  assert.equal(cartTotals(moved,[milk]).count,278);
  assert.equal(moved.find(l => l.storeId === 0).quantity,99);
  assert.ok(moved.every(l => l.quantity > 0 && l.quantity <= 99));
  assert.ok(cartTotals(moved,[milk]).subtotal <= cartTotals(cart,[milk]).subtotal);
  assert.deepEqual(moveToCheapest(moved,[milk]),moved);
});
test('rejected additions leave an existing basket unchanged', () => {
  const cart = [{productId:'milk',storeId:0,quantity:98}];
  assert.deepEqual(changeCart(cart,'milk',0,2),cart);
  assert.equal(changeCart(cart,'milk',0,1)[0].quantity,99);
});
test('budgets belong to their own month; missing differs from explicitly unset', () => {
  const budgets = {'2026-11':800000,'2026-10':600000,'2026-09':0};
  assert.equal(budgetForMonth(budgets,'2026-11'),800000);
  assert.equal(budgetForMonth(budgets,'2026-10'),600000);
  assert.equal(budgetForMonth(budgets,'2026-09'),0);
  assert.equal(budgetForMonth(budgets,'2026-08'),null);
  const updated = {...budgets,'2026-11':900000};
  assert.equal(budgetForMonth(updated,'2026-10'),600000);
});
test('areas change prices, product availability and the eligible cheapest store', () => {
  assert.notEqual(priceAt(milk,1,'maadi'),priceAt(milk,1,'new-cairo'));
  assert.equal(isAvailable('eggs',0,'maadi'),false);
  assert.equal(isAvailable('eggs',0,'new-cairo'),true);
  assert.equal(isAvailable('milk',0,'sheikh-zayed'),false);
  assert.notEqual(lowestStore(milk,'sheikh-zayed'),0);
  const cart = [{productId:'milk',storeId:1,quantity:2}];
  assert.equal(cartTotals(cart,[milk],'maadi').subtotal,priceAt(milk,1,'maadi')*2);
});
test('area-aware moves preserve quantities and only target available stores', () => {
  const cart = [{productId:'milk',storeId:0,quantity:99},{productId:'milk',storeId:3,quantity:80}];
  for (const areaId of Object.keys(sampleAreas)) {
    const moved = moveToCheapest(cart,[milk],areaId);
    assert.equal(cartTotals(moved,[milk],areaId).count,179);
    assert.ok(moved.every(l => l.quantity <= 99));
    assert.ok(isAvailable('milk',lowestStore(milk,areaId),areaId));
  }
});
test('campaigns have distinct product destinations', () => {
  assert.deepEqual(campaignProducts['home-refresh'],['soap']);
  assert.ok(campaignProducts['pantry-days'].includes('rice'));
  assert.ok(!campaignProducts['fresh-week'].includes('soap'));
});
test('English and Arabic money input is converted to exact piastres', () => {
  assert.equal(parseMoney('1,250.25'), 125025);
  assert.equal(parseMoney('١٬٢٥٠٫٢٥'), 125025);
  assert.equal(parseMoney('0.10'), 10);
  for (const invalid of ['', '-1', '1.234', 'NaN', '9999999999999999999']) assert.equal(parseMoney(invalid), null);
});
test('summaries filter month and family member consistently', () => {
  const base = { saving: 100, category: 'dairy', store: 'Sample', source: 'sample' };
  const purchases = [
    { ...base, id: '1', date: '2026-11-01', memberId: 'mona', amount: 3800 },
    { ...base, id: '2', date: '2026-11-02', memberId: 'ahmed', amount: 4700 },
    { ...base, id: '3', date: '2026-10-01', memberId: 'mona', amount: 10000 },
  ];
  assert.equal(summarize(purchases, '2026-11').spent, 8500);
  assert.equal(summarize(purchases, '2026-11', 'mona').spent, 3800);
  assert.equal(summarize(purchases, '2026-11').saved, 200);
  assert.deepEqual(summarize(purchases, '2026-09').categories, []);
});
test('budget alerts respect boundaries, absent budgets and saved reasons', () => {
  assert.equal(budgetDecision(7999, 10000, false), null);
  assert.equal(budgetDecision(8000, 10000, false), 'budget80');
  assert.equal(budgetDecision(10000, 10000, false), 'budget100');
  assert.equal(budgetDecision(12000, 10000, true), null);
  assert.equal(budgetDecision(100, 0, false), null);
});
test('month boundaries use Cairo and month options cross the year', () => {
  assert.equal(cairoDate(new Date('2026-11-30T23:30:00Z')), '2026-12-01');
  assert.deepEqual(monthOptions(new Date('2026-01-15T12:00:00Z')).slice(0, 2), ['2026-01', '2025-12']);
});
