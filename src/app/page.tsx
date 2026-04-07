// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { format, startOfYear, endOfYear, subDays, isSameDay } from 'date-fns';
import { supabase } from '../lib/supabase';

// 1. 스트릭 계산 함수 (이전과 동일)
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
  // 월별 경계선을 계산하는 로직 (SVG Path 생성)
  const renderMonthBorders = () => {
    const startDate = startOfYear(new Date());
    const endDate = endOfYear(new Date());
    const paths = [];

    // 각 월의 시작 위치를 계산하여 테두리 경로를 생성
    for (let month = 1; month <= 11; month++) {
      const firstDayOfMonth = new Date(new Date().getFullYear(), month, 1);
      // 일주일은 7일이므로, 시작일로부터 몇 번째 주인지(X), 무슨 요일인지(Y) 계산
      const diffDays = Math.floor((firstDayOfMonth.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(diffDays / 7);
      const dayIndex = diffDays % 7;

      // 잔디 한 칸의 크기를 12(너비)+2(간격) 정도로 계산한 좌표값
      const x = weekIndex * 14 + 1.5; 
      const y1 = dayIndex * 14 + 1.5;

      // 계단 모양의 경로 생성 (M: 이동, L: 선 그리기)
      paths.push(
        <path
          key={month}
          d={`M ${x} 100 L ${x} ${y1} L ${x + 14} ${y1} L ${x + 14} 0`}
          fill="none"
          stroke="#e5e7eb" // 연한 회색 테두리
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      );
    }
    return paths;
  };
  return (
  <div className="mb-12">
    <div className="flex items-center justify-between mb-3 px-1">
      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>{icon}</span> {title}
        </h2>
      <button onClick={onAdd} className="..."> + </button>
    </div>
    
    <div className={`relative p-6 bg-white rounded-2xl shadow-sm border border-gray-100 ${colorClass}`}>
        {/* 실제 날짜 기반 월별 경계선 레이어 */}
        <div className="absolute inset-0 p-6 pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 800 110" preserveAspectRatio="none" className="opacity-60">
            {renderMonthBorders()}
          </svg>
        </div>

      {isLoading ? (
        <div className="...">불러오는 중...</div>
      ) : (
        <CalendarHeatmap
          startDate={startOfYear(new Date())}
          endDate={endOfYear(new Date())}
          values={data}
          showWeekdayLabels={true}
          weekdayLabels={['', '월', '', '수', '', '금', '']}
          classForValue={(value) => {
            if (!value || value.count === 0) return 'color-empty';
            return `color-scale-${Math.min(value.count, 4)}`;
          }}
          onClick={(value) => {
            if (value && value.note) onSelect(value);
          }}
          transformDayElement={(element) => React.cloneElement(element as React.ReactElement, { rx: 2, ry: 2 })}
        />
      )}
      <div className="flex justify-end items-center gap-2 mt-4 text-[10px] text-gray-400 font-medium">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-[2px] bg-gray-100"></div>
          <div className="w-2.5 h-2.5 rounded-[2px] opacity-30 color-box"></div>
          <div className="w-2.5 h-2.5 rounded-[2px] opacity-60 color-box"></div>
          <div className="w-2.5 h-2.5 rounded-[2px] opacity-100 color-box"></div>
        </div>
        <span>More</span>
      </div>
    </div>
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
          // 메모 개선: 기존 메모에 줄바꿈하고 새 메모 추가 (타임라인 방식)
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
    <div className={`flex-1 min-w-[120px] p-4 bg-white rounded-2xl shadow-sm border-b-4 ${colorClass} border-x border-t border-gray-100`}>
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
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
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
        .react-calendar-heatmap text { font-size: 10px; fill: #9ca3af; font-weight: 600; }
        .react-calendar-heatmap .color-empty { fill: #f8f9fa; }
        
        /* 호버 시 위치 이동 제거, 테두리 강조만 남김 */
        .react-calendar-heatmap rect { 
          cursor: pointer; 
          transition: stroke 0.2s, stroke-width 0.2s; 
        }
        .react-calendar-heatmap rect:hover { 
          stroke: #4b5563; 
          stroke-width: 0.6px;
        }
        
        .grass-blue .color-scale-1 { fill: #e0e7ff; } .grass-blue .color-scale-4 { fill: #3730a3; } .grass-blue .color-box { background-color: #3730a3; }
        .grass-orange .color-scale-1 { fill: #ffedd5; } .grass-orange .color-scale-4 { fill: #9a3412; } .grass-orange .color-box { background-color: #9a3412; }
        .grass-green .color-scale-1 { fill: #dcfce7; } .grass-green .color-scale-4 { fill: #166534; } .grass-green .color-box { background-color: #166534; }
      `}</style>
    </main>
  );
}