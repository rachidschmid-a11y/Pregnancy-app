// Tests für die reinen Hilfsfunktionen in public/index.html
// Ausführen im Projektordner:  npm test   (oder: node --test tests/*.test.js)
// Benötigt nur Node.js (ab Version 20), keine weiteren Pakete.

"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const zlib = require("node:zlib");

function loadHelpers(){
  const html = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
  const start = html.indexOf("/* ==== BEGIN REINE HILFSFUNKTIONEN");
  const end = html.indexOf("/* ==== ENDE REINE HILFSFUNKTIONEN");
  assert.ok(start > 0 && end > start, "Markierungen im Code nicht gefunden");
  const names = ["uid","esc","safeUrl","isoDate","parseIsoDate","daysFromTo","stableStringify","sameValue","deepClone",
    "mergeFields","mergeOrder","mergeTree","mergeChecklist","mergeClothingCategories","parsePrice","fmtMoney",
    "pregnancyInfo","babyAge","sizeTimeframe","suggestTargets","contractionStats","fmtDuration","buildIcs","icsFold",
    "csvCell","csvText","slug","crc32","buildZipParts","parseZip","base64ToBytes","bytesToBase64","extrasFromState","restoreV2Fields",
    "placeEntry","neighborMove","movedIds","diffTree","undoTreeChange","CHECKLIST_SPEC","CLOTHING_CATS_SPEC",
    "sortNotes","noteMatches","relTime","lineChanges"];
  const code = html.slice(start, end) + "\n;({" + names.join(",") + "});";
  const ctx = vm.createContext({TextEncoder, TextDecoder, Blob, Response, DecompressionStream, atob, btoa, Uint8Array, DataView, ArrayBuffer, Uint32Array, Promise, Date, Math, JSON});
  return vm.runInContext(code, ctx);
}
const H = loadHelpers();
const plain = (v) => JSON.parse(JSON.stringify(v)); // Objekte aus dem VM-Kontext vergleichbar machen

function item(id, title, extra){ return Object.assign({id, title, done:false, notizen:""}, extra || {}); }
function doc(cats, extra){ return Object.assign({dueDate:"", categories: cats}, extra || {}); }
function cat(id, name, items){ return {id, name, icon:"spark", items}; }

test("Zusammenführen: Änderungen an verschiedenen Punkten bleiben beide erhalten", () => {
  const base = doc([cat("c1","A",[item("i1","eins"), item("i2","zwei")])]);
  const local = H.deepClone(base); local.categories[0].items[0].done = true;
  const remote = H.deepClone(base); remote.categories[0].items[1].notizen = "Notiz vom Partner";
  const m = plain(H.mergeChecklist(base, local, remote));
  assert.equal(m.categories[0].items[0].done, true);
  assert.equal(m.categories[0].items[1].notizen, "Notiz vom Partner");
});

test("Zusammenführen: beide ändern dasselbe Feld → eigene Änderung gewinnt", () => {
  const base = doc([cat("c1","A",[item("i1","eins")])]);
  const local = H.deepClone(base); local.categories[0].items[0].title = "lokal";
  const remote = H.deepClone(base); remote.categories[0].items[0].title = "remote";
  assert.equal(H.mergeChecklist(base, local, remote).categories[0].items[0].title, "lokal");
});

test("Zusammenführen: neue Punkte beider Seiten bleiben erhalten, in sinnvoller Reihenfolge", () => {
  const base = doc([cat("c1","A",[item("i1","eins"), item("i2","zwei")])]);
  const local = H.deepClone(base); local.categories[0].items.push(item("l1","lokal neu"));
  const remote = H.deepClone(base); remote.categories[0].items.splice(1, 0, item("r1","remote neu"));
  const ids = H.mergeChecklist(base, local, remote).categories[0].items.map(i => i.id);
  assert.deepEqual(plain(ids), ["i1","r1","i2","l1"]);
});

test("Zusammenführen: Löschungen beider Seiten werden übernommen", () => {
  const base = doc([cat("c1","A",[item("i1","eins"), item("i2","zwei"), item("i3","drei")])]);
  const local = H.deepClone(base); local.categories[0].items.splice(0, 1);          // i1 lokal gelöscht
  const remote = H.deepClone(base); remote.categories[0].items.splice(2, 1);        // i3 remote gelöscht
  remote.categories[0].items[0].title = "eins geändert";                            // (i1 remote geändert)
  const ids = H.mergeChecklist(base, local, remote).categories[0].items.map(i => i.id);
  assert.deepEqual(plain(ids), ["i2"]);
});

test("Zusammenführen: Umsortieren der anderen Seite + eigene neue Kategorie", () => {
  const base = doc([cat("c1","A",[]), cat("c2","B",[]), cat("c3","C",[])]);
  const local = H.deepClone(base); local.categories.push(cat("c4","D",[]));
  const remote = H.deepClone(base); remote.categories.reverse();
  const ids = H.mergeChecklist(base, local, remote).categories.map(c => c.id);
  assert.deepEqual(plain(ids), ["c3","c2","c1","c4"]);
});

test("Zusammenführen: verschobener Punkt behält die Änderung der anderen Seite", () => {
  const base = doc([cat("c1","A",[item("i1","eins")]), cat("c2","B",[])]);
  const local = H.deepClone(base);
  local.categories[1].items.push(local.categories[0].items.pop());                 // lokal nach B verschoben
  const remote = H.deepClone(base); remote.categories[0].items[0].notizen = "wichtig";
  const m = plain(H.mergeChecklist(base, local, remote));
  assert.equal(m.categories[0].items.length, 0);
  assert.equal(m.categories[1].items[0].id, "i1");
  assert.equal(m.categories[1].items[0].notizen, "wichtig");
});

test("Zusammenführen: Kopfdaten (ET, Budget) und unbekannte Felder", () => {
  const base = doc([], {budget:"", zukunft:{a:1}});
  const local = H.deepClone(base); local.dueDate = "2026-12-01";
  const remote = H.deepClone(base); remote.budget = "3000";
  const m = plain(H.mergeChecklist(base, local, remote));
  assert.equal(m.dueDate, "2026-12-01");
  assert.equal(m.budget, "3000");
  assert.deepEqual(m.zukunft, {a:1});
});

test("Zusammenführen: nichts geändert → Stand der anderen Seite", () => {
  const base = doc([cat("c1","A",[item("i1","eins")])]);
  const remote = H.deepClone(base); remote.categories[0].name = "A2";
  const m = plain(H.mergeChecklist(base, H.deepClone(base), remote));
  assert.deepEqual(m, plain(remote));
});

test("Zusammenführen: Kleidungs-Kategorien (umbenennen + neue Unterkategorie)", () => {
  const base = [{key:"bodys", name:"Bodys", icon:"onesie", subs:[{key:"kurz", name:"Kurzarm"}]}];
  const local = H.deepClone(base); local[0].subs.push({key:"neu", name:"Wickelbodys"});
  const remote = H.deepClone(base); remote[0].subs[0].name = "Kurzärmelig";
  const m = plain(H.mergeClothingCategories(base, local, remote));
  assert.deepEqual(m[0].subs.map(s => s.name), ["Kurzärmelig","Wickelbodys"]);
});

test("Preise erkennen", () => {
  assert.equal(H.parsePrice("120 €"), 120);
  assert.equal(H.parsePrice("ca. 1.299,90 €"), 1299.9);
  assert.equal(H.parsePrice("1.200"), 1200);
  assert.equal(H.parsePrice("12.50"), 12.5);
  assert.equal(H.parsePrice("50–80 €"), 50);
  assert.equal(H.parsePrice("89,-"), 89);
  assert.equal(H.parsePrice("gratis"), null);
  assert.equal(H.parsePrice(""), null);
});

test("Schwangerschaftswoche aus dem Entbindungstermin", () => {
  const today = new Date(2026, 8, 25);
  let p = H.pregnancyInfo("2026-09-25", today);
  assert.equal(p.label, "40+0"); assert.equal(p.trimester, 3);
  p = H.pregnancyInfo("2026-11-20", today);  // 56 Tage vor ET
  assert.equal(p.label, "32+0"); assert.equal(p.ssw, 33); assert.equal(p.size[0], "Chinakohl");
  p = H.pregnancyInfo(H.isoDate(new Date(2026, 8, 25 + 280 - 91)), today); // Tag 91
  assert.equal(p.label, "13+0"); assert.equal(p.trimester, 2);
  assert.equal(H.pregnancyInfo("", today), null);
  assert.equal(H.pregnancyInfo("2028-01-01", today).inRange, false);
});

test("Alter des Babys", () => {
  const now = new Date(2026, 8, 25);
  assert.equal(H.babyAge("2026-09-25", now), "heute geboren");
  assert.equal(H.babyAge("2026-09-20", now), "5 Tage alt");
  assert.equal(H.babyAge("2026-08-01", now), "7 Wochen alt");
  assert.equal(H.babyAge("2026-03-25", now), "6 Monate alt");
  assert.equal(H.babyAge("2026-10-01", now), null);
});

test("Größe → Zeitraum und Jahreszeit", () => {
  const tf = H.sizeTimeframe("50/56", "2026-11-15");
  assert.equal(tf.label, "Nov 2026 – Jan 2027");
  assert.equal(tf.climate, "kalt");
  assert.equal(H.sizeTimeframe("74/80", "2026-11-15").climate, "mild"); // Mai–Nov: gemischt
  assert.equal(H.sizeTimeframe("62/68", "2026-03-01").climate, "warm"); // Mai–Aug
  assert.equal(H.sizeTimeframe("Uni Size", "2026-11-15"), null);
  const winter = H.suggestTargets("50/56", "kalt"), summer = H.suggestTargets("50/56", "warm");
  assert.ok(winter["bodys|langarm"] > summer["bodys|langarm"]);
  assert.ok(summer["bodys|kurzarm"] > winter["bodys|kurzarm"]);
  assert.equal(winter["outdoor_jacken|schneeanzuege_winterjacken"], 1);
});

test("Wehen-Auswertung", () => {
  const now = Date.UTC(2026, 8, 25, 12, 0, 0);
  const list = [];
  for (let i = 0; i < 12; i++){ const s = now - (60 - i * 5) * 60000; list.push({start: s, end: s + 60000}); }
  const st = H.contractionStats(list, now);
  assert.equal(st.count, 12);
  assert.equal(Math.round(st.avgInterval), 300);
  assert.equal(Math.round(st.avgDuration), 60);
  assert.equal(st.regular, true);
  const few = H.contractionStats(list.slice(0, 3), now);
  assert.equal(few.regular, false);
  assert.equal(H.fmtDuration(75), "1:15");
  assert.equal(H.fmtDuration(null), "–");
});

test("Kalender-Export (.ics)", () => {
  const ics = H.buildIcs([
    {uid:"a", date:"2026-10-01", title:"Frist: Elterngeld; Antrag, mit Umlauten äöü und einem sehr langen Titel, der umgebrochen werden muss", weekly:true, alarm:true}
  ], new Date(Date.UTC(2026, 8, 25, 6, 0, 0)));
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261001\r\n/);
  assert.match(ics, /DTEND;VALUE=DATE:20261002\r\n/);
  assert.match(ics, /RRULE:FREQ=WEEKLY/);
  assert.match(ics, /Elterngeld\\; Antrag\\, mit/);
  for (const line of ics.split("\r\n")) assert.ok(Buffer.byteLength(line) <= 75, "Zeile zu lang: " + line);
  const unfolded = ics.replace(/\r\n /g, "");
  assert.ok(unfolded.includes("äöü und einem sehr langen Titel"));
});

test("CSV schützt vor Formeln und maskiert Trennzeichen", () => {
  assert.equal(H.csvCell("=SUMME(A1)"), "'=SUMME(A1)");
  assert.equal(H.csvCell('a;b "c"'), '"a;b ""c"""');
  assert.equal(H.slug("Größe 50/56 Bodys"), "groesse-50-56-bodys");
});

test("ZIP: Sicherung schreiben und wieder lesen (auch komprimiert)", async () => {
  const enc = new TextEncoder();
  const files = [{name:"LIESMICH.txt", data: enc.encode("Hallo Nest")}, {name:"fotos/bild.jpg", data: new Uint8Array([1,2,3,250])}];
  const parts = H.buildZipParts(files, new Date(2026, 8, 25, 12, 0, 0));
  const bytes = new Uint8Array(await new Blob(parts).arrayBuffer());
  const out = await H.parseZip(bytes);
  assert.equal(new TextDecoder().decode(out["LIESMICH.txt"]), "Hallo Nest");
  assert.deepEqual(Array.from(out["fotos/bild.jpg"]), [1,2,3,250]);

  // Eine mit "deflate" gepackte Datei (z. B. nach Entpacken und neu Packen)
  const text = "unser-nest ".repeat(50);
  const raw = Buffer.from(text), comp = zlib.deflateRawSync(raw), name = Buffer.from("unser-nest-daten.json");
  const crc = H.crc32(new Uint8Array(raw));
  const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8);
  local.writeUInt32LE(crc, 14); local.writeUInt32LE(comp.length, 18); local.writeUInt32LE(raw.length, 22); local.writeUInt16LE(name.length, 26);
  const cd = Buffer.alloc(46); cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6); cd.writeUInt16LE(8, 10);
  cd.writeUInt32LE(crc, 16); cd.writeUInt32LE(comp.length, 20); cd.writeUInt32LE(raw.length, 24); cd.writeUInt16LE(name.length, 28); cd.writeUInt32LE(0, 42);
  const cdOff = 30 + name.length + comp.length;
  const eocd = Buffer.alloc(22); eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(1, 8); eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(46 + name.length, 12); eocd.writeUInt32LE(cdOff, 16);
  const zip = new Uint8Array(Buffer.concat([local, name, comp, cd, name, eocd]));
  const out2 = await H.parseZip(zip);
  assert.equal(new TextDecoder().decode(out2["unser-nest-daten.json"]), text);
});

test("Base64 hin und zurück", () => {
  const b = new Uint8Array(70000).map((_, i) => i % 256);
  assert.deepEqual(Array.from(H.base64ToBytes(H.bytesToBase64(b))), Array.from(b));
});

test("Maskieren und sichere Links", () => {
  assert.equal(H.esc('<img src=x onerror="a">'), "&lt;img src=x onerror=&quot;a&quot;&gt;");
  assert.equal(H.safeUrl("javascript:alert(1)"), "#");
  assert.equal(H.safeUrl("https://example.com"), "https://example.com");
});

test("Zusammenführen: eingefügter Punkt (z. B. „Rückgängig“) bleibt an seiner Stelle", () => {
  const base = doc([cat("c1","A",[item("i1","eins"), item("i3","drei")])]);
  const local = H.deepClone(base); local.categories[0].items.splice(1, 0, item("i2","zwei"));
  const remote = H.deepClone(base); remote.categories[0].items.push(item("r1","remote"));
  const ids = H.mergeChecklist(base, local, remote).categories[0].items.map(i => i.id);
  assert.deepEqual(plain(ids), ["i1","i2","i3","r1"]);
});

test("Version 1 speichert: Angaben von Version 2 werden wiederhergestellt", () => {
  const v2 = doc([cat("c1","A",[item("i1","eins",{wer:"uid-a"}), item("i2","zwei",{done:true, doneBy:"uid-b", doneAt:"2026-09-26"}), item("i3","drei",{done:true, doneBy:"uid-a"})])], {budget:"3000 €", birthDate:""});
  const extras = H.extrasFromState(v2);
  assert.deepEqual(plain(Object.keys(extras.items)), ["i1","i2","i3"]);
  // So sieht das Dokument aus, nachdem Version 1 gespeichert hat: neue Felder fehlen,
  // i3 wurde in Version 1 wieder "nicht erledigt", ein neuer Punkt kam dazu.
  const afterV1 = doc([cat("c1","A",[item("i1","eins"), item("i2","zwei",{done:true}), item("i3","drei",{done:false}), item("n1","neu aus v1")])]);
  const n = H.restoreV2Fields(afterV1, extras);
  const m = plain(afterV1);
  assert.equal(n, 3);
  assert.equal(m.categories[0].items[0].wer, "uid-a");
  assert.equal(m.categories[0].items[1].doneBy, "uid-b");
  assert.equal(m.categories[0].items[1].doneAt, "2026-09-26");
  assert.equal(m.categories[0].items[2].doneBy, undefined, "nicht mehr erledigt → kein 'erledigt von'");
  assert.equal(m.budget, "3000 €");
  assert.equal(m.categories[0].items[3].title, "neu aus v1");
});

test("Version 1 speichert: bewusst gelöschte Angaben kommen nicht zurück", () => {
  const v2 = doc([cat("c1","A",[item("i1","eins",{wer:""})])], {budget:""});
  const afterV1 = doc([cat("c1","A",[item("i1","eins")])]);
  assert.equal(H.restoreV2Fields(afterV1, H.extrasFromState(v2)), 0);
  assert.equal(H.restoreV2Fields(afterV1, null), 0);
});

test("Verschieben: ganz nach oben/unten und vor/hinter einen anderen Punkt", () => {
  const [a, b, c, d] = ["a", "b", "c", "d"].map((t) => ({t}));
  const names = (l) => l.map((x) => x.t).join("");
  const list = [a, b, c, d];
  assert.equal(H.placeEntry(list, c, "top"), true);      assert.equal(names(list), "cabd");
  assert.equal(H.placeEntry(list, c, "bottom"), true);   assert.equal(names(list), "abdc");
  assert.equal(H.placeEntry(list, a, {after: d}), true); assert.equal(names(list), "bdac");
  assert.equal(H.placeEntry(list, c, {before: b}), true); assert.equal(names(list), "cbda");
  assert.equal(H.placeEntry(list, b, {before: d}), false, "steht schon dort");
  assert.equal(H.placeEntry(list, b, {after: {t:"weg"}}), false, "Ziel nicht mehr da → bleibt stehen");
  assert.equal(names(list), "cbda");
  assert.equal(H.placeEntry(list, {t:"fremd"}, "top"), false);
  assert.equal(list.length, 4);
});

test("Verschieben: eins nach oben/unten überspringt ausgeblendete Punkte", () => {
  const [a, b, c, d] = ["a", "b", "c", "d"].map((t) => ({t}));
  const names = (l) => l.map((x) => x.t).join("");
  const list = [a, b, c, d];
  const visible = () => list.filter((x) => x !== b);   // b ist erledigt und ausgeblendet
  assert.equal(H.placeEntry(list, c, H.neighborMove(visible(), c, -1)), true);
  assert.equal(names(list), "cabd", "c steht jetzt vor a – sichtbar eine Stelle höher");
  assert.equal(H.neighborMove(visible(), c, -1), null, "erster sichtbarer Punkt");
  assert.equal(H.neighborMove(visible(), d, 1), null, "letzter sichtbarer Punkt");
  assert.equal(H.placeEntry(list, a, H.neighborMove(visible(), a, 1)), true);
  assert.equal(names(list), "cbda", "a springt über das ausgeblendete b hinter d");
});


// ---------- Verlauf: Änderungen erkennen und zurücknehmen ----------
const SPEC = () => H.CHECKLIST_SPEC;
// wie in der App: jeder Punkt hat "erledigt von/am" (leer, solange offen)
const it2 = (id, title) => item(id, title, {preis: "", doneBy: "", doneAt: ""});
function tree(){ return H.deepClone([
  cat("c1", "Klinik", [it2("i1", "eins"), it2("i2", "zwei"), it2("i3", "drei")]),
  cat("c2", "Behörden", [it2("i4", "vier")]),
  cat("c3", "Sonstiges", [])
]); }
const titles = (l) => l.map((c) => c.name + ":" + c.items.map((i) => i.title).join(",")).join(" | ");
// Änderung erkennen, zurücknehmen, und prüfen, dass wieder der alte Stand herauskommt
function roundTrip(change){
  const before = tree();
  const after = tree();
  change(after);
  const diff = H.diffTree(before, after, SPEC());
  const undone = H.deepClone(after);
  diff.slice().reverse().forEach((ch) => assert.equal(H.undoTreeChange(undone, ch, SPEC()).ok, true, JSON.stringify(ch)));
  assert.deepEqual(plain(undone), plain(before));
  return plain(diff);
}

test("Verlauf: Feldänderung wird erkannt und zurückgenommen", () => {
  const d = roundTrip((t) => { t[0].items[1].bisWann = "2026-11-15"; t[0].items[1].done = true; t[0].items[1].doneBy = "u1"; t[0].items[1].doneAt = "2026-10-18"; });
  assert.deepEqual(d.map((c) => c.op + ":" + c.field), ["kfield:done", "kfield:bisWann"]);
  const done = d.find((c) => c.field === "done");
  assert.equal(done.label, "zwei");
  assert.equal(done.plabel, "Klinik");
  assert.deepEqual(done.oldExtra, {doneBy: "", doneAt: ""});
  assert.deepEqual(done.newExtra, {doneBy: "u1", doneAt: "2026-10-18"});
});

test("Verlauf: gelöschter Punkt kommt an dieselbe Stelle zurück", () => {
  const d = roundTrip((t) => { t[0].items.splice(1, 1); });
  assert.deepEqual(d.map((c) => c.op), ["kdel"]);
  assert.equal(d[0].next, "i3");
  // auch wenn inzwischen oben ein Punkt dazukam
  const now = tree(); now[0].items.splice(1, 1); now[0].items.unshift(item("n1", "neu"));
  assert.equal(H.undoTreeChange(now, d[0], SPEC()).ok, true);
  assert.equal(titles(plain(now)).split(" | ")[0], "Klinik:neu,eins,zwei,drei");
});

test("Verlauf: neuer Punkt, Verschieben innerhalb und zwischen Kategorien", () => {
  assert.deepEqual(roundTrip((t) => { t[1].items.push(item("n1", "neu")); }).map((c) => c.op), ["kadd"]);
  const mv = roundTrip((t) => { const x = t[0].items.splice(0, 1)[0]; t[0].items.push(x); });
  assert.deepEqual(mv.map((c) => c.op + ":" + c.id + ":" + c.from + "→" + c.to), ["kmove:i1:0→2"]);
  const kc = roundTrip((t) => { const x = t[0].items.splice(1, 1)[0]; t[2].items.push(x); });
  assert.deepEqual(kc.map((c) => c.op + ":" + c.flabel + "→" + c.plabel), ["kcat:Klinik→Sonstiges"]);
});

test("Verlauf: Kategorien anlegen, löschen, umbenennen, verschieben", () => {
  const del = roundTrip((t) => { t.splice(0, 1); });
  assert.deepEqual(del.map((c) => c.op + ":" + c.count), ["del:3"], "Punkte stecken im Eintrag der Kategorie");
  assert.deepEqual(roundTrip((t) => { t.push(cat("c9", "Neu", [item("n2", "x")])); }).map((c) => c.op), ["add"]);
  assert.deepEqual(roundTrip((t) => { t[1].name = "Ämter"; }).map((c) => c.op + ":" + c.old + "→" + c.new), ["field:Behörden→Ämter"]);
  assert.deepEqual(roundTrip((t) => { t.push(t.shift()); }).map((c) => c.op + ":" + c.label), ["move:Klinik"]);
});

test("Verlauf: nichts überschreiben, was danach noch einmal geändert wurde", () => {
  const before = tree(), after = tree();
  after[0].items[0].preis = "50 €";
  const ch = H.diffTree(before, after, SPEC())[0];
  after[0].items[0].preis = "60 €"; // danach noch einmal geändert
  const r = H.undoTreeChange(after, ch, SPEC());
  assert.equal(r.ok, false);
  assert.equal(r.reason, "changed");
  assert.equal(r.current, "60 €");
  assert.equal(H.undoTreeChange(after, ch, SPEC(), true).ok, true, "mit Nachfrage (force) geht es");
  assert.equal(after[0].items[0].preis, "");
  // gelöschter Punkt ist schon wieder da → nichts doppelt einfügen
  const b2 = tree(), a2 = tree(); a2[1].items = [];
  const del = H.diffTree(b2, a2, SPEC())[0];
  assert.equal(H.undoTreeChange(b2, del, SPEC()).reason, "exists");
});

test("Verlauf: auch für die Kategorien der Baby-Kleidung", () => {
  const S = H.CLOTHING_CATS_SPEC;
  const before = [{key: "ober", name: "Oberteile", icon: "shirt", subs: [{key: "body", name: "Body"}, {key: "shirt", name: "Shirt"}]}];
  const after = H.deepClone(before);
  after[0].subs.reverse(); after[0].subs.push({key: "pulli", name: "Pulli"}); after[0].name = "Oben";
  const d = plain(H.diffTree(before, after, S));
  assert.deepEqual(d.map((c) => c.op).sort(), ["field", "kadd", "kmove"]);
  const undone = H.deepClone(after);
  d.slice().reverse().forEach((ch) => assert.equal(H.undoTreeChange(undone, ch, S).ok, true));
  assert.deepEqual(plain(undone), before);
});

test("Verlauf: Verschiebe-Erkennung meldet nur die bewegten Einträge", () => {
  assert.deepEqual(plain(H.movedIds(["a","b","c","d","e"], ["a","c","d","e","b"])), ["b"]);
  assert.deepEqual(plain(H.movedIds(["a","b","c"], ["a","b","c"])), []);
  assert.deepEqual(plain(H.movedIds(["a","b","c"], ["x","a","c"])), [], "neue/gelöschte zählen nicht als verschoben");
});

test("Verlauf: beim Tausch zweier Nachbarn gilt der gezogene Eintrag als verschoben", () => {
  assert.deepEqual(plain(H.movedIds(["a","b"], ["b","a"])), ["a"]);
  assert.deepEqual(plain(H.movedIds(["a","b"], ["b","a"], {b: true})), ["b"]);
  assert.deepEqual(plain(H.movedIds(["a","b","c","d"], ["a","d","b","c"], {d: true})), ["d"]);
});


// ---------- Notizen ----------
test("Notizen: angeheftete zuerst, dann die zuletzt geänderten", () => {
  const list = [{id: "a", updatedAt: 100}, {id: "b", updatedAt: 300}, {id: "c", updatedAt: 50, pinned: true}, {id: "d", createdAt: 200}];
  assert.deepEqual(plain(H.sortNotes(list)).map((n) => n.id), ["c", "b", "d", "a"]);
  assert.equal(list[0].id, "a", "Original bleibt unverändert");
});

test("Notizen: Suche über Titel und Text, Filter nach Bereich", () => {
  const n = {title: "Fragen an die Hebamme", text: "Partner-Kurs? Stillberatung", tag: "birth"};
  assert.equal(H.noteMatches(n, "", "all"), true);
  assert.equal(H.noteMatches(n, "hebamme kurs", "all"), true, "alle Wörter, beliebige Reihenfolge");
  assert.equal(H.noteMatches(n, "HEBAMME", "birth"), true, "Groß-/Kleinschreibung egal");
  assert.equal(H.noteMatches(n, "hebamme windeln", "all"), false);
  assert.equal(H.noteMatches(n, "", "names"), false, "anderer Bereich");
});

test("Notizen: Zeitangaben", () => {
  const now = new Date(2026, 10, 7, 15, 0); // Sa., 07.11.2026, 15:00
  const at = (d, h, m) => new Date(2026, 10, d, h, m).getTime();
  assert.equal(H.relTime(at(7, 14, 59) + 30000, now), "gerade eben");
  assert.equal(H.relTime(at(7, 14, 48), now), "vor 12 Min.");
  assert.equal(H.relTime(at(7, 9, 5), now), "heute 09:05");
  assert.equal(H.relTime(at(6, 22, 10), now), "gestern 22:10");
  assert.equal(H.relTime(at(2, 8, 0), now), "Mo., 02.11.");
  assert.equal(H.relTime(new Date(2025, 11, 24, 18, 0).getTime(), now), "24.12.2025");
});

test("Notizen: geänderte Zeilen für den Verlauf", () => {
  assert.deepEqual(plain(H.lineChanges("Windeln\nFeuchttücher", "Windeln\nFeuchttücher\nNagelschere")), {added: ["Nagelschere"], removed: []});
  assert.deepEqual(plain(H.lineChanges("A\nB\nC", "A\nC")), {added: [], removed: ["B"]});
  assert.deepEqual(plain(H.lineChanges("A\nB", "A\nB2")), {added: ["B2"], removed: ["B"]});
  assert.deepEqual(plain(H.lineChanges("", "Erste Zeile")), {added: ["Erste Zeile"], removed: []});
  assert.deepEqual(plain(H.lineChanges("A\nB", "B\nA")), {added: [], removed: []}, "nur umsortiert");
});
