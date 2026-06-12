import { PrismaClient } from '@prisma/client';
import autocannon from 'autocannon';

const prisma = new PrismaClient();
const BACKEND_URL = "http://localhost:4000";

async function getAuthToken(): Promise<string> {
  const signupData = {
    email: "perf-test-user@example.com",
    password: "Password123!",
    name: "Performance Test User"
  };

  console.log("Checking if performance test user exists...");
  const existingUser = await prisma.user.findUnique({
    where: { email: signupData.email }
  });

  if (!existingUser) {
    console.log("Creating fresh performance test user...");
    // Sign up via endpoint
    const signupResponse = await fetch(`${BACKEND_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...signupData,
        role: "CUSTOMER"
      })
    });
    if (!signupResponse.ok) {
      throw new Error(`Signup failed with status ${signupResponse.status}: ${await signupResponse.text()}`);
    }
  }

  console.log("Logging in to retrieve JWT access token...");
  const loginResponse = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: signupData.email,
      password: signupData.password
    })
  });

  if (!loginResponse.ok) {
    throw new Error(`Login failed with status ${loginResponse.status}: ${await loginResponse.text()}`);
  }

  const { access_token } = (await loginResponse.json()) as any;
  return access_token;
}

async function prepareTestSlot(): Promise<string> {
  console.log("Locating / creating an available slot in database...");
  let slot = await prisma.slot.findFirst();
  if (!slot) {
    console.log("No slots found. Finding a turf to attach test slot...");
    const turf = await prisma.turf.findFirst();
    if (!turf) {
      throw new Error("No turf found in database. Cannot create slot for testing.");
    }
    slot = await prisma.slot.create({
      data: {
        turfId: turf.id,
        date: new Date(),
        startTime: "09:00",
        endTime: "10:00",
        duration: 60,
        price: 1500,
        status: "AVAILABLE",
      }
    });
  }

  console.log(`Using slot ID: ${slot.id}. Cleaning existing bookings/locks...`);
  // Clean up any existing lock or booking for this slot to ensure a clean lock
  await prisma.booking.deleteMany({ where: { slotId: slot.id } });
  await prisma.slotLock.deleteMany({ where: { slotId: slot.id } });

  return slot.id;
}

function runAutocannon(options: autocannon.Options): Promise<autocannon.Result> {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Launching Concurrent Lock Requests on: ${options.url}`);
    
    autocannon(options, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function printLockReport(result: autocannon.Result) {
  console.log(`\n==================================================`);
  console.log(`📊 CONCURRENT LOCKS REPORT`);
  console.log(`==================================================`);
  console.log(`Total Requests Sent:   ${result.requests.total}`);
  console.log(`Successes (2xx):       ${result.requests.total - result.non2xx}`);
  console.log(`Failures/Blocked (4xx):${result.non2xx}`);
  console.log(`--------------------------------------------------`);
  console.log(`Throughput (Req/sec):   ${result.requests.average}`);
  console.log(`Latency (ms):`);
  console.log(`  Average:             ${result.latency.average} ms`);
  console.log(`  Max:                 ${result.latency.max} ms`);
  console.log(`==================================================\n`);
}

async function main() {
  try {
    const token = await getAuthToken();
    const slotId = await prepareTestSlot();

    // Fire 20 concurrent requests in 1 second to lock the same slotId
    const lockTest = await runAutocannon({
      url: `${BACKEND_URL}/bookings/lock`,
      method: 'POST',
      connections: 20,
      amount: 20, // Send exactly 20 requests total
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        slotId: slotId
      })
    });

    printLockReport(lockTest);

  } catch (err: any) {
    console.error("❌ Concurrency test failed:", err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
