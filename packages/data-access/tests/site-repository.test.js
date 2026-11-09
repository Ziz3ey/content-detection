const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const {
  createDataAccess,
  SiteDataAccessError,
  SiteDataValidationError,
} = require("../src");

let temporaryDirectory;
let databasePath;
let dataAccess;

function sampleSite(overrides = {}) {
  return {
    name: "Dinas Kominfo Sumbawa",
    url: "https://kominfo.sumbawakab.go.id/",
    status: "active",
    maxDepth: 2,
    maxPages: 30,
    baselineHtml: "<html><head><title>Kominfo</title></head><body>Resmi</body></html>",
    ...overrides,
  };
}

before(() => {
  temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "content-detection-site-test-"),
  );
  databasePath = path.join(temporaryDirectory, "test-sites.sqlite");
  dataAccess = createDataAccess(databasePath);
});

beforeEach(() => {
  dataAccess.database.exec("DELETE FROM sites");
});

after(() => {
  dataAccess.close();
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

test("creates a site with unique ID, allowedHost, and default status", () => {
  const created = dataAccess.sites.create(sampleSite());

  assert.equal(typeof created.id, "string");
  assert.equal(created.name, "Dinas Kominfo Sumbawa");
  assert.equal(created.url, "https://kominfo.sumbawakab.go.id/");
  assert.equal(created.allowedHost, "kominfo.sumbawakab.go.id");
  assert.equal(created.status, "active");
  assert.equal(created.maxDepth, 2);
  assert.equal(created.maxPages, 30);
  assert.equal(typeof created.createdAt, "string");
  assert.equal(typeof created.updatedAt, "string");
});

test("updates an existing site including status toggle and settings", () => {
  const created = dataAccess.sites.create(sampleSite());
  const updated = dataAccess.sites.update(created.id, {
    status: "inactive",
    maxDepth: 3,
    maxPages: 50,
    name: "Dinas Kominfo Baru",
  });

  assert.equal(updated.id, created.id);
  assert.equal(updated.status, "inactive");
  assert.equal(updated.maxDepth, 3);
  assert.equal(updated.maxPages, 50);
  assert.equal(updated.name, "Dinas Kominfo Baru");

  const toggled = dataAccess.sites.update(created.id, {
    status: "active",
  });
  assert.equal(toggled.status, "active");
});

test("deletes a site by ID", () => {
  const created = dataAccess.sites.create(sampleSite());
  const deleted = dataAccess.sites.deleteById(created.id);
  assert.equal(deleted, true);

  const found = dataAccess.sites.findById(created.id);
  assert.equal(found, null);
});

test("filters sites by status", () => {
  dataAccess.sites.create(sampleSite({ url: "https://site1.sumbawakab.go.id/", status: "active" }));
  dataAccess.sites.create(sampleSite({ url: "https://site2.sumbawakab.go.id/", status: "inactive" }));

  const all = dataAccess.sites.findAll();
  assert.equal(all.length, 2);

  const active = dataAccess.sites.findAll("active");
  assert.equal(active.length, 1);
  assert.equal(active[0].status, "active");

  const inactive = dataAccess.sites.findAll("inactive");
  assert.equal(inactive.length, 1);
  assert.equal(inactive[0].status, "inactive");
});

test("rejects invalid site URL or missing name", () => {
  assert.throws(
    () => dataAccess.sites.create(sampleSite({ name: "   " })),
    SiteDataValidationError,
  );
  assert.throws(
    () => dataAccess.sites.create(sampleSite({ url: "not-a-valid-url" })),
    SiteDataValidationError,
  );
  assert.throws(
    () => dataAccess.sites.create(sampleSite({ maxDepth: 99 })),
    SiteDataValidationError,
  );
});
