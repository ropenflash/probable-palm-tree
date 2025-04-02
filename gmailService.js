const { google } = require("googleapis");

function extractEmailBody(payload) {
  if (!payload || !payload.parts) {
    return payload.body.data ? Buffer.from(payload.body.data, "base64").toString() : "No Body";
  }

  for (const part of payload.parts) {
    if (part.mimeType === "text/plain") {
      return Buffer.from(part.body.data, "base64").toString();
    }
    if (part.mimeType === "text/html") {
      return `HTML Content: ${Buffer.from(part.body.data, "base64").toString()}`;
    }
  }

  return "No readable content.";
}

async function fetchTransactionEmails(oauth2Client) {

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const response = await gmail.users.messages.list({
    userId: "me",
    q: "subject:(transaction OR purchase OR payment)",
  });

  const data=[]

  for (const msg of response.data.messages) {
    const email = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
      format: "full", // Fetch full email content
    });

    const headers = email.data.payload.headers;
    const subject = headers.find(h => h.name === "Subject")?.value || "No Subject";
    const from = headers.find(h => h.name === "From")?.value || "Unknown Sender";
    const snippet = email.data.snippet;

    // Extract email body (plain text or HTML)
    let body = extractEmailBody(email.data.payload);
    data.push(body)

  }

  return data || [];
}



  


module.exports = { fetchTransactionEmails };
