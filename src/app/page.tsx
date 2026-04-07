// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { format, startOfYear, endOfYear, subDays, isSameDay } from 'date-fns';
import { supabase } from '../lib/supabase';

// 1. 스트릭 계산 함수
const calculateStreak = (dates: string[]) => {
  if (dates.length === 0) return { current: 0, max: 0 };
  const sortedDates = [...new Set(dates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;

  const lastRecordDate = sortedDates[0];
  const isEligibleForCurrent = isSameDay(new Date(lastRecordDate), new Date()) || 
                               isSameDay(new Date(lastRecordDate), subDays(new Date(), 1));

  if (isEligibleForCurrent) {
    let checkDate = new Date(lastRecordDate);
    for (const d of sortedDates) {
      if (isSameDay(new Date(d), checkDate)) { currentStreak++; checkDate = subDays(checkDate, 1); } 
      else break;
    }
  }

  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) tempStreak = 1;
    else {
      const prevDate = subDays(new Date(sortedDates[i-1]), 1);
      if (isSameDay(new Date(sortedDates[i]), prevDate)) tempStreak++;
      else tempStreak = 1;
    }
    maxStreak = Math.max(maxStreak, tempStreak);
  }
  return { current: currentStreak, max: maxStreak };
};

const GrassSection = ({ title, data, onAdd, onSelect, colorClass, icon, isLoading }: any) => {
  const startDate = startOfYear(new Date());
  const endDate = endOfYear(new Date());
  
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>{icon}</span> {title}
        </h2>
        <button 
          onClick={onAdd}
          className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-all active:scale-90"
        >
          <span className="text-gray-400 font-bold">+</span>
        </button>
      </div>
      
      <div className={`relative p-6 pt-10 pb-4 bg-white rounded-3xl shadow-sm border border-gray-100 ${colorClass}`}>
        {isLoading ? (
          <div className="h-[100px] flex items-center justify-center text-gray-400 text-sm font-medium">
            데이터 동기화 중...
          </div>
        ) : (
          /* flex를 사용하여 요일 라벨과 잔디밭을 가로로 배치 */
          <div className="heatmap-container flex items-start gap-2">
            
            {/* 직접 만든 요일 라벨 영역 */}
            <div 
                className="flex flex-col text-[9px] font-bold text-slate-400 select-none"
                style={{ 
                  marginTop: '13px',    /* 월 라벨(Jan 등) 높이만큼 내려서 첫 칸에 맞춤 */
                  gap: '4.5px',         /* 잔디 칸 사이의 간격과 맞추기 위한 미세 조정 */
                  lineHeight: '8.5px'     /* 글자 자체의 높이 제어 */
                }}
              >
              <span>일</span>
              <span>월</span>
              <span>화</span>
              <span>수</span>
              <span>목</span>
              <span>금</span>
              <span>토</span>
            </div>

            <div className="flex-1 overflow-visible">
              <CalendarHeatmap
                startDate={startDate}
                endDate={endDate}
                values={data}
                showWeekdayLabels={false} // 라이브러리 요일은 끕니다.
                classForValue={(value) => {
                  if (!value || value.count === 0) return 'color-empty';
                  return `color-scale-${Math.min(value.count, 4)}`;
                }}
                onClick={(value) => {
                  if (value && value.note) onSelect(value);
                }}
                transformDayElement={(element) => React.cloneElement(element as React.ReactElement, { 
                  rx: 2.5, 
                  ry: 2.5 
                })}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end items-center gap-2 mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          <span>Less</span>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-[3px] bg-[#f8fafc] border border-gray-100"></div>
            <div className="w-3 h-3 rounded-[3px] opacity-25 color-box"></div>
            <div className="w-3 h-3 rounded-[3px] opacity-50 color-box"></div>
            <div className="w-3 h-3 rounded-[3px] opacity-75 color-box"></div>
            <div className="w-3 h-3 rounded-[3px] opacity-100 color-box"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      <style jsx global>{`
        .react-calendar-heatmap {
          margin-top: 0 !important;
          overflow: visible !important;
        }
        
        .heatmap-container {
          margin-bottom: -15px; /* 하단 여백 조절 */
        }

        .react-calendar-heatmap .react-calendar-heatmap-month-label {
          font-size: 11px !important;
          fill: #64748b !important;
          font-weight: 700 !important;
          transform: translateY(-10px) !important;
        }

        .react-calendar-heatmap .color-empty {
          fill: #f8fafc !important;
        }

        /* 단계별 색상 정의 */
        .grass-blue .color-scale-1 { fill: #dbeafe !important; }
        .grass-blue .color-scale-2 { fill: #93c5fd !important; }
        .grass-blue .color-scale-3 { fill: #3b82f6 !important; }
        .grass-blue .color-scale-4 { fill: #1e40af !important; }
        .grass-blue .color-box { background-color: #1e40af; }

        .grass-orange .color-scale-1 { fill: #ffedd5 !important; }
        .grass-orange .color-scale-2 { fill: #fdba74 !important; }
        .grass-orange .color-scale-3 { fill: #f97316 !important; }
        .grass-orange .color-scale-4 { fill: #9a3412 !important; }
        .grass-orange .color-box { background-color: #9a3412; }

        .grass-green .color-scale-1 { fill: #dcfce7 !important; }
        .grass-green .color-scale-2 { fill: #86efac !important; }
        .grass-green .color-scale-3 { fill: #22c55e !important; }
        .grass-green .color-scale-4 { fill: #166534 !important; }
        .grass-green .color-box { background-color: #166534; }

        .react-calendar-heatmap rect:hover {
          stroke: #94a3b8 !important;
          stroke-width: 1px !important;
        }
      `}</style>
    </div>
  );
};

export default function Home() {
  const [records, setRecords] = useState({ p: [], a: [], c: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<GrassData | null>(null);
  const [allStreaks, setAllStreaks] = useState({ total: {current:0, max:0}, p: {current:0, max:0}, a: {current:0, max:0}, c: {current:0, max:0} });

  const fetchRecords = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('grass_records').select('*').order('created_at', { ascending: true });
    
    if (data) {
      const newRecords = { p: [], a: [], c: [] };
      const dates = { p: [], a: [], c: [], total: [] };

      data.forEach(item => {
        dates.total.push(item.date);
        const target = newRecords[item.category];
        dates[item.category].push(item.date);

        const existing = target.find(d => d.date === item.date);
        if (existing) {
          existing.count += 1;
          existing.note += `\n• ${item.note}`;
        } else {
          target.push({ date: item.date, count: 1, note: `• ${item.note}` });
        }
      });

      setRecords(newRecords);
      setAllStreaks({
        total: calculateStreak(dates.total),
        p: calculateStreak(dates.p),
        a: calculateStreak(dates.a),
        c: calculateStreak(dates.c)
      });
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);

  const addGrass = async (category: 'p' | 'a' | 'c') => {
    const note = prompt("오늘 어떤 일을 하셨나요?");
    if (!note) return;
    const { error } = await supabase.from('grass_records').insert([
      { category, date: format(new Date(), 'yyyy-MM-dd'), count: 1, note }
    ]);
    if (!error) fetchRecords();
  };

  const StreakCard = ({ label, stats, colorClass }) => (
    <div className={`flex-1 min-w-[120px] p-4 bg-white rounded-2xl shadow-sm border-b-4 ${colorClass} border-x border-t border-gray-100 transition-transform active:scale-95`}>
      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-gray-900">{stats.current}</span>
        <span className="text-xs text-gray-400 font-medium font-sans">days</span>
      </div>
      <div className="text-[10px] text-gray-400 mt-1 font-sans">Max: {stats.max}d</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F8F9FA] p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase mb-8">My 3-Color Grass</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StreakCard label="🔥 Total" stats={allStreaks.total} colorClass="border-purple-500" />
            <StreakCard label="💻 Prog" stats={allStreaks.p} colorClass="border-blue-500" />
            <StreakCard label="🎨 Art" stats={allStreaks.a} colorClass="border-orange-500" />
            <StreakCard label="🚀 Career" stats={allStreaks.c} colorClass="border-green-500" />
          </div>
        </header>

        <GrassSection title="Programming" icon="💻" data={records.p} onAdd={() => addGrass('p')} onSelect={setSelectedDate} colorClass="grass-blue" isLoading={isLoading} />
        <GrassSection title="Art & Design" icon="🎨" data={records.a} onAdd={() => addGrass('a')} onSelect={setSelectedDate} colorClass="grass-orange" isLoading={isLoading} />
        <GrassSection title="Career Path" icon="🚀" data={records.c} onAdd={() => addGrass('c')} onSelect={setSelectedDate} colorClass="grass-green" isLoading={isLoading} />
      </div>

      {selectedDate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedDate(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xs text-blue-600 font-bold uppercase tracking-widest mb-1">{selectedDate.date}</h3>
                <p className="text-2xl font-black text-gray-900 leading-tight">성장 타임라인</p>
              </div>
              <button onClick={() => setSelectedDate(null)} className="text-gray-300 hover:text-gray-900 transition-colors text-2xl">×</button>
            </div>
            <div className="bg-gray-50 rounded-2xl p-5 max-h-[300px] overflow-y-auto border border-gray-100 shadow-inner">
              <div className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap font-medium">
                {selectedDate.note}
              </div>
            </div>
            <button onClick={() => setSelectedDate(null)} className="w-full mt-8 py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-blue-600 transition-all shadow-lg active:scale-95">확인</button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .grass-blue .color-scale-1 { fill: #e0e7ff !important; } .grass-blue .color-scale-4 { fill: #3730a3 !important; } .grass-blue .color-box { background-color: #3730a3; }
        .grass-orange .color-scale-1 { fill: #ffedd5 !important; } .grass-orange .color-scale-4 { fill: #9a3412 !important; } .grass-orange .color-box { background-color: #9a3412; }
        .grass-green .color-scale-1 { fill: #dcfce7 !important; } .grass-green .color-scale-4 { fill: #166534 !important; } .grass-green .color-box { background-color: #166534; }
      `}</style>
    </main>
  );
}