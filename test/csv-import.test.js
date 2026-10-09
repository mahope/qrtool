'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { loadApp } = require('./helpers/load-app');

const api = loadApp();

// ---------------------------------------------------------- parsing

test('CSV: a single-column file keeps every non-empty row', () => {
    const result = api.csvToBatchValues('https://a.dk\nhttps://b.dk\n\nhttps://c.dk\n');
    assert.deepEqual(result.values, ['https://a.dk', 'https://b.dk', 'https://c.dk']);
    assert.equal(result.columnCount, 1);
});

test('CSV: a UTF-8 BOM is stripped from the first value', () => {
    const result = api.csvToBatchValues('\uFEFFhttps://a.dk\nhttps://b.dk');
    assert.deepEqual(result.values, ['https://a.dk', 'https://b.dk']);
});

test('CSV: a quoted value may contain the delimiter and stay one cell', () => {
    const rows = api.parseCsvRows('"København, Danmark";https://a.dk', ';');
    assert.deepEqual(rows, [['København, Danmark', 'https://a.dk']]);
});

test('CSV: doubled quotes inside a quoted field become one quote', () => {
    const rows = api.parseCsvRows('"Han sagde ""hej""",https://a.dk', ',');
    assert.deepEqual(rows, [['Han sagde "hej"', 'https://a.dk']]);
});

test('CSV: a line break inside quotes does not split the row', () => {
    const rows = api.parseCsvRows('"linje 1\nlinje 2",https://a.dk', ',');
    assert.deepEqual(rows, [['linje 1\nlinje 2', 'https://a.dk']]);
});

test('CSV: æøå survives the import unchanged', () => {
    const result = api.csvToBatchValues('tekst\nMælk & brød\nBlåbær');
    assert.deepEqual(result.values, ['Mælk & brød', 'Blåbær']);
});

test('CSV: detects semicolon, tab and comma delimiters', () => {
    assert.equal(api.detectCsvDelimiter('a;b;c'), ';');
    assert.equal(api.detectCsvDelimiter('a\tb\tc'), '\t');
    assert.equal(api.detectCsvDelimiter('a,b,c'), ',');
});

// ---------------------------------------------------------- column choice

test('CSV: header "navn, url" selects the url column, not the name', () => {
    const result = api.csvToBatchValues('navn,url\nMads,https://a.dk\nLone,https://b.dk');
    assert.equal(result.hasHeader, true);
    assert.equal(result.contentIndex, 1);
    assert.equal(result.columnCount, 2);
    assert.deepEqual(result.values, ['https://a.dk', 'https://b.dk']);
});

test('CSV: header "url, navn" selects the first column', () => {
    const result = api.csvToBatchValues('url,navn\nhttps://a.dk,Mads\nhttps://b.dk,Lone');
    assert.equal(result.contentIndex, 0);
    assert.deepEqual(result.values, ['https://a.dk', 'https://b.dk']);
});

test('CSV: without a header the url-looking column wins', () => {
    const result = api.csvToBatchValues('Mads,https://a.dk\nLone,https://b.dk');
    assert.equal(result.hasHeader, false);
    assert.equal(result.contentIndex, 1);
    assert.deepEqual(result.values, ['https://a.dk', 'https://b.dk']);
});

test('CSV: with no urls the longest values column wins', () => {
    const result = api.csvToBatchValues('1,En lang beskrivelse her\n2,Kort');
    assert.equal(result.contentIndex, 1);
    assert.deepEqual(result.values, ['En lang beskrivelse her', 'Kort']);
});

test('CSV: a mailto or tel value counts as content, not a label', () => {
    const result = api.csvToBatchValues('Kontakt,mailto:info@a.dk\nSalg,tel:+4512345678');
    assert.equal(result.contentIndex, 1);
    assert.deepEqual(result.values, ['mailto:info@a.dk', 'tel:+4512345678']);
});

// ---------------------------------------------------------- edge cases

test('CSV: a header with no data rows yields no values', () => {
    const result = api.csvToBatchValues('navn,url');
    assert.deepEqual(result.values, []);
});

test('CSV: an empty file yields no values', () => {
    const result = api.csvToBatchValues('   \n  ');
    assert.deepEqual(result.values, []);
    assert.equal(result.columnCount, 0);
});

test('CSV: surrounding spaces are trimmed from every value', () => {
    const result = api.csvToBatchValues('  https://a.dk  \n\thttps://b.dk\t');
    assert.deepEqual(result.values, ['https://a.dk', 'https://b.dk']);
});
