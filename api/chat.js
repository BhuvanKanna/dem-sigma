export default async function handler(req, res) {
  try {
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:streamGenerateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify(req.body)
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return res.status(geminiResponse.status).send(errorText);
    }

    // Set streaming headers
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive"
    });

    // Stream Gemini response chunks directly to client
    const reader = geminiResponse.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      res.write(decoder.decode(value, { stream: true }));
    }

    res.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Gemini streaming request failed"
    });
  }
}
