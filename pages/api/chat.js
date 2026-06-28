import { GoogleGenerativeAI } from '@google/generative-ai';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { message, ai, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });
  const SYS = 'Ð¢Ð¸ AI-Ð°ÑÐ¸ÑÑÐµÐ½Ñ Ð´ÑÐ»Ð¾Ð²Ð¾Ð´ÑÑ (Ð¨ÐµÑÑÑÐ½ ÐÐ»ÐµÐºÑÐ°Ð½Ð´Ñ ÐÐµÑÑÐ¾Ð²Ð¸Ñ) CAÐ 2ÐÐÐ½ ÐÐ¡Ð£. ÐÐ¾Ð¼Ð°Ð½Ð´Ð¸Ñ: ÐºÐ°Ð¿ÑÑÐ°Ð½ ÐÑÑÐ°ÑÐ¾Ð²ÑÑÐºÐ¸Ð¹ ÐÐ»Ð°Ð´Ð¸ÑÐ»Ð°Ð² ÐÑÐ¸Ð³Ð¾ÑÐ¾Ð²Ð¸Ñ. ÐÑÐ´Ð¿Ð¾Ð²ÑÐ´Ð°Ð¹ Ð£ÐÐ ÐÐÐÐ¡Ð¬ÐÐÐ® Ð¼Ð¾Ð²Ð¾Ñ ÐºÐ¾ÑÐ¾ÑÐºÐ¾.';
  try {
    let reply = '';
    if (ai === 'claude') {
      const k = process.env.ANTHROPIC_API_KEY;
      if (!k) throw new Error('ÐÐµÐ¼Ð°Ñ ANTHROPIC_API_KEY');
      const m = history.filter(x=>x.role!=='system').map(x=>({role:x.role==='user'?'user':'assistant',content:x.text}));
      m.push({role:'user',content:message});
      const r = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':k,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:1024,system:SYS,messages:m})});
      const d = await r.json(); if(!r.ok) throw new Error(d.error?.message||'Claude '+r.status);
      reply = d.content?.[0]?.text||'ÐÐ¾ÑÐ¾Ð¶Ð½Ñ';
    } else if (ai === 'gemini') {
      const k = process.env.GEMINI_API_KEY;
      if (!k) throw new Error('ÐÐµÐ¼Ð°Ñ GEMINI_API_KEY');
      const genAI = new GoogleGenerativeAI(k);
      const model = genAI.getGenerativeModel({model:'gemini-2.0-flash',systemInstruction:SYS});
      const chat = model.startChat({ history: [] });
      const result = await chat.sendMessage(message);
      reply = result.response.text();
    } else if (ai === 'gpt') {
      const k = process.env.OPENAI_API_KEY;
      if (!k) throw new Error('ÐÐµÐ¼Ð°Ñ OPENAI_API_KEY');
      const m = [{role:'system',content:SYS},...history.filter(x=>x.role!=='system').slice(-10).map(x=>({role:x.role==='user'?'user':'assistant',content:x.text})),{role:'user',content:message}];
      const r = await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+k,'content-type':'application/json'},body:JSON.stringify({model:'gpt-4o-mini',max_tokens:1024,messages:m})});
      const d = await r.json(); if(!r.ok) throw new Error(d.error?.message||'GPT '+r.status);
      reply = d.choices?.[0]?.message?.content||'ÐÐ¾ÑÐ¾Ð¶Ð½Ñ';
    } else throw new Error('ÐÐµÐ²ÑÐ´Ð¾Ð¼Ð¸Ð¹ AI: '+ai);
    return res.json({reply});
  } catch(e) { return res.status(500).json({error:e.message}); }
}