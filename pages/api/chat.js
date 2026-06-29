import { GoogleGenerativeAI } from '@google/generative-ai';
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { message, ai, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });
  const SYS = 'AI-kabinet dilovodtsya SAB 2ADn. Dopomagay vesty oblik. Vidpoviday korotko ukrayinskoyu.';
  try {
    let reply = '';
    if (ai === 'claude') {
      const k = process.env.ANTHROPIC_API_KEY;
      if (!k) throw new Error('No ANTHROPIC_API_KEY');
      const m = history.filter(x=>x.role!=='system').map(x=>({role:x.role==='user'?'user':'assistant',content:x.text}));
      m.push({role:'user',content:message});
      const r = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':k,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:1024,system:SYS,messages:m})});
      const d = await r.json(); if(!r.ok) throw new Error(d.error?.message||'Claude '+r.status);
      reply = d.content?.[0]?.text||'No reply';
    } else if (ai === 'gemini') {
      const k = process.env.GEMINI_API_KEY;
      if (!k) throw new Error('No GEMINI_API_KEY');
      const genAI = new GoogleGenerativeAI(k);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: SYS });
      const chat = model.startChat({ history: [] });
      const result = await chat.sendMessage(message);
      reply = result.response.text();
    } else if (ai === 'gpt') {
      const k = process.env.OPENAI_API_KEY;
      if (!k) throw new Error('No OPENAI_API_KEY');
      const m = [{role:'system',content:SYS},...history.filter(x=>x.role!=='system').slice(-10).map(x=>({role:x.role==='user'?'user':'assistant',content:x.text})),{role:'user',content:message}];
      const r = await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+k,'content-type':'application/json'},body:JSON.stringify({model:'gpt-4o-mini',max_tokens:1024,messages:m})});
      const d = await r.json(); if(!r.ok) throw new Error(d.error?.message||'GPT '+r.status);
      reply = d.choices?.[0]?.message?.content||'No reply';
    } else throw new Error('Unknown AI: '+ai);
    return res.json({reply});
  } catch(e) { return res.status(500).json({error:e.message}); }
}