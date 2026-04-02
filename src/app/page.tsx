// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { format, startOfYear, endOfYear } from 'date-fns';
import { supabase } from '../lib/supabase';

type GrassData = { date: string; count: number; note?: string };

// 1. GrassSection에 onSelect prop을 추가하여 부모의 함수를 쓸 수 있게 합니다.
const GrassSection = ({ title, data, onAdd, onSelect, colorClass, icon, isLoading }: any) => (
  <div className="mb-12">
    <div className="flex items-center justify-between mb-3 px-1">
      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
      <button 
        onClick={onAdd}
        disabled={isLoading}
        className="group relative flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50"
      >
        <span className="text-gray-600 group-hover:text-indigo-600 font-bold">+</span>
      </button>
    </div>
    
    <div className={`relative p-6 bg-white rounded-2xl shadow-sm border border-gray-100 ${colorClass}`}>
      {isLoading ? (
        <div className="h-[120px] flex items-center justify-center text-gray-400 text-sm">데이터 불러오는 중...</div>
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
          // 여기서 onSelect를 호출합니다.
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

export default function Home() {
  const [records, setRecords] = useState<{p: GrassData[], a: GrassData[], c: GrassData[]}>({ p: [], a: [], c: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<GrassData | null>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('grass_records').select('*');
    if (data) {
      const newRecords = { p: [], a: [], c: [] };
      data.forEach(item => {
        const target = newRecords[item.category as 'p'|'a'|'c'];
        const existing = target.find(d => d.date === item.date);
        if (existing) { existing.count += item.count; } 
        else { target.push({ date: item.date, count: item.count, note: item.note }); }
      });
      setRecords(newRecords);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);

  const addGrass = async (category: 'p' | 'a' | 'c') => {
    const note = prompt("오늘 어떤 일을 하셨나요?");
    if (note === null) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const { error } = await supabase.from('grass_records').insert([{ category, date: today, count: 1, note }]);
    if (!error) fetchRecords();
  };

  // 모달 컴포넌트 정의
  const DetailModal = () => {
    if (!selectedDate) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDate(null)}>
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm text-gray-500 font-medium">{selectedDate.date}</h3>
              <p className="text-xl font-bold text-gray-900">성장 기록</p>
            </div>
            <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 min-h-[100px] border border-gray-100 italic text-gray-700 whitespace-pre-wrap">
            "{selectedDate.note}"
          </div>
          <button onClick={() => setSelectedDate(null)} className="w-full mt-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors">닫기</button>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA] p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2 uppercase text-center">My 3-Color Grass</h1>
          <p className="text-sm text-gray-500 text-center">기기 간 동기화 & 상세 기록 보기</p>
        </header>
        
        {/* onSelect={setSelectedDate} 를 전달합니다. */}
        <GrassSection title="Programming" icon="💻" data={records.p} onAdd={() => addGrass('p')} onSelect={setSelectedDate} colorClass="grass-blue" isLoading={isLoading} />
        <GrassSection title="Art & Design" icon="🎨" data={records.a} onAdd={() => addGrass('a')} onSelect={setSelectedDate} colorClass="grass-orange" isLoading={isLoading} />
        <GrassSection title="Career Path" icon="🚀" data={records.c} onAdd={() => addGrass('c')} onSelect={setSelectedDate} colorClass="grass-green" isLoading={isLoading} />
      </div>

      {/* 중요: 모달을 화면에 렌더링합니다. */}
      <DetailModal />

      <style jsx global>{`
        .react-calendar-heatmap text { font-size: 10px; fill: #9ca3af; font-weight: 500; }
        .react-calendar-heatmap .color-empty { fill: #f3f4f6; cursor: default; }
        .react-calendar-heatmap rect { cursor: pointer; transition: transform 0.1s; }
        .react-calendar-heatmap rect:hover { transform: scale(1.1); transform-origin: center; }
        
        .grass-blue .color-scale-1 { fill: #dbeafe; } .grass-blue .color-scale-4 { fill: #2563eb; } .grass-blue .color-box { background-color: #2563eb; }
        .grass-orange .color-scale-1 { fill: #ffedd5; } .grass-orange .color-scale-4 { fill: #f97316; } .grass-orange .color-box { background-color: #f97316; }
        .grass-green .color-scale-1 { fill: #dcfce7; } .grass-green .color-scale-4 { fill: #16a34a; } .grass-green .color-box { background-color: #16a34a; }
      `}</style>
    </main>
  );
}