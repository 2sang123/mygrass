// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { format, startOfYear, endOfYear } from 'date-fns';

type GrassData = { date: string; count: number; note?: string };

const GrassSection = ({ title, data, onAdd, colorClass, icon }: any) => (
  <div className="mb-12">
    <div className="flex items-center justify-between mb-3 px-1">
      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
      <button 
        onClick={onAdd}
        className="group relative flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-all"
        title="오늘의 기록 추가"
      >
        <span className="text-gray-600 group-hover:text-indigo-600 font-bold">+</span>
      </button>
    </div>
    
    <div className={`relative p-6 bg-white rounded-2xl shadow-sm border border-gray-100 ${colorClass}`}>
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
        transformDayElement={(element, value) => {
          // 마우스 오버 시 툴팁이나 효과를 넣을 수 있는 자리입니다.
          return React.cloneElement(element as React.ReactElement, {
            rx: 2, ry: 2, // 잔디 둥글기 조절
          });
        }}
      />
      {/* 하단 범례(Legend) */}
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
  const [programming, setProgramming] = useState<GrassData[]>([]);
  const [art, setArt] = useState<GrassData[]>([]);
  const [career, setCareer] = useState<GrassData[]>([]);

  useEffect(() => {
    const savedP = localStorage.getItem('grass-p');
    const savedA = localStorage.getItem('grass-a');
    const savedC = localStorage.getItem('grass-c');
    if (savedP) setProgramming(JSON.parse(savedP));
    if (savedA) setArt(JSON.parse(savedA));
    if (savedC) setCareer(JSON.parse(savedC));
  }, []);

  const addGrass = (type: 'p' | 'a' | 'c') => {
    const note = prompt("오늘 어떤 일을 하셨나요? (간단한 메모)");
    if (note === null) return; // 취소 누르면 중단

    const today = format(new Date(), 'yyyy-MM-dd');
    const update = (prev: GrassData[]) => {
      const existing = prev.find(d => d.date === today);
      let newData;
      if (existing) {
        newData = prev.map(d => d.date === today ? { ...d, count: d.count + 1, note: note || d.note } : d);
      } else {
        newData = [...prev, { date: today, count: 1, note: note || "" }];
      }
      return newData;
    };

    if (type === 'p') {
      const next = update(programming); setProgramming(next); localStorage.setItem('grass-p', JSON.stringify(next));
    } else if (type === 'a') {
      const next = update(art); setArt(next); localStorage.setItem('grass-a', JSON.stringify(next));
    } else {
      const next = update(career); setCareer(next); localStorage.setItem('grass-c', JSON.stringify(next));
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA] p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">GROWTH DASHBOARD</h1>
          <p className="text-sm text-gray-500">꾸준함이 만드는 나만의 3색 성취 기록</p>
        </header>
        
        <GrassSection title="Programming" icon="💻" data={programming} onAdd={() => addGrass('p')} colorClass="grass-blue" />
        <GrassSection title="Art & Design" icon="🎨" data={art} onAdd={() => addGrass('a')} colorClass="grass-orange" />
        <GrassSection title="Career Path" icon="🚀" data={career} onAdd={() => addGrass('c')} colorClass="grass-green" />
      </div>

      <style jsx global>{`
        /* 공통 스타일링 */
        .react-calendar-heatmap text { font-size: 10px; fill: #9ca3af; font-weight: 500; }
        .react-calendar-heatmap .color-empty { fill: #f3f4f6; }
        
        /* 테마별 색상 */
        .grass-blue .color-scale-1 { fill: #dbeafe; } .grass-blue .color-scale-4 { fill: #2563eb; } .grass-blue .color-box { bg-blue-500; fill: #2563eb; }
        .grass-orange .color-scale-1 { fill: #ffedd5; } .grass-orange .color-scale-4 { fill: #f97316; } .grass-orange .color-box { bg-orange-500; fill: #f97316; }
        .grass-green .color-scale-1 { fill: #dcfce7; } .grass-green .color-scale-4 { fill: #16a34a; } .grass-green .color-box { bg-green-500; fill: #16a34a; }
        
        /* 범례 박스 색상 강제 지정 */
        .grass-blue .color-box { background-color: #2563eb; }
        .grass-orange .color-box { background-color: #f97316; }
        .grass-green .color-box { background-color: #16a34a; }
      `}</style>
    </main>
  );
}