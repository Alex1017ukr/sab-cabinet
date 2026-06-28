export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, ai, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });

  // Системний промпт — знання про підрозділ
  const SYSTEM = `Ти AI-асистент діловодця (Шершун Олександр Петрович) самохідної артилерійської батареї 2-го артилерійського дивізіону (САБ 2АДн) Збройних Сил України.

Твої завдання:
- Відповідати на питання про особовий склад, відпустки, ДВ, відрядження, ВЛК
- Допомагати готувати документи (накази, списки, звітності)
- Аналізувати дані з таблиць
- Відправляти повідомлення в групу WhatsApp "САБ"

Дані підрозділу:
- Командир батареї: капітан Мураховський Владислав Григорович
- Головний сержант: сержант Корчевний Сергій Олександрович  
- Діловод: молодший сержант Шершун Олександр Петрович
- Всього посад за штатом: 59 (36 бійців + ваканти)

Відповідай УКРАЇНСЬКОЮ мовою, коротко і по суті. Якщо питання про конкретні дати відпусток — зверни увагу що потрібно перевірити таблицю. Якщо просять документ — запитай деталі і підготуй текст.`;

  try {
    let reply = '';

    if (ai === 'claude') {
      const claudeKey = process.env.CLAUDE_API_KEY;
      if (!claudeKey) throw new Error('Claude API ключ не налаштований');
      
      const msgs = history.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      }));
      msgs.push({ role: 'user', content: message });

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: SYSTEM,
          messages: msgs
        })
      });
      const data = await resp.json();
      reply = data.content?.[0]?.text || data.error?.message || 'Помилка Claude';

    } else if (ai === 'gemini') {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) throw new Error('Gemini API ключ не налаштований');

      const parts = [{ text: SYSTEM + '\n\n' + message }];
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
      });
      const data = await resp.json();
      reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Помилка Gemini';

    } else if (ai === 'gpt') {
      const gptKey = process.env.OPENAI_API_KEY;
      if (!gptKey) throw new Error('GPT API ключ не налаштований');

      const msgs = [{ role: 'system', content: SYSTEM }];
      history.filter(m=>m.role!=='system').forEach(m => msgs.push({ role: m.role==='user'?'user':'assistant', content: m.text }));
      msgs.push({ role: 'user', content: message });

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${gptKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 1024, messages: msgs })
      });
      const data = await resp.json();
      reply = data.choices?.[0]?.message?.content || 'Помилка GPT';
    }

    return res.json({ reply });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}