const puppeteer = require("puppeteer-core");
const path = require("path");

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE_URL = "http://localhost:5173";
const API_BASE = "http://localhost:5000";
const OUTPUT_DIR = "c:\\Documents\\COLLEGE DOCUMENTS\\Semester 5\\AWDF\\Practical 10";

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
    console.log("Launching Microsoft Edge via puppeteer-core...");
    const browser = await puppeteer.launch({
        executablePath: EDGE_PATH,
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1366,880"]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 880, deviceScaleFactor: 1.5 });

    // Step 1: Open app, clear storage, register student
    console.log("1. Setting up fresh student account...");
    await page.goto(BASE_URL, { waitUntil: "networkidle0" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle0" });
    await sleep(600);

    // Switch to Register tab
    await page.click(".auth-tabs .auth-tab:last-child");
    await sleep(400);

    const testEmail = `samarth_p10_${Date.now()}@charusat.edu.in`;
    await page.type("#reg-name", "Samarth Kalavadia");
    await page.type("#auth-email", testEmail);
    await page.type("#auth-password", "Practical10EventsPass!");
    await page.click(".auth-submit-btn");
    await sleep(1500);

    // Step 2: Seed realistic tasks
    console.log("2. Adding realistic tasks for Practical 10...");
    const tasksToAdd = [
        {
            title: "Instantiate dedicated EventEmitter singleton (events.js)",
            desc: "Step 1: Subclass Node.js EventEmitter and export shared instance."
        },
        {
            title: "Register decoupled notification listener (listeners.js)",
            desc: "Step 2: Listen for task-created and log timestamped notification message."
        },
        {
            title: "Simulate 2-second background I/O delay (setTimeout)",
            desc: "Step 5: Decouple slow notification dispatch from main request-response cycle."
        },
        {
            title: "Implement task-deleted audit cleanup handler",
            desc: "Supplementary Problem 1: Register second custom event listener."
        }
    ];

    for (const t of tasksToAdd) {
        await page.type(".form-input", t.title);
        await page.type(".form-textarea", t.desc);
        await page.click(".submit-btn");
        await sleep(600);
    }

    // Wait for initial background listeners to conclude
    console.log("Waiting for background listener timers to settle...");
    await sleep(2500);

    // Screenshot 1: Dashboard Overview
    console.log("Capturing 01_dashboard_overview.png...");
    await page.screenshot({
        path: path.join(OUTPUT_DIR, "01_dashboard_overview.png"),
        fullPage: false
    });

    // Step 3: Create a task and immediately capture the instant response state
    console.log("3. Triggering task creation to capture instant response...");
    await page.type(".form-input", "Demonstrate Immediate API Response (<< 2000ms delay)");
    await page.type(".form-textarea", "Server responds with 201 before background listener completes.");
    await page.click(".submit-btn");
    await sleep(350); // Small pause to show notification banner while listener is in flight

    console.log("Capturing 02_instant_api_response_vs_background_listener.png...");
    await page.screenshot({
        path: path.join(OUTPUT_DIR, "02_instant_api_response_vs_background_listener.png"),
        fullPage: false
    });

    // Wait for listener to complete
    await sleep(2200);

    // Step 4: Delete a task to trigger 'task-deleted' event
    console.log("4. Deleting a task to trigger task-deleted event...");
    const deleteButtons = await page.$$(".delete-btn");
    if (deleteButtons.length > 0) {
        await deleteButtons[deleteButtons.length - 1].click();
        await sleep(1800); // Allow task-deleted listener to complete
    }

    console.log("Capturing 04_task_deleted_event_evidence.png...");
    await page.screenshot({
        path: path.join(OUTPUT_DIR, "04_task_deleted_event_evidence.png"),
        fullPage: false
    });

    // Step 5: Test error listener by clicking "Test Error Event Listener" button
    console.log("5. Triggering error listener simulation...");
    await page.click(".quick-action-btn.danger");
    await sleep(2400); // Wait for error to be caught by taskEvents.on('error')

    // Switch to Async Event Stream tab
    console.log("6. Switching to Async Event Stream tab...");
    await page.click(".header-nav .nav-tab-btn:nth-child(2)");
    await sleep(800);

    console.log("Capturing 03_event_timeline_and_audit_stream.png...");
    await page.screenshot({
        path: path.join(OUTPUT_DIR, "03_event_timeline_and_audit_stream.png"),
        fullPage: false
    });

    console.log("Capturing 05_async_error_listener_caught.png...");
    await page.screenshot({
        path: path.join(OUTPUT_DIR, "05_async_error_listener_caught.png"),
        fullPage: false
    });

    // Step 6: Switch to Stopwatch Benchmark tab
    console.log("7. Switching to Stopwatch Benchmark tab...");
    await page.click(".header-nav .nav-tab-btn:nth-child(3)");
    await sleep(600);

    console.log("Running Live Verification Benchmark...");
    await page.click(".run-bench-btn");
    await sleep(2600); // Wait for benchmark execution and listener resolution

    console.log("Capturing 06_stopwatch_benchmark_proof.png...");
    await page.screenshot({
        path: path.join(OUTPUT_DIR, "06_stopwatch_benchmark_proof.png"),
        fullPage: false
    });

    // Step 7: Switch to Viva & Theory tab
    console.log("8. Switching to Viva & Theory tab...");
    await page.click(".header-nav .nav-tab-btn:nth-child(4)");
    await sleep(600);

    console.log("Capturing 07_viva_analysis_and_theory.png...");
    await page.screenshot({
        path: path.join(OUTPUT_DIR, "07_viva_analysis_and_theory.png"),
        fullPage: false
    });

    await browser.close();
    console.log("All UI screenshots captured successfully!");
}

capture().catch((err) => {
    console.error("Error capturing screenshots:", err);
    process.exit(1);
});
