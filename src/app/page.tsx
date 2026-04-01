// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { format, startOfYear, endOfYear } from 'date-fns';
import { supabase } from '@/lib/supabase'; // 아까 만든 설정 파일

type GrassData = { date: string; count: number; note?: string };

const GrassSection = ({ title, data, onAdd, colorClass, icon, isLoading }: any) => (
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

  // 1. DB에서 데이터 불러오기
  const fetchRecords = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('grass_records').select('*');
    
    if (error) {
      console.error('Error fetching:', error);
    } else if (data) {
      // 카테고리별로 데이터 분류
      const newRecords = { p: [], a: [], c: [] };
      data.forEach(item => {
        const target = newRecords[item.category as 'p'|'a'|'c'];
        const existing = target.find(d => d.date === item.date);
        if (existing) {
          existing.count += item.count;
        } else {
          target.push({ date: item.date, count: item.count, note: item.note });
        }
      });
      setRecords(newRecords);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);

  // 2. DB에 데이터 저장하기
  const addGrass = async (category: 'p' | 'a' | 'c') => {
    const note = prompt("오늘 어떤 일을 하셨나요?");
    if (note === null) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    
    const { error } = await supabase.from('grass_records').insert([
      { category, date: today, count: 1, note }
    ]);

    if (error) {
      alert('저장 실패: ' + error.message);
    } else {
      fetchRecords(); // 저장 후 다시 불러와서 화면 갱신
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA] p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2 uppercase">My 3-Color Grass</h1>
          <p className="text-sm text-gray-500">기기 간 동기화가 활성화된 대시보드</p>
        </header>
        
        <GrassSection title="Programming" icon="💻" data={records.p} onAdd={() => addGrass('p')} colorClass="grass-blue" isLoading={isLoading} />
        <GrassSection title="Art & Design" icon="🎨" data={records.a} onAdd={() => addGrass('a')} colorClass="grass-orange" isLoading={isLoading} />
        <GrassSection title="Career Path" icon="🚀" data={records.c} onAdd={() => addGrass('c')} colorClass="grass-green" isLoading={isLoading} />
      </div>

      <style jsx global>{`
        .react-calendar-heatmap text { font-size: 10px; fill: #9ca3af; font-weight: 500; }
        .react-calendar-heatmap .color-empty { fill: #f3f4f6; }
        .grass-blue .color-scale-1 { fill: #dbeafe; } .grass-blue .color-scale-4 { fill: #2563eb; } .grass-blue .color-box { background-color: #2563eb; }
        .grass-orange .color-scale-1 { fill: #ffedd5; } .grass-orange .color-scale-4 { fill: #f97316; } .grass-orange .color-box { background-color: #f97316; }
        .grass-green .color-scale-1 { fill: #dcfce7; } .grass-green .color-scale-4 { fill: #16a34a; } .grass-green .color-box { background-color: #16a34a; }
      `}</style>
    </main>
  );
}