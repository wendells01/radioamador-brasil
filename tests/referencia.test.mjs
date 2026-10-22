import test from "node:test";
import assert from "node:assert/strict";
import { normalize, matches, filterGroups, DATA } from "../site/assets/js/referencia.js";

const ALPHABET_WORDS = [
  "Alfa", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel",
  "India", "Juliett", "Kilo", "Lima", "Mike", "November", "Oscar", "Papa",
  "Quebec", "Romeo", "Sierra", "Tango", "Uniform", "Victor", "Whiskey",
  "X-ray", "Yankee", "Zulu",
];

const QCODE_SET = [
  "QRA", "QRG", "QRL", "QRM", "QRN", "QRO", "QRP", "QRQ", "QRS", "QRT",
  "QRV", "QRX", "QRZ", "QSB", "QSL", "QSO", "QSY", "QTH",
];

const TERM_SET = [
  "indicativo", "qso", "qsl", "dx", "simplex", "duplex", "repetidora",
  "offset", "ctcss", "dcs", "roe/swr", "hf", "vhf", "uhf", "coer",
];

test("26 entradas do alfabeto fonético, na ordem e grafias exatas", () => {
  assert.equal(DATA.alphabet.length, 26);
  assert.deepEqual(DATA.alphabet.map((r) => r.palavra), ALPHABET_WORDS);
  assert.deepEqual(
    DATA.alphabet.map((r) => r.letra),
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  );
});

test("18 códigos Q, conjunto exato", () => {
  assert.equal(DATA.qcodes.length, 18);
  assert.deepEqual(DATA.qcodes.map((r) => r.codigo), QCODE_SET);
});

test("15 termos, conjunto exato (normalizado)", () => {
  assert.equal(DATA.terms.length, 15);
  assert.deepEqual(DATA.terms.map((r) => normalize(r.termo)), TERM_SET);
});

test("normalize remove acentos e caixa", () => {
  assert.equal(normalize("localização"), normalize("localizacao"));
  assert.ok(matches("localizacao", "localização"));
  assert.ok(matches("INDICATIVO", "indicativo"));
  assert.ok(matches("qth", "QTH"));
});

test("filterGroups com busca inexistente não deixa linhas visíveis", () => {
  const result = filterGroups(DATA, "zzzinexistente");
  assert.deepEqual(Object.keys(result).sort(), ["alphabet", "qcodes", "terms"]);
  for (const rows of Object.values(result)) {
    assert.equal(rows.length, 0);
  }
});

test("filterGroups com consulta vazia devolve tudo", () => {
  const result = filterGroups(DATA, "");
  assert.equal(result.alphabet.length, 26);
  assert.equal(result.qcodes.length, 18);
  assert.equal(result.terms.length, 15);
});

test("importar o módulo no Node não exige DOM", () => {
  assert.equal(typeof document, "undefined");
  assert.equal(typeof window, "undefined");
});
