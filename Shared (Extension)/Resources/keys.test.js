/**
 * @jest-environment jsdom
 */

// eslint-disable-next-line object-curly-newline
const { getCombinations, homeRow, isAbsent, getContiguousUniqueSubsequence, tryPrefixes } = require('./keys');

// MARK: - getCombinations

test('get all combinations of home row keys with length 1', () => {
  expect(getCombinations(1)).toEqual(homeRow);
});

test('get combinations of letters "a", "b", and "c" with length 2. Ignore order of combinations', () => {
  const testLetters = ['a', 'b', 'c'];
  const expectedCombinations = ['aa', 'ab', 'ac', 'ba', 'bb', 'bc', 'ca', 'cb', 'cc'];
  expect(getCombinations(2, [''], testLetters).sort()).toEqual(expectedCombinations);
});

test('verify the correct array size', () => {
  const testLetters = ['a', 'b', 'c'];
  const testSizeInput = 4;
  const expectedOutputSize = testLetters.length ** testSizeInput;
  expect(getCombinations(testSizeInput, [''], testLetters).length).toBe(expectedOutputSize);
});

// MARK: - isAbsent
test('isAbsent general behavior', () => {
  const model = [
    {
      key: 'Ab',
      element: document.createElement('A'),
      type: 'stringlike',
      responsibleNode: document.createElement('SPAN'),
      faux: document.createElement('A'),
    },
    {
      key: 'Bc',
      element: document.createElement('A'),
      type: 'stringlike',
      responsibleNode: document.createElement('SPAN'),
      faux: document.createElement('A'),
    },
  ];
  expect(isAbsent('Ab', model)).toBe(false);
  expect(isAbsent('Cd', model)).toBe(true);
});

test('isAbsent is case-insensitive', () => {
  const model = [
    {
      key: 'AB',
      element: document.createElement('A'),
      type: 'stringlike',
      responsibleNode: document.createElement('SPAN'),
      faux: document.createElement('A'),
    },
  ];
  expect(isAbsent('ab', model)).toBe(false);
});

test('isAbsent validates input type', () => {
  const model = [];

  const testWhenFirstParameterIsNotAString = () => {
    isAbsent(3, model);
  };

  const testWhenSecondParameterIsNotAnArray = () => {
    isAbsent('a', 3);
  };

  expect(testWhenFirstParameterIsNotAString).toThrow(TypeError);
  expect(testWhenSecondParameterIsNotAnArray).toThrow(TypeError);
});

// MARK: - getContiguousUniqueSubsequence
test('test that window slides if prefix exists', () => {
  const mockWords = ['Horse', 'Hop'];

  const mockModel = [{ key: 'Ho' }];
  expect(getContiguousUniqueSubsequence(mockWords, 2, mockModel)).toBe('or');

  const mockModel4 = [{ key: 'Ho' }, { key: 'or' }, { key: 'rs' }, { key: 'se' }];
  expect(getContiguousUniqueSubsequence(mockWords, 2, mockModel4)).toBe('op');
});

// MARK: - tryPrefixes
test('test that prefixes are tried', () => {
  const mockWords = 'Read regions session';

  const mockModel1 = [];
  expect(tryPrefixes(mockWords, 2, mockModel1)).toBe('Re');

  const mockModel2 = [{ key: 'Re' }];
  expect(tryPrefixes(mockWords, 2, mockModel2)).toBe('se');
});

test('test that once prefixes are exhausets, other subsequences are tried', () => {
  const mockWords = 'Read regions session';

  const mockModel2 = [{ key: 'Re' }, { key: 'se' }];
  expect(tryPrefixes(mockWords, 2, mockModel2)).toBe('ea');
});
