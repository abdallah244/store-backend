const http = require("http");

// Test the API endpoint
const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/feedback/user/6939768c6f39299ec0ba5b54", // ahmed's user ID
  method: "GET",
};

const req = http.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("Status Code:", res.statusCode);
    console.log("Response:", data);
    try {
      const parsed = JSON.parse(data);
      console.log("\nParsed feedbacks count:", parsed.length);
      if (parsed.length > 0) {
        console.log("\nFirst feedback:");
        console.log(JSON.stringify(parsed[0], null, 2));
      }
    } catch (e) {
      console.error("Failed to parse JSON");
    }
  });
});

req.on("error", (error) => {
  console.error("Error:", error);
});

req.end();
