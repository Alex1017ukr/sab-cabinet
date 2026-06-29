import { GoogleGenerativeAI } from '@google/generative-ai';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { message, ai, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });
  const SYS = 'ÃÂ¢ÃÂ¸ AI-ÃÂ°ÃÂÃÂ¸ÃÂÃÂÃÂµÃÂ½ÃÂ ÃÂ´ÃÂÃÂ»ÃÂ¾ÃÂ²ÃÂ¾ÃÂ´ÃÂÃÂ (ÃÂ¨ÃÂµÃÂÃÂÃÂÃÂ½ ÃÂÃÂ»ÃÂµÃÂºÃÂÃÂ°ÃÂ½ÃÂ´ÃÂ ÃÂÃÂµÃÂÃÂÃÂ¾ÃÂ²ÃÂ¸ÃÂ) CAÃÂ 2ÃÂÃÂÃÂ½ ÃÂÃÂ¡ÃÂ£. ÃÂÃÂ¾ÃÂ¼ÃÂ°ÃÂ½ÃÂ´ÃÂ¸ÃÂ: ÃÂºÃÂ°ÃÂ¿ÃÂÃÂÃÂ°ÃÂ½ ÃÂÃÂÃÂÃÂ°ÃÂÃÂ¾ÃÂ²ÃÂÃÂÃÂºÃÂ¸ÃÂ¹ ÃÂÃÂ»ÃÂ°ÃÂ´ÃÂ¸ÃÂÃÂ»ÃÂ°ÃÂ² ÃÂÃÂÃÂ¸ÃÂ³ÃÂ¾ÃÂÃÂ¾ÃÂ²ÃÂ¸ÃÂ. ÃÂÃÂÃÂ´ÃÂ¿ÃÂ¾ÃÂ²ÃÂÃÂ´ÃÂ°ÃÂ¹ ÃÂ£ÃÂÃÂ ÃÂÃÂÃÂÃÂ¡ÃÂ¬ÃÂÃÂÃÂ® ÃÂ¼ÃÂ¾ÃÂ²ÃÂ¾ÃÂ ÃÂºÃÂ¾ÃÂÃÂ¾ÃÂÃÂºÃÂ¾.';
  try {
    let reply = '';
    if (ai === 'claude') {
      const k = process.env.ANTHROPIC_API_KEY;
      if (!k) throw new Error('ÃÂÃÂµÃÂ¼ÃÂ°ÃÂ ANTHROPIC_API_KEY');h
      const m = history.filter(x=>x.role!=='system').map(x=>({role:x.role==='user'?'user':'assistant',content:x.text}));
      m.push({role:'user',content:message});
      const r = await fetch('https://api.anthropic.com/v1/messages',{methhod:'POST',headers:{'x-api-key':k,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:1024,system:SYS,messages:m})});
      const d = await r.json(); if(!r.ok) throw new Error(d.error?.message||'Claude '+r.status);
      reply = d.content?.[0]?.text||'ÃÂÃÂ¾ÃÂÃÂ¾ÃÂ¶ÃÂ½ÃÂ';
    } else if (ai === 'gemini') {
      const k = process.env.GEMINI_API_KEY;
      if (!k) throw new Error('ÃÂÃÂµÃÂ¼ÃÂ°ÃÂ GEMINI_API_KEY');
      const genAI = new GoogleGenerativeAI(k);
      const model = genAI.getGenerativeModel({mhodel:'gemini-2.5-flash',systemInstruction:SYS});
      const chat = model.startChat({ history: [] });
      const result = await chat.sendMessage(message);
      reply = result.response.text();
    } else if (ai === 'gpt') {
      const k = process.env.OPENAI_API_KEY;
      if (!k) throw new Error('ÃÂÃÂµÃÂ¼ÃÂ°ÃÂ OPENAI_API_KEY');
      const m = [{role:'system',content:SYS},...history.filter(x=>x.role!=='system').slice(-10).map(x=>({role:x.role==='user'?'user':'assistant',content:x.text})),{role:'user',content:message}];
      const r = await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+k,'content-type':'application/json'},body:JSON.stringify({model:'gpt-4o-mini',max_tokens:1024,messages:m})});
      const d = await r.json(); if(!r.ok) throw new Error(d.error?.message||'GPT '+r.status);
      reply = d.choices?.[0]?.message?.content||'ÃÂÃÂ¾ÃÂÃÂ¾ÃÂ¶ÃÂ½ÃÂ';
    } else throw new Error('ÃÂÃÂµÃÂ²ÃÂÃÂ´ÃÂ¾ÃÂ¼ÃÂ¸ÃÂ¹ AI: '+ai);
    return res.json({reply});
  } catch(e) { return res.status(500).json({error:e.message}); }
}
