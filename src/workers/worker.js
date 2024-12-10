export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    console.log(`Request received for: ${url.pathname}`);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Origin",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Handle API routes
    if (url.pathname.startsWith("/api/")) {
      try {
        // Config endpoint
        if (url.pathname === "/api/config") {
          console.log("Config request received:", {
            clientId: env.GOOGLE_CLIENT_ID ? "present" : "missing",
            apiKey: env.GOOGLE_API_KEY ? "present" : "missing",
          });

          return new Response(
            JSON.stringify({
              clientId: env.GOOGLE_CLIENT_ID,
            }),
            {
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers":
                  "Content-Type, Authorization, Origin",
              },
            },
          );
        }

        // URL proxy endpoint
        if (url.pathname === "/api/proxy" && request.method === "POST") {
          try {
            const { url: targetUrl } = await request.json();

            // Fetch the target URL
            // replace `website` with your domain name
            const response = await fetch(targetUrl, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (compatible; GreaterBot/1.0; +https://website)",
              },
            });

            // Get text content
            const text = await response.text();

            return new Response(JSON.stringify({ content: text }), {
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
              },
            });
          } catch (error) {
            return new Response(
              JSON.stringify({
                error: "Failed to fetch URL",
                details: error.message,
              }),
              {
                status: 500,
                headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                },
              },
            );
          }
        }

        // Sheets create endpoint
        if (
          url.pathname === "/api/sheets/create" &&
          request.method === "POST"
        ) {
          const { title, headers } = await request.json();

          const response = await fetch(
            "https://sheets.googleapis.com/v4/spreadsheets",
            {
              method: "POST",
              headers: {
                Authorization: request.headers.get("Authorization"),
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                properties: { title },
                sheets: headers,
              }),
            },
          );

          const result = await response.text();
          return new Response(result, {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Headers":
                "Content-Type, Authorization, Origin",
            },
          });
        }

        // Sheets update endpoint
        if (
          url.pathname === "/api/sheets/update" &&
          request.method === "POST"
        ) {
          const { spreadsheetId, range, values } = await request.json();

          const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
            {
              method: "PUT",
              headers: {
                Authorization: request.headers.get("Authorization"),
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ values }),
            },
          );

          const result = await response.text();
          return new Response(result, {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Headers":
                "Content-Type, Authorization, Origin",
            },
          });
        }

        // Language API endpoint
        if (
          url.pathname === "/api/language/analyze" &&
          request.method === "POST"
        ) {
          const { content } = await request.json();

          const response = await fetch(
            "https://language.googleapis.com/v1/documents:analyzeEntities",
            {
              method: "POST",
              headers: {
                Authorization: request.headers.get("Authorization"),
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                document: {
                  type: "PLAIN_TEXT",
                  content,
                },
                encodingType: "UTF8",
              }),
            },
          );

          const result = await response.text();
          return new Response(result, {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Headers":
                "Content-Type, Authorization, Origin",
            },
          });
        }

        return new Response("API endpoint not found", {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        console.error("API error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }

    // Handle static files
    try {
      const response = await env.ASSETS.fetch(request);
      return response;
    } catch (error) {
      console.error("Static file error:", error);
      return new Response("Not Found", { status: 404 });
    }
  },
};
