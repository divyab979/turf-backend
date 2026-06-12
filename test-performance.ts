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

function runAutocannon(options: autocannon.Options): Promise<autocannon.Result> {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Starting Load Test on: ${options.method || 'GET'} ${options.url}`);
    console.log(`   Connections: ${options.connections} | Duration: ${options.duration}s`);
    
    autocannon(options, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function printReport(title: string, result: autocannon.Result) {
  console.log(`\n==================================================`);
  console.log(`📊 REPORT: ${title}`);
  console.log(`==================================================`);
  console.log(`Total Requests:      ${result.requests.total}`);
  console.log(`Duration:            ${result.duration}s`);
  console.log(`Errors (Non-2xx):    ${result.non2xx}`);
  console.log(`--------------------------------------------------`);
  console.log(`Throughput (Req/sec): ${result.requests.average}`);
  console.log(`Transfer Rate (MB/s): ${(result.throughput.average / 1024 / 1024).toFixed(2)}`);
  console.log(`--------------------------------------------------`);
  console.log(`Latency (ms):`);
  console.log(`  Min:               ${result.latency.min}`);
  console.log(`  Average:           ${result.latency.average}`);
  console.log(`  97.5%:             ${result.latency.p97_5}`);
  console.log(`  99%:               ${result.latency.p99}`);
  console.log(`  Max:               ${result.latency.max}`);
  console.log(`==================================================\n`);
}

async function main() {
  let token: string = "";
  try {
    token = await getAuthToken();
    console.log("JWT token retrieved successfully.");
  } catch (err: any) {
    console.error("❌ Failed to setup authentication. Proceeding with public endpoints only.", err.message || err);
  }

  try {
    // 1. Test POST /auth/login (Unauthenticated write/read)
    const loginTest = await runAutocannon({
      url: `${BACKEND_URL}/auth/login`,
      method: 'POST',
      connections: 100,
      duration: 5,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: "perf-test-user@example.com",
        password: "Password123!"
      })
    });
    printReport("POST /auth/login (Unauthenticated)", loginTest);

    if (token) {
      // 2. Test GET /auth/me (Authenticated database/JWT read)
      const authMeTest = await runAutocannon({
        url: `${BACKEND_URL}/auth/me`,
        method: 'GET',
        connections: 100,
        duration: 5,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      printReport("GET /auth/me (Authenticated)", authMeTest);

      // 3. Test GET /venues (Authenticated database query)
      const venuesTest = await runAutocannon({
        url: `${BACKEND_URL}/venues`,
        method: 'GET',
        connections: 100,
        duration: 5,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      printReport("GET /venues (Authenticated Database Query)", venuesTest);
    }

  } catch (err: any) {
    console.error("❌ Error running performance tests:", err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
