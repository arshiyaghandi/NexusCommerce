import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface MathCaptchaProps {
  onVerify: (captchaId: string, captchaAnswer: string) => void;
}

export default function MathCaptcha({ onVerify }: MathCaptchaProps) {
  const [captchaId, setCaptchaId] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchCaptcha = async () => {
    setIsLoading(true);
    setAnswer('');
    try {
      const res = await fetch('/api/auth/captcha');
      const data = await res.json();
      setCaptchaId(data.id);
      setQuestion(data.question);
      onVerify('', '');
    } catch {
      setQuestion('Failed to load captcha');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  useEffect(() => {
    if (answer.trim() && captchaId) {
      onVerify(captchaId, answer.trim());
    } else {
      onVerify('', '');
    }
  }, [answer, captchaId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ display: 'block', fontWeight: '500', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Verify you're human
      </label>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: 'rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: '1rem', minWidth: '120px' }}>
          {isLoading ? 'Loading...' : question}
        </span>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="?"
          style={{
            width: '60px',
            padding: '0.5rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '1rem',
            textAlign: 'center',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={fetchCaptcha}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Get new question"
        >
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );
}
