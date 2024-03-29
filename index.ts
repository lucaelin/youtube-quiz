import { YoutubeTranscript } from "youtube-transcript";
import { openrouter } from "./openrouter.ts";
import { findMDCodeContent } from "./md.ts";
import app from "./express.ts";
import express from "express";

app.use(express.static("public"));

app.post("/api/fetchVideoQuiz", async (req, res) => {
  if (!req.body || !req.body.url) {
    res.status(400).json({ error: "url is required" });
    return;
  }
  const url = req.body.url;
  const transcript = await YoutubeTranscript.fetchTranscript(url);

  console.log(transcript);

  const transcriptText = transcript.map((t) => t.text).join("\n");

  const questionsRaw = await openrouter.chat.completions.create({
    model: "mistralai/mistral-large",
    messages: [
      {
        role: "system",
        content: [
          "You are a professional Quizmaster!",
          "The questions should be in html format. Respond only with the markup for the questions, no additional elements. Give each question input a unique name.",
          "Example: ```html",
          "<p>What is the capital of France?</p>",
          "<input type='text' name='capitalOfFrance' />",
          "<p>What is the capital of Italy?</p>",
          "<input type='radio' name='capitalOfItaly' value='Rome' /> Rome",
          "<input type='radio' name='capitalOfItaly' value='Milan' /> Milan",
          "<input type='radio' name='capitalOfItaly' value='Florence' /> Florence",
          "<input type='radio' name='capitalOfItaly' value='Venice' /> Venice",
          "```",
          "The questions should be about the scientific topic of the video, not the way it is presented.",
          "Do not provide the answers. The form responses will be sent to you for grading later.",
          "Please create a quiz with about 6 Questions for the following youtube video transcription:",
        ].join("\n"),
      },
      {
        role: "user",
        content: transcriptText,
      },
    ],
  }).then((res) => res.choices[0].message.content ?? "Error.");

  const questions = findMDCodeContent("html", questionsRaw) ?? questionsRaw;

  res.json({
    title: transcript[0].text,
    url,
    transcript: transcriptText,
    questions,
  });
});

app.post("/api/checkUserResponses", async (req, res) => {
  const { quiz: quizStr, ...responses } = req.body;
  const quiz = JSON.parse(quizStr);
  console.log(quiz, responses);

  const feedback = await openrouter.chat.completions.create({
    model: "mistralai/mistral-large",
    messages: [
      {
        role: "system",
        content: [
          "You are a professional Quizmaster!",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          "Please create a quiz with about 6 Questions for the following youtube video transcription:",
          quiz.transcript,
        ].join("\n"),
      },
      {
        role: "assistant",
        content: quiz.questions,
      },
      {
        role: "user",
        content: [
          JSON.stringify(responses, null, 4),
          "",
          "Please grade the responses and provide the correct answers. Empty responses should be explained thorowly.",
          "Use the following output format: ```",
          "Question 1: What is the capital of France?",
          "Your response: Paris",
          "Correct! The capital of France is Paris.",
          "Question 2: What is the capital of Italy?",
          "Your response: Milan",
          "Close, but the correct answer is Rome. Milan, Florence, and Venice are also cities in Italy, but they are not the capital.",
          "```",
          "Finish your response with a summary and a bit of motivation.",
        ].join("\n"),
      },
    ],
  }).then((res) => res.choices[0].message.content);
  console.log(feedback);

  res.json({ ...quiz, responses, feedback });
});
