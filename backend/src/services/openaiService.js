const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class OpenAIService {
  // Convert speech to text using Whisper
  async speechToText(audioBuffer, filename = 'audio.webm') {
    try {
      // Save buffer to temporary file
      const tempPath = path.join(__dirname, '../../temp', filename);
      
      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      fs.writeFileSync(tempPath, audioBuffer);
      
      // Transcribe audio
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempPath),
        model: 'whisper-1',
        language: 'en'
      });
      
      // Clean up temp file
      fs.unlinkSync(tempPath);
      
      return transcription.text;
    } catch (error) {
      console.error('Speech to text error:', error);
      throw new Error('Failed to transcribe audio: ' + error.message);
    }
  }

  // Convert text to speech using OpenAI TTS
  async textToSpeech(text) {
    try {
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: text,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      return buffer;
    } catch (error) {
      console.error('Text to speech error:', error);
      throw new Error('Failed to generate speech: ' + error.message);
    }
  }

  // General chat completion
  async chat(messages, systemPrompt = null) {
    try {
      const messageArray = systemPrompt 
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messageArray,
        temperature: 0.7,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Chat completion error:', error);
      throw new Error('Failed to get AI response: ' + error.message);
    }
  }

  // Structured chat for JSON responses
  async chatJSON(messages, systemPrompt) {
    try {
      const messageArray = [
        { role: 'system', content: systemPrompt },
        ...messages
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messageArray,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Chat JSON completion error:', error);
      throw new Error('Failed to get structured AI response: ' + error.message);
    }
  }
}

module.exports = new OpenAIService();