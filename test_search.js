const axios = require("axios");
const cheerio = require("cheerio");

async function testSearch() {
  try {
    console.log("Testing FEMA search with specific URL...");

    const searchUrl =
      "https://search.usa.gov/search?affiliate=fema&query=nyc+flood";
    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    console.log("Page title:", $("title").text());

    // Try multiple selectors for FEMA search results
    const selectors = [
      ".search-result",
      ".SearchResults-item",
      "li.result",
      "div.search-results__item",
      ".result",
      "article",
      ".content-item",
      'div[class*="search"]',
      'div[class*="result"]',
    ];

    console.log("\nChecking different selectors:");
    selectors.forEach((selector) => {
      const count = $(selector).length;
      console.log(`${selector}: ${count} elements found`);

      if (count > 0 && count < 20) {
        console.log(
          `  First element HTML:`,
          $(selector).first().html().substring(0, 300) + "..."
        );
      }
    });

    // Look for any links with meaningful text
    console.log("\nAll links with meaningful text (first 10):");
    $("a").each((i, el) => {
      if (i < 10) {
        const text = $(el).text().trim();
        const href = $(el).attr("href");
        if (text && href && text.length > 5 && text.length < 100) {
          console.log(`  ${text} -> ${href}`);
        }
      }
    });

    // Look for any text that might be search results
    console.log("\nLooking for potential result text:");
    $("p, div, span").each((i, el) => {
      const text = $(el).text().trim();
      if (
        text.length > 20 &&
        text.length < 200 &&
        (text.toLowerCase().includes("nyc") ||
          text.toLowerCase().includes("flood") ||
          text.toLowerCase().includes("disaster"))
      ) {
        console.log(`  Found relevant text: ${text.substring(0, 100)}...`);
      }
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
}

async function testFemaApi() {
  try {
    console.log("Testing FEMA API...");

    // Test 1: Get recent disasters
    const recentDisastersUrl =
      "https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$top=5&$orderby=incidentBeginDate desc";
    console.log(`Testing URL: ${recentDisastersUrl}`);

    const response = await axios.get(recentDisastersUrl, {
      headers: {
        "User-Agent": "DisasterResponseApp/1.0",
        Accept: "application/json",
      },
      timeout: 10000,
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers["content-type"]);

    if (response.data && response.data.DisasterDeclarationsSummaries) {
      const disasters = response.data.DisasterDeclarationsSummaries;
      console.log(`\nFound ${disasters.length} recent disasters:`);

      disasters.forEach((disaster, index) => {
        console.log(
          `\n${index + 1}. ${disaster.title || disaster.incidentType}`
        );
        console.log(`   Disaster #: ${disaster.disasterNumber}`);
        console.log(`   State: ${disaster.state}`);
        console.log(`   Type: ${disaster.incidentType}`);
        console.log(`   Date: ${disaster.incidentBeginDate}`);
        console.log(
          `   Link: https://www.fema.gov/disaster/${disaster.disasterNumber}`
        );
      });
    } else {
      console.log("No disaster data found in response");
      console.log("Response data:", JSON.stringify(response.data, null, 2));
    }

    // Test 2: Get specific disaster type (Fire)
    console.log("\n\nTesting Fire disasters...");
    const fireDisastersUrl =
      "https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$filter=incidentType eq 'Fire'&$top=3&$orderby=incidentBeginDate desc";

    const fireResponse = await axios.get(fireDisastersUrl, {
      headers: {
        "User-Agent": "DisasterResponseApp/1.0",
        Accept: "application/json",
      },
      timeout: 10000,
    });

    if (fireResponse.data && fireResponse.data.DisasterDeclarationsSummaries) {
      const fireDisasters = fireResponse.data.DisasterDeclarationsSummaries;
      console.log(`\nFound ${fireDisasters.length} fire disasters:`);

      fireDisasters.forEach((disaster, index) => {
        console.log(
          `\n${index + 1}. ${disaster.title || disaster.incidentType}`
        );
        console.log(`   Disaster #: ${disaster.disasterNumber}`);
        console.log(`   State: ${disaster.state}`);
        console.log(`   Date: ${disaster.incidentBeginDate}`);
      });
    }
  } catch (error) {
    console.error("Error testing FEMA API:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

testSearch();
testFemaApi();
