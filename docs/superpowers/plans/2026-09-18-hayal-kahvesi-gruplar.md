# Hayal Kahvesi Gruplar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mevcut Puantaj uygulamasını Personel, Sanatçı ve Güvenlik gruplarını destekleyecek şekilde genişletmek; Personel sistemini koruyup Sanatçı/Güvenlik için günlük ücret esaslı ödeme akışı eklemek.

**Architecture:** Mevcut Electron/HTML uygulaması korunur. Saf hesaplama ve grup normalizasyonu `group-utils.js` içinde tutulur; DOM değişiklikleri `groups-patch.js` ile mevcut uygulamaya eklenir. Eski çalışanlarda `group` yoksa `personel` kabul edilir ve tüm kayıtlar `data.json` üzerinden devam eder.

**Tech Stack:** Electron, HTML/CSS/vanilla JavaScript, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-18-hayal-kahvesi-gruplar-design.md`

## Global Constraints
- Personel mevcut saatlik ve mesaili sistemi aynen korur.
- Sanatçı: günlük Sahne Ücreti; Net Ödeme = Toplam Sahne Ücreti - Maaş - Avans.
- Güvenlik: günlük Günlük Ücret; Net Ödeme = Toplam Günlük Ücret - Maaş - Avans.
- Eski verilerde grup yoksa Personel kabul edilir.
- Veri dosyası `data.json`, uygulama dosyası `Puantaj.exe` olarak paketlenir.
- Program arayüz adı `Hayal Kahvesi Puantaj` olur.

---

### Task 1: Saf grup ve ödeme hesapları

**Files:**
- Create: `puantaj-desktop/app/group-utils.js`
- Create: `puantaj-desktop/tests/group-utils.test.js`

**Interfaces:**
- Produces: `normalizeGroup(value)`, `feeLabel(group)`, `calculateDailyPayment(totalFees, salary, advance)`.

- [ ] **Step 1: Write failing tests** for missing group => personel, sanatçı/güvenlik labels and net payment subtraction.
- [ ] **Step 2: Run `npm test` and verify failure.**
- [ ] **Step 3: Implement minimal pure functions.**
- [ ] **Step 4: Run `npm test` and verify pass.**
- [ ] **Step 5: Commit.**

### Task 2: Group-aware UI and storage

**Files:**
- Create: `puantaj-desktop/app/groups-patch.js`
- Modify: `puantaj-desktop/app/main-patched.js`
- Modify: `puantaj-desktop/app/style.css`
- Create: `puantaj-desktop/tests/groups-ui.test.js`

**Interfaces:**
- Consumes: `HayalGroupUtils` global from Task 1.
- Produces: three-group selector, daily fee grids for Sanatçı/Güvenlik, group-aware summary and accounting views, add-person group selector.

- [ ] **Step 1: Write failing UI/source assertions** for three group buttons, Sahne Ücreti/Günlük Ücret, highlighted fee inputs and title.
- [ ] **Step 2: Run tests and verify failure.**
- [ ] **Step 3: Implement `groups-patch.js`** to default existing employees to Personel, maintain `dailyFees`, render fee grids, summaries and accounting formula, and persist via existing `save()`/`saveSalaryVault()`.
- [ ] **Step 4: Update title and CSS highlight.**
- [ ] **Step 5: Load group scripts from `main-patched.js`.**
- [ ] **Step 6: Run full test suite.**
- [ ] **Step 7: Commit.**

### Task 3: Build and package

**Files:**
- Modify only if needed: `puantaj-desktop/package.json`

**Interfaces:**
- Produces Windows portable EXE artifact.

- [ ] **Step 1: Run GitHub Windows build.**
- [ ] **Step 2: Verify tests and build succeed.**
- [ ] **Step 3: Download artifact.**
- [ ] **Step 4: Package a single `Puantaj/` folder containing exactly `Puantaj.exe` and `data.json`.**
