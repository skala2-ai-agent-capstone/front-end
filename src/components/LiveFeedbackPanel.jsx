import { LF_STATE_META } from '../hooks/useLiveFeedback';

export default function LiveFeedbackPanel({ phase, result, cooldownRemainingSec, hasUserMessages }) {
  return (
    <div className="card ws-panel" id="liveFeedbackPanel">
      <h3>실시간 피드백</h3>
      <div id="liveFeedbackBody">
        {phase === 'idle' && cooldownRemainingSec > 0 && (
          <>
            <p className="task-sub">대화 중 프롬프팅 품질을 바로 확인해보세요.</p>
            <p className="lf-cooldown">{Math.ceil(cooldownRemainingSec / 60)}분 후 다시 요청할 수 있어요.</p>
          </>
        )}
        {phase === 'idle' && cooldownRemainingSec === 0 && !hasUserMessages && (
          <p className="task-sub">대화를 먼저 나눠보세요. 보낸 메시지가 있어야 피드백을 받을 수 있어요.</p>
        )}
        {phase === 'idle' && cooldownRemainingSec === 0 && hasUserMessages && (
          <p className="task-sub">대화 중 프롬프팅 품질을 바로 확인해보세요.</p>
        )}
        {(phase === 'waiting' || phase === 'generating') && (
          <div className="step run">
            <div className="step-ico"></div>
            <div>
              <b>{phase === 'waiting' ? '대기 중…' : '생성 중…'}</b>
              <small>{phase === 'waiting' ? '최근 대화 5개 범위를 확인하고 있어요.' : '프롬프팅 피드백을 만들고 있어요.'}</small>
            </div>
          </div>
        )}
        {phase === 'done' && result && (
          <>
            {result.items.map((item, i) => {
              const meta = LF_STATE_META[item.state];
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
            <div className="lf-coach">코칭 · {result.coaching}</div>
            <p className="lf-cooldown">5분 동안 추가 요청은 제한돼요.</p>
          </>
        )}
      </div>
    </div>
  );
}
