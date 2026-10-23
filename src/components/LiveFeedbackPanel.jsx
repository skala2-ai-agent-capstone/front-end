const STATE_META = {
  good: { color: 'var(--green)', text: '양호' },
  warn: { color: 'var(--amber)', text: '보완 필요' },
  pending: { color: 'var(--text-faint)', text: '확인 필요' },
};

export default function LiveFeedbackPanel({ phase, display, cooldownMessage, hasUserMessages }) {
  return (
    <div className="card ws-panel" id="liveFeedbackPanel">
      <h3>실시간 피드백</h3>
      <div id="liveFeedbackBody">
        {phase === 'idle' && (
          <>
            <p className="task-sub">{hasUserMessages ? '대화 중 프롬프팅 품질을 바로 확인해보세요.' : '대화를 먼저 나눠보세요. 보낸 메시지가 있어야 피드백을 받을 수 있어요.'}</p>
            {cooldownMessage && <p className="lf-cooldown">{cooldownMessage}</p>}
          </>
        )}
        {(phase === 'waiting' || phase === 'generating') && (
          <div className="step run">
            <div className="step-ico"></div>
            <div>
              <b>{phase === 'waiting' ? '대기 중…' : '생성 중…'}</b>
              <small>{phase === 'waiting' ? '최근 대화 범위를 확인하고 있어요.' : '프롬프팅 피드백을 만들고 있어요.'}</small>
            </div>
          </div>
        )}
        {phase === 'failed' && <p className="lf-cooldown" style={{ color: 'var(--red)' }}>피드백 생성에 실패했어요. 잠시 후 다시 시도해주세요.</p>}
        {phase === 'done' && display && (
          <>
            {(display.items || []).map((item, i) => {
              const meta = STATE_META[item.state] || STATE_META.pending;
              return (
                <div className="lf-item" key={i}>
                  <span className="dot" style={{ background: meta.color }}></span>
                  <div>
                    <div className="lf-item-label">{item.label} <span style={{ color: meta.color, fontWeight: 600, fontSize: 12 }}>· {meta.text}</span></div>
                    <div className="lf-item-note">{item.note}</div>
                  </div>
                </div>
              );
            })}
            {display.coaching && <div className="lf-coach">코칭 · {display.coaching}</div>}
            {display.suggestedPrompt && (
              <p className="task-sub" style={{ marginTop: 8 }}>추천 프롬프트: “{display.suggestedPrompt}”</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
