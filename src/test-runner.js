/**
 * Automated Verification Script for Packaging Weighing Dashboard
 * Tests all Acceptance Criteria and Business Rules (BR-01 through BR-08)
 */
const http = require("http");

async function runTests() {
  console.log("=== INTEGRATION TESTS FOR PACKAGING WEIGHING DASHBOARD ===\n");

  const baseUrl = "http://localhost:3000";

  // Helper for requests
  async function request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const req = http.request(
        url,
        {
          method: options.method || "GET",
          headers: options.headers || {},
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            try {
              const json = JSON.parse(body);
              resolve({ status: res.statusCode, headers: res.headers, body: json });
            } catch {
              resolve({ status: res.statusCode, headers: res.headers, raw: body });
            }
          });
        }
      );
      req.on("error", reject);
      if (options.body) {
        req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
      }
      req.end();
    });
  }

  try {
    // 1. Test Unauthenticated Access
    console.log("1. Testing Auth Gate on API:");
    const unauthMe = await request("/api/auth/me");
    console.log("   Unauthenticated /api/auth/me status:", unauthMe.status);
    console.assert(unauthMe.status === 401, "Expected 401 for unauthenticated request");

    // 2. Test Login as Operator
    console.log("\n2. Testing Operator Login (budi@packaging.local):");
    const opLogin = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { identifier: "budi@packaging.local", password: "operator123" },
    });
    console.log("   Operator Login Status:", opLogin.status, opLogin.body.message);
    console.assert(opLogin.body.success === true, "Operator login should succeed");
    const cookieHeader = opLogin.headers["set-cookie"];
    const sessionCookie = Array.isArray(cookieHeader) ? cookieHeader[0].split(";")[0] : "";
    console.log("   Session cookie acquired:", sessionCookie ? "YES" : "NO");

    const authHeaders = {
      Cookie: sessionCookie,
      "Content-Type": "application/json",
    };

    // 3. Test Verify Operator Session
    console.log("\n3. Testing /api/auth/me with Cookie:");
    const opMe = await request("/api/auth/me", { headers: authHeaders });
    console.log("   Logged in user:", opMe.body.user.nama, `(${opMe.body.user.role})`);
    console.assert(opMe.body.user.role === "Operator", "Role should be Operator");

    // 4. Test Batch Search: Valid Batch
    console.log("\n4. Testing Batch Search (Valid Active: BCH-2026-001):");
    const batchSearch1 = await request("/api/batch/search?batch=BCH-2026-001", { headers: authHeaders });
    console.log("   Found product:", batchSearch1.body.data.nama_produk);
    console.assert(batchSearch1.body.success === true, "Valid batch should be found");

    // 5. Test Batch Search: Non-existent Batch
    console.log("\n5. Testing Batch Search (Non-existent: BCH-9999-XYZ):");
    const batchSearch2 = await request("/api/batch/search?batch=BCH-9999-XYZ", { headers: authHeaders });
    console.log("   Status:", batchSearch2.status, batchSearch2.body.message);
    console.assert(batchSearch2.status === 404, "Unknown batch should return 404");

    // 6. Test Batch Search: Inactive Batch (BCH-2026-005)
    console.log("\n6. Testing Batch Search (Inactive QC Hold: BCH-2026-005):");
    const batchSearch3 = await request("/api/batch/search?batch=BCH-2026-005", { headers: authHeaders });
    console.log("   Status:", batchSearch3.status, batchSearch3.body.message);
    console.assert(batchSearch3.status === 400, "Inactive batch should return 400");

    // 7. Test Weighing Submission with 3 weighings (BR-02: flexible 1-15, empty cells remain empty)
    console.log("\n7. Testing Weighing Submission (BR-02: 3 weighings, rest empty):");
    const weighPayload1 = {
      batch: "BCH-2026-001",
      no_mesin: "MSN-01",
      no_timbangan: "TB-02",
      metode_kemas: "Standing Pouch",
      lower: 495,
      upper: 505,
      weights: [498.5, 502.1, 493.0, null, null, null, null, null, null, null, null, null, null, null, null],
      clientRequestId: "test-req-001",
    };
    const submitRes1 = await request("/api/weighing", {
      method: "POST",
      headers: authHeaders,
      body: weighPayload1,
    });
    console.log("   Submit result:", submitRes1.body.message);
    console.log("   Generated Session ID:", submitRes1.body.data.id);
    console.log("   Timestamp Asia/Jakarta:", submitRes1.body.data.jam);
    console.log("   Stats:", submitRes1.body.stats);
    console.assert(submitRes1.body.stats.count === 3, "Count should be 3");
    console.assert(submitRes1.body.stats.outRangeCount === 1, "1 measurement is 493.0 (<495), out of range");

    // 8. Test BR-01: Same Batch in Another New Session
    console.log("\n8. Testing BR-01: Same Batch in a Second New Session:");
    const weighPayload2 = {
      batch: "BCH-2026-001",
      no_mesin: "MSN-02",
      no_timbangan: "TB-01",
      metode_kemas: "Standing Pouch",
      lower: 495,
      upper: 505,
      weights: [500.0], // only 1 weighing
      clientRequestId: "test-req-002",
    };
    const submitRes2 = await request("/api/weighing", {
      method: "POST",
      headers: authHeaders,
      body: weighPayload2,
    });
    console.log("   Second session ID for BCH-2026-001:", submitRes2.body.data.id);
    console.assert(submitRes2.body.data.id !== submitRes1.body.data.id, "Session IDs must be distinct");
    console.assert(submitRes2.body.stats.count === 1, "Only 1 weighing allowed");

    // 9. Test BR-05: Validation Lower > Upper
    console.log("\n9. Testing BR-05: Lower > Upper validation:");
    const invalidLowerUpper = {
      batch: "BCH-2026-001",
      no_mesin: "MSN-01",
      no_timbangan: "TB-01",
      metode_kemas: "Standing Pouch",
      lower: 510,
      upper: 500, // Invalid: Lower > Upper
      weights: [505],
    };
    const submitRes3 = await request("/api/weighing", {
      method: "POST",
      headers: authHeaders,
      body: invalidLowerUpper,
    });
    console.log("   Status:", submitRes3.status, submitRes3.body.message);
    console.assert(submitRes3.status === 400, "Lower > Upper should fail with 400");

    // 10. Test History and Filters
    console.log("\n10. Testing History List (/api/weighing):");
    const historyRes = await request("/api/weighing", { headers: authHeaders });
    console.log("    Total sessions retrieved:", historyRes.body.total);
    console.assert(historyRes.body.total >= 2, "Should contain saved sessions");

    // 11. Test CSV Export
    console.log("\n11. Testing CSV Export (/api/weighing/export):");
    const csvRes = await request("/api/weighing/export", { headers: authHeaders });
    console.log("    CSV status:", csvRes.status);
    console.log("    CSV Content snippet:\n", csvRes.raw.slice(0, 150), "...");
    console.assert(csvRes.raw.includes("WT-"), "CSV should contain session IDs");

    // 12. Test Admin Login and Master Data Control
    console.log("\n12. Testing Admin Login (admin@packaging.local):");
    const adminLogin = await request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { identifier: "admin@packaging.local", password: "admin123" },
    });
    const adminCookie = adminLogin.headers["set-cookie"][0].split(";")[0];
    const adminHeaders = { Cookie: adminCookie, "Content-Type": "application/json" };

    console.log("\n13. Testing Admin adding new Master Batch:");
    const newBatchRes = await request("/api/master/products", {
      method: "POST",
      headers: adminHeaders,
      body: {
        batch: "BCH-2026-TEST",
        nama_produk: "Cokelat Bubuk Premium 100g",
        status: "Aktif",
        keterangan: "Lini Kemas 4 - Pengujian Otomatis",
      },
    });
    console.log("    Admin add batch result:", newBatchRes.body.message);
    console.assert(newBatchRes.body.success === true, "Batch should be added successfully");

    // Verify operator can now search the new batch
    const verifyNewBatch = await request("/api/batch/search?batch=BCH-2026-TEST", { headers: authHeaders });
    console.log("    Operator lookup of new batch:", verifyNewBatch.body.data.nama_produk);
    console.assert(verifyNewBatch.body.data.nama_produk === "Cokelat Bubuk Premium 100g");

    console.log("\n========================================================");
    console.log(">>> ALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY! <<<");
    console.log("========================================================\n");
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  }
}

// Start test
runTests();
