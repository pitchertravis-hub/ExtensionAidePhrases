// Reconnaissance vocale (Chrome). Renvoie null si le navigateur ne la gère pas.
export function createVoice({ onText, onState }) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) return null;

  const rec = new Recognition();
  rec.lang = 'fr-FR';
  rec.continuous = true;
  rec.interimResults = false;
  let listening = false;

  rec.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript + ' ';
    }
    onText(transcript.trim());
  };
  rec.onstart = () => { listening = true; onState(true); };
  rec.onend = () => { listening = false; onState(false); };
  rec.onerror = (e) => console.warn('Reconnaissance vocale :', e.error);

  return {
    toggle() {
      if (listening) rec.stop();
      else rec.start();
    },
  };
}
