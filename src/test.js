import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function run() {
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: "שלום! תן לי רעיון לארוחת ערב קלה."
  });

  console.log(response.output_text);
}

run();
