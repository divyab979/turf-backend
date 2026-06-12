import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  try {
    const signupData = {
      email: "testlock@example.com",
      password: "Password123!",
      name: "Test Lock User",
      role: "CUSTOMER"
    };

    console.log("1. Creating/Ensuring test user account...");
    // If user already exists, we will delete it so we can sign up fresh
    await prisma.user.deleteMany({
      where: { email: signupData.email }
    });

    // Make signup REST call
    const signupResponse = await fetch("http://localhost:4000/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signupData)
    });

    if (!signupResponse.ok) {
      const errText = await signupResponse.text();
      console.error("Signup failed:", errText);
      process.exit(1);
    }
    console.log("Signup successful!");

    console.log("2. Logging in to retrieve JWT access token...");
    const loginResponse = await fetch("http://localhost:4000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: signupData.email,
        password: signupData.password
      })
    });

    if (!loginResponse.ok) {
      const errText = await loginResponse.text();
      console.error("Login failed:", errText);
      process.exit(1);
    }

    const { access_token } = (await loginResponse.json()) as any;
    console.log("Login successful! Retrieved access token.");

    console.log("3. Querying / creating available slot in database...");
    // Let's find first slot or create one if none exists
    let slot = await prisma.slot.findFirst();
    if (!slot) {
      console.log("No slots found. Finding a turf to attach test slot...");
      const turf = await prisma.turf.findFirst();
      if (!turf) {
        console.error("No turf found. Cannot create slot for testing. Please add a venue and turf first.");
        process.exit(1);
      }
      slot = await prisma.slot.create({
        data: {
          turfId: turf.id,
          date: new Date().toISOString().substring(0, 10),
          startTime: "09:00",
          endTime: "10:00",
          duration: 60,
          price: 1500,
          status: "AVAILABLE",
        }
      });
      console.log(`Created fresh slot with ID: ${slot.id}`);
    } else {
      console.log(`Using slot ID: ${slot.id} (${slot.startTime} - ${slot.endTime})`);
    }

    // Clean up any existing lock or booking for this slot to ensure a clean lock
    await prisma.booking.deleteMany({ where: { slotId: slot.id } });
    await prisma.slotLock.deleteMany({ where: { slotId: slot.id } });

    console.log("4. Testing POST /bookings/lock API endpoint...");
    const lockResponse = await fetch("http://localhost:4000/bookings/lock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`
      },
      body: JSON.stringify({
        slotId: slot.id
      })
    });

    const status = lockResponse.status;
    const data = await lockResponse.json();

    console.log("\n=================================");
    console.log(`API response status: ${status}`);
    console.log("API response payload:", JSON.stringify(data, null, 2));
    console.log("=================================");

    if (status === 201) {
      console.log("🎉 SUCCESS! Slot successfully locked end-to-end on the backend!");
    } else {
      console.error("❌ FAILED! Lock slot API returned an error.");
    }

  } catch (e: any) {
    console.error("Unhandled error:", e.message || e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
