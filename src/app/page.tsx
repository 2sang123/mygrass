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
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const startDate = startOfYear(new Date());
  const endDate = endOfYear(new Date());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    setIsUploading(true);
    await onAdd(inputValue.trim()); // 기존의 addGrass 함수를 호출
    setInputValue("");
    setIsInputOpen(false);
    setIsUploading(false);
  };
  
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>{icon}</span> {title}
        </h2>
        <button 
          onClick={() => setIsInputOpen(!isInputOpen)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm transition-all active:scale-90 ${isInputOpen ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-400'}`}
        >
          <span className="font-bold">{isInputOpen ? '×' : '+'}</span>
        </button>
      </div>
      {isInputOpen && (
        <form onSubmit={handleSubmit} className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-white p-4 rounded-2xl border-2 border-blue-100 shadow-lg">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="오늘 어떤 성장을 하셨나요? 길게 작성하셔도 좋습니다."
              className="w-full min-h-[100px] p-3 text-sm bg-gray-50 border-none rounded-xl focus:ring-0 resize-none mb-3"
            />
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsInputOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600"
              >
                취소
              </button>
              <button 
                type="submit"
                disabled={isUploading}
                className="px-6 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-blue-600 disabled:bg-gray-300 transition-all"
              >
                {isUploading ? '저장 중...' : '기록하기 (이미지 선택)'}
              </button>
            </div>
          </div>
        </form>
      )}


      {/* pt-12로 상단 여백 확보 */}
      <div className={`relative p-6 pt-12 pb-6 bg-white rounded-3xl shadow-sm border border-gray-100 ${colorClass}`}>
        {isLoading ? (
          <div className="h-[100px] flex items-center justify-center text-gray-400 text-sm font-medium">
            데이터 동기화 중...
          </div>
        ) : (
          /* [중요] flex와 items-stretch를 사용해 잔디와 요일 높이를 동기화합니다. */
          <div className="heatmap-container flex items-stretch gap-2 min-h-[110px]">
            
            {/* [PC용 요일] 840px 이상에서만 표시 */}
            <div 
              className="pc-weekday-labels flex flex-col justify-between text-slate-400 font-bold select-none shrink-0"
              style={{ 
                width: '18px', 
                height: 'auto', 
                aspectRatio: '7 / 45', 
                fontSize: '10px',
                paddingTop: '1.2rem',
                paddingBottom: '0.2rem'
              }}
            >
              <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
            </div>

            {/* 2. 잔디밭 영역 */}
            <div className="flex-1 overflow-visible">
              {/* [PC용 잔디] 840px 이상에서 요일 라벨 없이 표시 */}
              <div className="pc-heatmap">
                <CalendarHeatmap
                  startDate={startDate}
                  endDate={endDate}
                  values={data}
                  showWeekdayLabels={false}
                  classForValue={(value) => {
                    if (!value || value.count === 0) return 'color-empty';
                    return `color-scale-${Math.min(value.count, 4)}`;
                  }}
                  onClick={(value) => { if (value && value.note) onSelect(value); }}
                  transformDayElement={(element) => React.cloneElement(element, { rx: 2.5, ry: 2.5 })}
                />
              </div>

            {/* [모바일용 잔디] 840px 미만에서 월수금 라벨 포함하여 표시 */}
              <div className="mobile-heatmap">
                <CalendarHeatmap
                  startDate={startDate}
                  endDate={endDate}
                  values={data}
                  showWeekdayLabels={true}
                  weekdayLabels={['', '월', '', '수', '', '금', '']}
                  classForValue={(value) => {
                    if (!value || value.count === 0) return 'color-empty';
                    return `color-scale-${Math.min(value.count, 4)}`;
                  }}
                  onClick={(value) => { if (value && value.note) onSelect(value); }}
                  transformDayElement={(element) => React.cloneElement(element, { rx: 2.5, ry: 2.5 })}
                />
              </div>
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
          width: 100%;
          height: auto;
          overflow: visible !important;
        }
        /* 1. PC 모드 (840px 이상) */
        @media (min-width: 841px) {
          .pc-weekday-labels { display: flex !important; }
          .pc-heatmap { display: block !important; }
          .mobile-heatmap { display: none !important; }
        }

        /* 2. 모바일/태블릿 모드 (840px 이하) */
        @media (max-width: 840px) {
          .pc-weekday-labels { display: none !important; }
          .pc-heatmap { display: none !important; }
          .mobile-heatmap { display: block !important; }

          .heatmap-container {
            overflow-x: auto;
            padding-bottom: 15px;
            gap: 0px !important;
          }
          
          /* 스크롤 시 잔디 형태 보존 */
          .mobile-heatmap {
            min-width: 800px; 
          }
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
  const [selectedDate, setSelectedDate] = useState(null);
  const [allStreaks, setAllStreaks] = useState({ total: {current:0, max:0}, p: {current:0, max:0}, a: {current:0, max:0}, c: {current:0, max:0} });
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");

  // 1. 할 일 목록 불러오기
  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setTodos([...data]);
  };

  // 2. 잔디 기록 불러오기 (하나만 남깁니다)
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
          if (!existing.image_url && item.image_url) {
            existing.image_url = item.image_url;
          }
        } else {
          target.push({ 
            date: item.date, 
            count: 1, 
            note: `• ${item.note}`,
            image_url: item.image_url 
          });
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

  // 3. 초기 실행 (딱 한 번만 호출하도록 정리)
  useEffect(() => {
    fetchRecords();
    fetchTodos();
  }, []);

  // 4. 할 일 추가 로직
  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    const { error } = await supabase.from('todos').insert([{ content: newTodo.trim() }]);
    if (!error) {
      setNewTodo("");
      fetchTodos();
    }
  };

  // 5. 할 일 체크 토글
  const toggleTodo = async (id: string, currentState: boolean) => {
    await supabase.from('todos').update({ is_completed: !currentState }).eq('id', id);
    fetchTodos();
  };

  // 6. 할 일 삭제
  const deleteTodo = async (id: string) => {
    await supabase.from('todos').delete().eq('id', id);
    fetchTodos();
  };

  // 7. 잔디 추가 로직 (addGrass)
  const addGrass = async (category: 'p' | 'a' | 'c', note: string) => {

    const wantImage = confirm("이미지도 함께 업로드하시겠습니까?");

    if (wantImage) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      let uploadedUrl = null;

      if (file) {
        const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
        const { error: uploadError } = await supabase.storage.from('grass-image').upload(fileName, file);
        if (!uploadError) {
          const { data } = supabase.storage.from('grass-image').getPublicUrl(fileName);
          uploadedUrl = data.publicUrl;
        }
      }
      await finalSave(uploadedUrl);
    };
    fileInput.click();
  } else {
    await finalSave(null);
  }

      async function finalSave(imageUrl: string | null) {
      const { error: dbError } = await supabase.from('grass_records').insert([
        { 
          category, 
          date: format(new Date(), 'yyyy-MM-dd'), 
          count: 1, 
          note: note, // GrassSection에서 받은 note 사용
          image_url: imageUrl 
        }
      ]);
      if (!dbError) fetchRecords();
    }
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
        <section className="mb-12 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            ✅ Today's Focus
          </h2>
          
          <form onSubmit={addTodo} className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="오늘의 목표를 입력하세요..."
              className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button type="submit" className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all active:scale-95">
              추가
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todos.map((todo) => (
              <div key={todo.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group transition-all hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={todo.is_completed}
                    onChange={() => toggleTodo(todo.id, todo.is_completed)}
                    className="w-5 h-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className={`text-sm font-medium ${todo.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {todo.content}
                  </span>
                </div>
                <button 
                  onClick={() => deleteTodo(todo.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            ))}
          </div>
        </section>
        <GrassSection title="Programming" icon="💻" data={records.p} onAdd={(note) => addGrass('p',note)} onSelect={setSelectedDate} colorClass="grass-blue" isLoading={isLoading} />
        <GrassSection title="Art & Design" icon="🎨" data={records.a} onAdd={(note) => addGrass('a', note)} onSelect={setSelectedDate} colorClass="grass-orange" isLoading={isLoading} />
        <GrassSection title="Career Path" icon="🚀" data={records.c} onAdd={(note) => addGrass('c', note)} onSelect={setSelectedDate} colorClass="grass-green" isLoading={isLoading} />
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
              {selectedDate.image_url && (
                <div className="mb-4 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <img 
                    src={selectedDate.image_url} 
                    alt="기록 이미지" 
                    className="w-full h-auto object-cover max-h-[250px] hover:scale-105 transition-transform duration-300" 
                  />
                </div>
              )}
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