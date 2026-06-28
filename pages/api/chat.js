export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { message, ai, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });
  const SYSTEM = 'Ти AI-асистент діловодця (Шершун Олександр Петрович) самохідної артилерійської батареї 2-го артилерійського дивізіону (САБ 2АДн) Збройних Сил України. Командир: капітан Мураховський Владислав Григорович. Відповідай УКРАЇНСЬКОЮ мовою коротко і по суті.';
  try {
    let reply = '';
    if (ai === 'claude') {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) throw new Error('Claude API ключ не налаштований (ANTHROPIC_API_KEY)');
      const msgs = history.filter(m=>m.role!=='system').map(m=>({role:m.role==='user'?'user':'assistant',content:m.text}));
      msgs.push({role:'user',content:message});
      const r = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:1024,system:SYSTEM,messages:msgs})});
      const d = await r.json();
      if(!r.ok) throw new Error(d.error?.message||'Claude HTTP '+r.status);
      reply = d.content?.[0]?.text||'Порожня відповідь';
    } else if (ai === 'gemini') {
      const key = process.env.GEMINI_API_KEY;
      if (!key) throw new Error('Gemini API ключ не налаштований (GEMINI_API_KEY)');
      const contents = history.filter(m=>m.role!=='system').slice(-10).map(m=>({role:m.role==='user'?'user':'model',parts:[{text:m.text}]}));
      contents.push({role:'user',parts:[{text:message}]});
      const isNewFmt = key.startsWith('AQ.');
      const url = isNewFmt ? 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent' : 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key='+key;
      const hdrs = {'content-type':'application/json'};
      if (isNewFmt) hdrs['Authorization'] = 'Bearer '+key;
      const r = await fetch(url,{method:'POST',headers:hdrs,body:JSON.stringify({system_instruction:{parts:[{text:SYSTEM}]},contents})});
      const d = await r.json();
      if(!r.ok) throw new Error(d.error?.message||'Gemini HTTP '+r.status);
      reply = d.candidates?.[0]?.content?.parts?.[0]?.text||'Порожня відповідь';
    } else if (ai === 'gpt') {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error('GPT API ключ не налаштований (OPENAI_API_KEY)');
      const msgs = [{role:'system',content:SYSTEM},...history.filter(m=>m.role!=='system').slice(-10).map(m=>({role:m.role==='user'?'user':'assistant',content:m.text})),{role:'user',content:message}];
      const r = await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+key,'content-type':'application/json'},body:JSON.stringify({model:'gpt-4o-mini',max_tokens:1024,messages:msgs})});
      const d = await r.json();
      if(!r.ok) throw new Error(d.error?.message||'GPT HTTP '+r.status);
      reply = d.choices?.[0]?.message?.content||'Порожня відповідь';
    } else {
      throw new Error('Невідомий AI: '+ai);
    }
    return res.json({reply});
  } catch(e) {
    console.error('[chat]',e.message);
    return res.status(500).json({error:e.message});
  }
}