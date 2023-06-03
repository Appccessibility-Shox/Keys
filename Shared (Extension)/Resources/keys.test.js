/**
 * @jest-environment jsdom
 */

const testableFunctions = require('./keys');

test('adds two numbers', () => {
  expect(testableFunctions.sum(2, 3)).toBe(5);
});

test('multiplies two numbers', () => {
  expect(testableFunctions.product(2, 3)).toBe(6);
});
