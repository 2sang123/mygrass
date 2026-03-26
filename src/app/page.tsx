"use client";
// @ts-ignore
import React, { useState, useEffect } from 'react';
// @ts-nocheck
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { format } from 'date-fns';

// 잔디 데이터 타입 정의
type GrassData = { date: string; count: number };

const GrassSection = ({ title, data, onAdd, colorClass }: any) => (
  <div className="mb-10">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-gray-700">{title}</h2>
      <button 
        onClick={onAdd}
        className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold transition"
      >
        + 오늘 기록
      </button>
    </div>
    <div className={`p-4 bg-white rounded-xl shadow-sm border ${colorClass}`}>
      <CalendarHeatmap
        startDate={new Date('2026-01-01')}
        endDate={new Date('2026-12-31')}
        values={data}
        classForValue={(value) => {
          if (!value || value.count === 0) return 'color-empty';
          return `color-scale-${Math.min(value.count, 5)}`; // 최대 5단계
        }}
        tooltipDataAttrs={(value: any) => ({
          'data-tip': value.date ? `${value.date}: ${value.count}회` : '기록 없음',
        })}
      />
    </div>
  </div>
);

export default function Home() {
  // 상태 관리 (localStorage에서 불러오거나 초기값 설정)
  const [programming, setProgramming] = useState<GrassData[]>([]);
  const [art, setArt] = useState<GrassData[]>([]);
  const [career, setCareer] = useState<GrassData[]>([]);

  // 처음에 페이지 로드될 때 데이터 불러오기
  useEffect(() => {
    const savedP = localStorage.getItem('grass-p');
    const savedA = localStorage.getItem('grass-a');
    const savedC = localStorage.getItem('grass-c');
    if (savedP) setProgramming(JSON.parse(savedP));
    if (savedA) setArt(JSON.parse(savedA));
    if (savedC) setCareer(JSON.parse(savedC));
  }, []);

  // 데이터 추가 함수
  const addGrass = (type: 'p' | 'a' | 'c') => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const update = (prev: GrassData[]) => {
      const existing = prev.find(d => d.date === today);
      let newData;
      if (existing) {
        newData = prev.map(d => d.date === today ? { ...d, count: d.count + 1 } : d);
      } else {
        newData = [...prev, { date: today, count: 1 }];
      }
      return newData;
    };

    if (type === 'p') {
      const next = update(programming);
      setProgramming(next);
      localStorage.setItem('grass-p', JSON.stringify(next));
    } else if (type === 'a') {
      const next = update(art);
      setArt(next);
      localStorage.setItem('grass-a', JSON.stringify(next));
    } else {
      const next = update(career);
      setCareer(next);
      localStorage.setItem('grass-c', JSON.stringify(next));
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black mb-10 text-center text-indigo-600 tracking-tighter">
          MY 3-COLOR GRASS
        </h1>
        
        <GrassSection title="💻 Programming" data={programming} onAdd={() => addGrass('p')} colorClass="grass-blue" />
        <GrassSection title="🎨 Art" data={art} onAdd={() => addGrass('a')} colorClass="grass-orange" />
        <GrassSection title="🚀 Career" data={career} onAdd={() => addGrass('c')} colorClass="grass-green" />
      </div>

      <style jsx global>{`
        .react-calendar-heatmap .color-empty { fill: #f3f4f6; }
        .grass-blue .color-scale-1 { fill: #bfdbfe; } .grass-blue .color-scale-5 { fill: #1d4ed8; }
        .grass-orange .color-scale-1 { fill: #fed7aa; } .grass-orange .color-scale-5 { fill: #ea580c; }
        .grass-green .color-scale-1 { fill: #bbf7d0; } .grass-green .color-scale-5 { fill: #15803d; }
        .react-calendar-heatmap rect { rx: 2px; } /* 잔디를 살짝 둥글게 */
      `}</style>
    </main>
  );
}