import express from 'express';
const { Router } = express;
import Anthropic from '@anthropic-ai/sdk';

const router = Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL_NAME || 'claude-sonnet-4-6';

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const systemPrompt = `You are a defect health analyst for the ProTime Dashboard, tracking UTA, UTM, and WFM Classic products.
You have access to defect metrics and can answer questions about defect trends, priorities, and product health.
${context ? `Current dashboard context: ${JSON.stringify(context)}` : ''}
Be concise, data-driven, and actionable in your responses.`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }]
    });

    res.json({
      response: response.content[0]?.text || 'No response generated',
      model: MODEL
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
