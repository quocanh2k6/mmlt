import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Letter content paragraphs — Vietnamese love letter for 20/10.
 * Each paragraph is an object with text and optional styling.
 */
const LETTER_PARAGRAPHS = [
  {
    text: 'Vợ yêu à,',
    className: 'letter-greeting',
  },
  {
    text: 'Nhân ngày Phụ nữ Việt Nam 20/10, anh muốn dành cho em một món quà đặc biệt. Có thể món quà này không đắt tiền, cũng chẳng thể sánh được với tất cả những điều em xứng đáng nhận được, nhưng anh đã gửi vào đây thật nhiều tình yêu và những điều anh muốn nói với em.',
  },
  {
    text: 'Cảm ơn em vì đã xuất hiện trong cuộc đời anh. Cảm ơn em vì những lúc dịu dàng, những lần quan tâm, những nụ cười và cả những khoảnh khắc bình thường mà nhờ có em, chúng trở nên thật đặc biệt.',
    className: 'highlight',
  },
  {
    text: 'Anh biết rằng cuộc sống không phải lúc nào cũng dễ dàng. Sẽ có những ngày chúng ta mệt mỏi, những lúc bất đồng và những điều chưa hoàn hảo. Nhưng anh mong rằng, dù ngoài kia có bao nhiêu bộn bề, chúng ta vẫn luôn chọn nắm tay nhau, cùng lắng nghe, cùng thấu hiểu và cùng bước tiếp.',
  },
  {
    text: 'Anh không hứa sẽ mang đến cho em một cuộc sống lúc nào cũng hoàn hảo. Nhưng anh hứa sẽ luôn cố gắng để trở thành người chồng tốt hơn, biết yêu thương em nhiều hơn, biết trân trọng những điều nhỏ bé em dành cho anh và không quên rằng em chính là người anh muốn đồng hành trên chặng đường dài phía trước.',
  },
  {
    text: 'Anh mong em luôn khỏe mạnh, bình an, luôn giữ được nụ cười thật tươi và làm những điều khiến em hạnh phúc. Mong mọi ước mơ của em đều có cơ hội trở thành hiện thực. Và khi em mệt mỏi, hãy nhớ rằng em không cần phải mạnh mẽ một mình, vì vẫn luôn có anh ở đây, sẵn sàng lắng nghe và ôm em vào lòng.',
    className: 'highlight',
  },
  {
    text: 'Nếu được chọn lại, anh vẫn mong mình sẽ gặp em, yêu em và cùng em viết tiếp câu chuyện của chúng ta.',
    className: 'highlight',
  },
  {
    text: 'Chúc vợ yêu của anh có một ngày 20/10 thật hạnh phúc. Không chỉ hôm nay, mà cả những ngày bình thường sau này, anh cũng sẽ cố gắng để em cảm nhận được rằng mình luôn được yêu thương và trân trọng.',
  },
  {
    text: 'Cảm ơn em vì đã là vợ của anh.',
    className: 'highlight',
  },
  {
    text: 'Anh yêu em, nhiều hơn những gì anh có thể diễn tả bằng lời.',
    className: 'highlight',
  },
];

/**
 * LoveLetter — The letter overlay with envelope animation and typewriter text reveal.
 */
export default function LoveLetter({ visible, onClose, onReplayJourney }) {
  const [phase, setPhase] = useState('hidden'); // 'hidden' | 'envelope' | 'opening' | 'letter'
  const [visibleParagraphs, setVisibleParagraphs] = useState(0);
  const letterRef = useRef(null);
  const timerRef = useRef(null);

  // Trigger envelope → letter sequence when visible
  useEffect(() => {
    if (visible) {
      setPhase('envelope');
      setVisibleParagraphs(0);

      // Envelope appears, then opens
      const t1 = setTimeout(() => setPhase('opening'), 1800);
      // Transition to letter view
      const t2 = setTimeout(() => {
        setPhase('letter');
        // Start revealing paragraphs one by one
        revealParagraphs();
      }, 3000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      setPhase('hidden');
      setVisibleParagraphs(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [visible]);

  const revealParagraphs = useCallback(() => {
    let count = 0;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      count++;
      setVisibleParagraphs(count);
      if (count >= LETTER_PARAGRAPHS.length + 2) {
        // +2 for closing and signature
        clearInterval(timerRef.current);
      }
    }, 600);
  }, []);

  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  const handleReplay = useCallback(() => {
    if (onReplayJourney) onReplayJourney();
  }, [onReplayJourney]);

  // Scroll to bottom as new paragraphs appear
  useEffect(() => {
    if (letterRef.current && visibleParagraphs > 3) {
      letterRef.current.scrollTo({
        top: letterRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [visibleParagraphs]);

  return (
    <div className={`letter-overlay ${visible ? 'visible' : ''}`} id="love-letter-overlay">

      {/* Envelope Phase */}
      {(phase === 'envelope' || phase === 'opening') && (
        <div className="envelope-wrapper">
          <div className={`envelope ${phase === 'envelope' ? 'visible' : 'opening'}`}>
            <div className="envelope-body" />
            <div className="envelope-flap" />
            <div className="envelope-seal" />
          </div>
        </div>
      )}

      {/* Letter Phase */}
      {phase === 'letter' && (
        <div className={`letter-paper-container ${phase === 'letter' ? 'visible' : ''}`}>
          <div className="letter-paper" ref={letterRef}>
            {/* Decorative title */}
            <h1 className="letter-title">Gửi vợ yêu của anh ❤️</h1>
            <div className="letter-divider" />

            {/* Letter body */}
            <div className="letter-body">
              {LETTER_PARAGRAPHS.map((para, index) => (
                <p
                  key={index}
                  className={`letter-paragraph ${para.className || ''} ${
                    index < visibleParagraphs ? 'visible' : ''
                  }`}
                  style={{ transitionDelay: `${index * 0.05}s` }}
                >
                  {para.text}
                </p>
              ))}

              {/* Closing */}
              <p
                className={`letter-paragraph ${
                  visibleParagraphs > LETTER_PARAGRAPHS.length ? 'visible' : ''
                }`}
                style={{ marginTop: '28px', fontStyle: 'italic', color: '#4A1515' }}
              >
                Mãi thương em ❤️
              </p>

              {/* Signature */}
              <div
                className={`letter-paragraph ${
                  visibleParagraphs > LETTER_PARAGRAPHS.length + 1 ? 'visible' : ''
                }`}
              >
                <div className="letter-closing">
                  <p className="letter-signature">
                    Chồng yêu của em
                    <span className="beating-heart">💕</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Controls */}
            {visibleParagraphs >= LETTER_PARAGRAPHS.length && (
              <div className="letter-controls">
                <button
                  className="letter-btn"
                  onClick={handleClose}
                  id="close-letter-btn"
                >
                  Đóng thư ✦
                </button>
                <button
                  className="letter-btn"
                  onClick={handleReplay}
                  id="replay-from-letter-btn"
                >
                  Xem lại hành trình ♡
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
