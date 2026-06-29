import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';

export default function Cabinet() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Вітаю! Я AI-кабінет діловодця САБ 2АДн. Задайте питання або дайте команду голосом.', ai: 'claude' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAI, setSelectedAI] = useState('claude');
  const [isListening, setIsListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const AI_COLORS = {
    claude: { bg: '#f0f4ff', border: '#c5d8fb', label: 'Claude', dot: '#7c3aed' },
    gemini: { bg: '#f0fdf4', border: '#86efac', label: 'Gemini', dot: '#16a34a' },
    gpt:    { bg: '#fff7ed', border: '#fed7aa', label: 'GPT',    dot: '#ea580c' },
    system: { bg: '#f8f9fa', border: '#dadce0', label: 'Система',dot: '#6b7280' },
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', text };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, ai: selectedAI, history: messages.slice(-10) })
      });
      const data = await resp.json();
      const aiMsg = { role: 'assistant', text: data.reply || data.error || 'Помилка', ai: selectedAI };
      setMessages(m => [...m, aiMsg]);
    if (data.reply) {
      if (typeof responsiveVoice !== 'undefined') {
        setSpeaking(true);
        responsiveVoice.speak(data.reply, 'Ukrainian Female', { rate: 1.0, onend: () => setSpeaking(false) });
      } else if ('speechSynthesis' in window) {
        const utt = new SpeechSynthesisUtterance(data.reply);
        utt.lang = 'uk-UA'; utt.rate = 1.0;
        utt.onstart = () => setSpeaking(true);
        utt.onend = () => setSpeaking(false);
        window.speechSynthesis.speak(utt);
      }
    }

      // Озвучуємо відповідь
      if (data.reply && 'speechSynthesis' in window) {
        const utt = new SpeechSynthesisUtterance(data.reply);
        utt.lang = 'uk-UA';
        utt.rate = 1.1;
        utt.onstart = () => setSpeaking(true);
        utt.onend = () => setSpeaking(false);
        window.speechSynthesis.speak(utt);
      }
    } catch(e) {
      setMessages(m => [...m, { role: 'assistant', text: 'Помилка: ' + e.message, ai: 'system' }]);
    }
    setLoading(false);
  };

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Голосовий ввід не підтримується в цьому браузері. Спробуй Chrome.');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'uk-UA';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      sendMessage(text);
    };
    rec.onerror = () => setIsListening(false);
    rec.start();
    recognitionRef.current = rec;
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  return (
    <>
      <Head>
      <script src="https://code.responsivevoice.org/responsivevoice.js?key=FREE"></script>
        <title>Кабінет діловодця | САБ 2АДн</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1a237e" />
      </Head>

      <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#f1f3f4', fontFamily:"'Google Sans',Arial,sans-serif" }}>

        {/* HEADER */}
        <div style={{ background:'linear-gradient(135deg,#1a237e,#1a73e8)', color:'#fff', padding:'12px 16px', display:'flex', alignItems:'center', gap:'12px', flexShrink:0, boxShadow:'0 2px 8px rgba(0,0,0,.3)' }}>
          <div style={{ fontSize:'24px' }}>🎖️</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'16px', fontWeight:700 }}>Кабінет діловодця</div>
            <div style={{ fontSize:'11px', opacity:.8 }}>САБ 2-го артилерійського дивізіону</div>
          </div>
          {speaking && (
            <button onClick={stopSpeaking} style={{ background:'rgba(255,255,255,.2)', border:'1px solid rgba(255,255,255,.4)', borderRadius:'20px', color:'#fff', padding:'4px 12px', fontSize:'12px', cursor:'pointer' }}>
              🔊 Стоп
            </button>
          )}
          <div style={{ fontSize:'11px', opacity:.7 }}>{new Date().toLocaleDateString('uk-UA',{day:'numeric',month:'long'})}</div>
        </div>

        {/* AI SELECTOR */}
        <div style={{ background:'#fff', padding:'8px 14px', display:'flex', gap:'8px', borderBottom:'1px solid #dadce0', flexShrink:0 }}>
          {['claude','gemini','gpt'].map(ai => (
            <button key={ai} onClick={() => setSelectedAI(ai)} style={{
              padding:'5px 14px', borderRadius:'16px', border:'2px solid',
              borderColor: selectedAI===ai ? AI_COLORS[ai].dot : '#dadce0',
              background: selectedAI===ai ? AI_COLORS[ai].bg : '#fff',
              color: selectedAI===ai ? AI_COLORS[ai].dot : '#5f6368',
              fontWeight:600, fontSize:'13px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px'
            }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:AI_COLORS[ai].dot, display:'inline-block' }}></span>
              {AI_COLORS[ai].label}
            </button>
          ))}
          <div style={{ flex:1 }} />
          <div style={{ fontSize:'11px', color:'#9aa0a6', alignSelf:'center' }}>
            {selectedAI === 'claude' ? 'Найкращий для аналізу' : selectedAI === 'gemini' ? 'Швидкий, Google-інтеграція' : 'Загальні задачі'}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div style={{ background:'#fff', padding:'6px 14px 8px', display:'flex', gap:'6px', flexWrap:'wrap', borderBottom:'1px solid #dadce0', flexShrink:0 }}>
          {[
            '📋 Хто зараз у відпустці?',
            '📊 Статус бійців',
            '🗓️ ДВ цього місяця',
            '📄 Створи наказ',
            '📲 Відправ в WhatsApp',
          ].map(q => (
            <button key={q} onClick={() => sendMessage(q)} style={{
              padding:'4px 11px', border:'1px solid #dadce0', borderRadius:'14px',
              background:'#f8f9fa', fontSize:'12px', cursor:'pointer', color:'#3c4043',
              transition:'all .15s'
            }}>
              {q}
            </button>
          ))}
        </div>

        {/* MESSAGES */}
        <div style={{ flex:1, overflowY:'auto', padding:'12px 14px' }}>
          {messages.map((m, i) => {
            const colors = AI_COLORS[m.ai || 'system'];
            const isUser = m.role === 'user';
            return (
              <div key={i} style={{
                display:'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
                marginBottom:'10px'
              }}>
                {!isUser && (
                  <div style={{ width:28, height:28, borderRadius:'50%', background:colors.dot, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'12px', fontWeight:700, flexShrink:0, marginRight:'8px', marginTop:'2px' }}>
                    {colors.label[0]}
                  </div>
                )}
                <div style={{
                  maxWidth:'78%', padding:'10px 14px', borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                  background: isUser ? '#1a73e8' : colors.bg,
                  border: isUser ? 'none' : '1px solid ' + colors.border,
                  color: isUser ? '#fff' : '#202124',
                  fontSize:'14px', lineHeight:'1.6', whiteSpace:'pre-wrap', wordBreak:'break-word',
                  boxShadow:'0 1px 3px rgba(0,0,0,.1)'
                }}>
                  {!isUser && <div style={{ fontSize:'10px', color:colors.dot, fontWeight:700, marginBottom:'4px', textTransform:'uppercase' }}>{colors.label}</div>}
                  {m.text}
                </div>
              </div>
            );
          })}
          {loading && (
            <div style={{ display:'flex', gap:'8px', alignItems:'center', padding:'8px 0' }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background: AI_COLORS[selectedAI].dot, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'12px', fontWeight:700 }}>
                {AI_COLORS[selectedAI].label[0]}
              </div>
              <div style={{ padding:'10px 16px', background: AI_COLORS[selectedAI].bg, border:'1px solid '+AI_COLORS[selectedAI].border, borderRadius:'4px 18px 18px 18px' }}>
                <span style={{ display:'inline-flex', gap:'4px' }}>
                  {[0,1,2].map(j => <span key={j} style={{ width:8, height:8, borderRadius:'50%', background: AI_COLORS[selectedAI].dot, animation:'pulse 1.2s infinite', animationDelay: j*0.2+'s', display:'inline-block' }}></span>)}
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        <div style={{ background:'#fff', padding:'10px 14px', borderTop:'1px solid #dadce0', display:'flex', gap:'8px', alignItems:'flex-end', flexShrink:0 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Задай питання або дай команду... (Enter — відправити)"
            rows={1}
            style={{
              flex:1, padding:'10px 14px', border:'1px solid #dadce0', borderRadius:'24px',
              fontSize:'14px', resize:'none', outline:'none', fontFamily:'inherit',
              lineHeight:'1.5', maxHeight:'120px', overflowY:'auto',
              background:'#f8f9fa', transition:'border .15s'
            }}
            onFocus={e => e.target.style.borderColor='#1a73e8'}
            onBlur={e => e.target.style.borderColor='#dadce0'}
          />
          <button
            onClick={isListening ? stopVoice : startVoice}
            style={{
              width:44, height:44, borderRadius:'50%', border:'none', cursor:'pointer',
              background: isListening ? '#d93025' : '#f1f3f4',
              color: isListening ? '#fff' : '#5f6368',
              fontSize:'18px', display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow: isListening ? '0 0 0 4px rgba(217,48,37,.2)' : 'none',
              transition:'all .2s', flexShrink:0
            }}
            title={isListening ? 'Зупинити' : 'Голосовий ввід'}
          >
            {isListening ? '⏹️' : '🎤'}
          </button>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              width:44, height:44, borderRadius:'50%', border:'none', cursor:'pointer',
              background: input.trim() && !loading ? '#1a73e8' : '#dadce0',
              color:'#fff', fontSize:'18px', display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all .2s', flexShrink:0
            }}
          >
            ➤
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%,100%{opacity:.3;transform:scale(.8)}
          50%{opacity:1;transform:scale(1)}
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
        textarea { overflow-y: hidden; }
        textarea::-webkit-scrollbar { display: none; }
        @media (max-width: 600px) {
          .quick-btn { font-size: 11px !important; }
        }
      `}</style>
    </>
  );
}