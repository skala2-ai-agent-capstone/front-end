import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function TeamDashboardPage() {
  const { toast } = useApp();
  const [approved, setApproved] = useState(false);

  function approveDashboard() {
    setApproved(true);
    toast('이번 주 집계를 승인했어요.');
  }

  function exportReport() {
    const rows = [
      ['항목', '값'],
      ['팀', '영업1팀'],
      ['기간', '10.14 - 10.20'],
      ['수집 건수', '248'],
      ['평가 처리율', '92%'],
      ['미관측 비율', '11%'],
      ['집계 대상', '34명'],
      ['반복 보완점 1위', '결과 검증 누락 (18건)'],
      ['반복 보완점 2위', '가격 정책 대조 오류 (12건)'],
      ['반복 보완점 3위', '요구사항 누락 표시 (9건)'],
    ];
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '팀대시보드_2026-10-14_10-20.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast('리포트를 내보냈어요.');
  }

  return (
    <section className="page active">
      <div className="topheader">
        <h1>팀 대시보드</h1>
        <div className="header-right">
          <div className="dchip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
            10.14 - 10.20
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ width: 10, height: 10 }}><path d="M6 9l6 6 6-6" /></svg>
          </div>
          <button className="btn btn-primary" onClick={approveDashboard} disabled={approved}>{approved ? '승인 완료' : '이번 주 집계 승인'}</button>
        </div>
      </div>
      <div className="page-sub"><p>영업1팀 · 업무 유형별 활용 역량과 반복 보완점을 확인하세요.</p></div>

      <div className="info-banner">
        {approved ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            <b>이번 주 집계가 승인됐습니다.</b>&nbsp;이번 주 수치가 팀원에게 공개됩니다.
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
            <b>집계 승인 마감까지 2일 남았습니다.</b>&nbsp;승인 전에는 지난 주 집계가 그대로 표시됩니다.
          </>
        )}
      </div>

      <div className="stat-row">
        <div className="card stat-card">
          <div className="stat-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 11l3 3L22 4" /></svg>수집 건수</div>
          <div className="stat-val">248</div>
          <div className="stat-delta up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 17l5-10 5 10" /></svg>12<span className="muted">· 지난주 대비</span></div>
        </div>
        <div className="card stat-card">
          <div className="stat-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19V10M12 19V5M20 19v-7" /></svg>평가 처리율</div>
          <div className="stat-val">92%</div>
          <div className="stat-delta up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 17l5-10 5 10" /></svg>3%p<span className="muted">· 지난주 대비</span></div>
        </div>
        <div className="card stat-card">
          <div className="stat-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /></svg>미관측 비율</div>
          <div className="stat-val">11%</div>
          <div className="stat-delta"><span className="muted">변화 없음</span></div>
        </div>
        <div className="card stat-card">
          <div className="stat-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>집계 대상</div>
          <div className="stat-val">34명</div>
          <div className="stat-delta"><span className="muted">4개 업무 유형</span></div>
        </div>
      </div>

      <div className="widget-row">
        <div className="card widget">
          <div className="widget-head">
            <div className="widget-title"><div className="widget-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg></div>주간 평가 건수 추이</div>
            <div className="more-link">더 보기<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg></div>
          </div>
          <div className="area-chart">
            <div className="area-tip" style={{ left: '58%', top: 4 }}><b>340건</b>목 · 10.17 ↗5.2%</div>
            <svg viewBox="0 0 400 150" preserveAspectRatio="none">
              <line x1="230" y1="0" x2="230" y2="150" stroke="#D8D9E2" strokeWidth="1" strokeDasharray="4 4" />
              <polyline points="0,110 50,70 100,90 150,60 200,75 230,50 280,65 330,55 400,40" fill="none" stroke="#665EFD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="230" cy="50" r="4" fill="#4434D4" />
            </svg>
          </div>
          <div className="axis-row"><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span><span>일</span></div>
        </div>
        <div className="card widget">
          <div className="widget-head"><div className="widget-title"><div className="widget-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg></div>반복 보완점 Top 3</div></div>
          <div className="list-row"><span className="l">결과 검증 누락</span><span className="badge badge-amber">18건</span></div>
          <div className="list-row"><span className="l">가격 정책 대조 오류</span><span className="badge badge-amber">12건</span></div>
          <div className="list-row"><span className="l">요구사항 누락 표시</span><span className="badge badge-gray">9건</span></div>
        </div>
      </div>

      <div className="card" style={{ padding: '15px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="badge badge-gray">견적서 유형 · 집계 대상 4명 — 최소 인원(5명) 미달로 상세 통계 비공개</span>
        <button className="btn btn-ghost" onClick={exportReport}>리포트 내보내기</button>
      </div>
    </section>
  );
}
