import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  CRITERIA_ORDER, CRITERION_LABEL, REPORT_STATUS_BADGE, REPORT_STATUS_LABEL, WORK_TYPE_LABEL,
} from '../utils/coachingReport';

const FAILURE_MESSAGE = { TIMED_OUT: '처리 시간이 지나 리포트를 만들지 못했어요.' };

const ICON = {
  good: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>,
  warn: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 8v5M12 16.5v.5" /><circle cx="12" cy="12" r="9" /></svg>,
  error: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 9l-6 6M9 9l6 6" /><circle cx="12" cy="12" r="9" /></svg>,
};

function formatTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function score(value) {
  return <span className="tc-score">{value.toFixed(1)}<small>/2</small></span>;
}

// 지표 ID 앞부분(g1, g2…)이 업무 유형·기준 버전 그룹이다. 서버가 공개하지 않은 항목은 지표가 없다
function groupMetrics(metrics) {
  const groups = new Map();
  for (const m of metrics) {
    const key = m.metricId.split('.')[0];
    if (!groups.has(key)) {
      groups.set(key, { key, workType: m.workType, rubricVersion: m.rubricVersion, finalized: m.finalizedEvaluations, byCriterion: {} });
    }
    groups.get(key).byCriterion[m.criterion] = m;
  }
  return [...groups.values()];
}

function MetricRow({ criterion, metric }) {
  if (!metric) {
    return (
      <div className="tc-metric is-hidden">
        <span className="tc-metric-name">{CRITERION_LABEL[criterion]}</span>
        <span className="tc-metric-note">비공개 · 채점된 평가 인원이 공개 기준에 못 미쳐요</span>
      </div>
    );
  }
  const good = metric.band === 'strength';
  return (
    <div className="tc-metric">
      <span className="tc-metric-name">{CRITERION_LABEL[criterion]}</span>
      <div className="tc-bar"><span className={good ? 'good' : 'warn'} style={{ width: `${(metric.meanScore / 2) * 100}%` }} /></div>
      {score(metric.meanScore)}
      <span className={`badge ${good ? 'badge-green' : 'badge-amber'}`}>{good ? '강점' : '보완'}</span>
      <span className="tc-metric-note">관측 {metric.scoredEvaluations}/{metric.finalizedEvaluations}건 · {metric.coveragePercent}%</span>
    </div>
  );
}

function Insight({ metric, recommendation }) {
  if (!metric) return null;
  return (
    <div className="tc-insight">
      <div className="tc-insight-top">
        <b>{CRITERION_LABEL[metric.criterion]}</b>
        <span className="task-sub">{WORK_TYPE_LABEL[metric.workType] || metric.workType}</span>
        {score(metric.meanScore)}
      </div>
      <p>관측 평가 {metric.scoredEvaluations}건의 평균이에요. 확정 평가 {metric.finalizedEvaluations}건 중 {metric.coveragePercent}%에서 이 항목이 채점됐어요.</p>
      {recommendation && <div className="rubric-coach"><b>추천 활동</b>{recommendation}</div>}
    </div>
  );
}

function Limitations({ items }) {
  if (!items?.length) return null;
  return (
    <details className="card tc-limits">
      <summary>읽기 전에 알아둘 점 <span className="task-sub">{items.length}개</span></summary>
      <ul>{items.map((l, i) => <li key={i}>{l}</li>)}</ul>
    </details>
  );
}

function StateCard({ tone, title, children }) {
  return (
    <div className={`card tc-state is-${tone}`}>
      {tone === 'wait' ? <span className="tc-pulse" /> : <span className={`tc-ico ${tone}`}>{ICON[tone]}</span>}
      <div>
        <b>{title}</b>
        {children}
      </div>
    </div>
  );
}

function ReportBody({ report, evaluation, onDashboard }) {
  const metrics = report.metrics || [];
  const strengths = report.strengths || [];
  const improvements = report.improvements || [];
  const byId = Object.fromEntries(metrics.map((m) => [m.metricId, m]));

  if (report.status !== 'generated') {
    const withheld = report.status === 'withheld';
    return (
      <>
        <StateCard tone="warn" title={withheld ? '집계 승인 전이라 리포트를 보류했어요' : '공개할 수 있는 지표가 없어요'}>
          <p>
            {withheld
              ? `이 기간에 확정 평가가 있는 업무 유형 중 집계 승인이 안 된 유형이 있어요. 팀 대시보드에서 같은 기간(${evaluation.periodFrom} ~ ${evaluation.periodTo})으로 집계 승인한 뒤 새 리포트를 만들어 주세요.`
              : '최소 집계 인원을 넘은 평가 항목이 없어 수치를 만들지 않았어요. 확정된 평가가 더 쌓이면 다시 만들어 주세요.'}
          </p>
          {withheld && <button className="btn btn-sm" onClick={onDashboard}>팀 대시보드로</button>}
        </StateCard>
        <Limitations items={report.limitations} />
      </>
    );
  }

  return (
    <>
      <div className="card tc-hero">
        <div>
          <div className="tc-eyebrow">요약</div>
          <p className="tc-summary">{report.summary}</p>
          <div className="tc-meta">요청 {formatTime(evaluation.requestedAt)} · 완료 {formatTime(evaluation.completedAt)}</div>
        </div>
        <div className="tc-hero-stats">
          <div><span>공개 지표</span><b>{metrics.length}</b></div>
          <div className="is-good"><span>강점</span><b>{strengths.length}</b></div>
          <div className="is-warn"><span>보완점</span><b>{improvements.length}</b></div>
        </div>
      </div>

      <div className="tc-section-head">
        <h2>항목별 집계</h2>
        <p>업무 유형·평가 기준 버전별로 따로 집계해요. 공개 기준을 넘은 항목만 점수를 보여줘요.</p>
      </div>
      {groupMetrics(metrics).map((g) => (
        <div className="card tc-group" key={g.key}>
          <div className="tc-group-head">
            <b>{WORK_TYPE_LABEL[g.workType] || g.workType}</b>
            <span className="chip chip-xs">기준 {g.rubricVersion}</span>
            <span className="task-sub">확정 평가 {g.finalized}건</span>
          </div>
          {CRITERIA_ORDER.map((c) => <MetricRow key={c} criterion={c} metric={g.byCriterion[c]} />)}
        </div>
      ))}

      <div className="tc-insights">
        <div className="card tc-insight-card">
          <div className="widget-title"><span className="tc-ico good">{ICON.good}</span>강점</div>
          {strengths.length === 0
            ? <p className="tc-empty">이번 기간에는 강점 후보(평균 1.5점 이상) 항목이 없어요.</p>
            : strengths.map((s) => <Insight key={s.metricId} metric={byId[s.metricId]} />)}
        </div>
        <div className="card tc-insight-card">
          <div className="widget-title"><span className="tc-ico warn">{ICON.warn}</span>보완점</div>
          {improvements.length === 0
            ? <p className="tc-empty">이번 기간에는 보완 후보(평균 1.5점 미만) 항목이 없어요.</p>
            : improvements.map((s) => <Insight key={s.metricId} metric={byId[s.metricId]} recommendation={s.recommendation} />)}
        </div>
      </div>

      <Limitations items={report.limitations} />
    </>
  );
}

export default function TeamCoachingReportDetailPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { profile } = useApp();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let timer;
    let cancelled = false;
    setDetail(null);
    setError('');

    // 생성 중(대기)이면 끝날 때까지 다시 조회한다
    function poll() {
      api.get(`/api/teams/${profile.teamId}/evaluations/${requestId}`)
        .then((d) => {
          if (cancelled) return;
          setDetail(d);
          if (d.evaluation.status === '대기') timer = setTimeout(poll, 2500);
        })
        .catch((err) => { if (!cancelled) setError(err.message); });
    }
    poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [profile.teamId, requestId]);

  const report = detail?.report;
  const evaluation = detail?.evaluation;
  const done = evaluation?.status === '완료' && report;

  return (
    <section className="page active">
      <div className="topheader">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button className="btn-back" onClick={() => navigate('/dashboard/coaching')} title="목록으로">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <h1>팀 코칭 리포트</h1>
        </div>
        {done && <span className={`badge ${REPORT_STATUS_BADGE[report.status] || 'badge-gray'}`}>{REPORT_STATUS_LABEL[report.status] || report.status}</span>}
        {evaluation?.status === '대기' && <span className="badge badge-blue">생성 중</span>}
        {evaluation?.status === '실패' && <span className="badge badge-red">실패</span>}
      </div>
      {evaluation && (
        <div className="page-sub"><p>{evaluation.periodFrom} ~ {evaluation.periodTo}{profile.teamName ? ` · ${profile.teamName}` : ''}</p></div>
      )}

      {error && <StateCard tone="error" title="리포트를 불러오지 못했어요"><p>{error}</p></StateCard>}
      {!error && !detail && <p className="task-sub">불러오는 중…</p>}
      {evaluation?.status === '대기' && (
        <StateCard tone="wait" title="리포트를 만들고 있어요">
          <p>확정된 평가를 집계해 코칭 포인트를 고르는 중이에요. 보통 10초 안에 끝나요.</p>
        </StateCard>
      )}
      {evaluation?.status === '실패' && (
        <StateCard tone="error" title="리포트를 만들지 못했어요">
          <p>{FAILURE_MESSAGE[evaluation.error] || '처리 중 오류가 발생했어요.'} 목록에서 같은 기간으로 다시 생성해 주세요.</p>
          {evaluation.error && <div className="tc-meta">오류 코드 {evaluation.error}</div>}
          <button className="btn btn-sm" onClick={() => navigate('/dashboard/coaching')}>목록으로</button>
        </StateCard>
      )}
      {done && <ReportBody report={report} evaluation={evaluation} onDashboard={() => navigate('/dashboard')} />}
    </section>
  );
}
