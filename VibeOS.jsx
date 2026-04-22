import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Folder, FileText, Settings, Monitor, Globe, Mail, Music, Video, Image as ImgIcon, 
  Pen, Code, GitBranch, Search, Palette, Smile, Wifi, HardDrive, Package, X, 
  Minus, Square, Maximize2, Play, Pause, Volume2, VolumeX, Plus, Trash2, Save, 
  Download, RefreshCw, User, Power, Bell, Activity, Send, ArrowLeft, ArrowRight, 
  Home, MessageSquare, Database, BarChart2, Cpu, Table, Film, Mic, Camera, 
  Archive, Hash, Server, ChevronDown, ChevronRight, ChevronLeft, ChevronUp, Edit,
  Moon, Sun, Eye, Rss, Zap, Star, Info, Grid, Clock, Calendar, CheckSquare,
  StickyNote, Terminal, Calculator as CalcIcon, Lock, Coffee, Radio, Layers, Type, Filter,
  CloudRain, MapPin, List, CheckCircle, Bookmark, SkipBack, SkipForward, Scissors
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// --- CONSTANTS & INITIAL STATE ---
const WALLPAPERS = [
  "linear-gradient(to right, #0f2027, #203a43, #2c5364)",
  "linear-gradient(to right, #12c2e9, #c471ed, #f64f59)",
  "linear-gradient(to bottom, #000000, #434343)",
  "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop"
];

// --- CORE UTILS ---
const safeEval = (str) => {
  try {
    return Function(`'use strict'; return (${str})`)();
  } catch {
    return "Error";
  }
};

// --- COMPONENTS ---

const Window = ({ app, onClose, onMinimize, onFocus, isFocused, children }) => {
  const [pos, setPos] = useState(app.initialPos || { x: 100 + (parseInt(app.id, 36) % 10) * 20, y: 100 + (parseInt(app.id, 36) % 10) * 20 });
  const [size, setSize] = useState({ w: app.width || 600, h: app.height || 400 });
  const [isMaximized, setIsMaximized] = useState(false);

  const handleDrag = (e) => {
    if (isMaximized) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...pos };

    const onMove = (me) => {
      setPos({
        x: startPos.x + (me.clientX - startX),
        y: startPos.y + (me.clientY - startY),
      });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div 
      onClick={onFocus}
      className={`absolute flex flex-col rounded-xl overflow-hidden shadow-2xl transition-all duration-75 border border-white/10 backdrop-blur-md ${isFocused ? 'z-50 ring-1 ring-cyan-500/50' : 'z-10 opacity-95'}`}
      style={{
        left: isMaximized ? 0 : pos.x,
        top: isMaximized ? 40 : pos.y,
        width: isMaximized ? '100%' : size.w,
        height: isMaximized ? 'calc(100vh - 88px)' : size.h,
      }}
    >
      <div 
        onMouseDown={handleDrag}
        onDoubleClick={() => setIsMaximized(!isMaximized)}
        className="h-10 bg-black/40 flex items-center justify-between px-4 cursor-default select-none border-b border-white/5"
      >
        <div className="flex items-center gap-2">
          {app.icon}
          <span className="text-xs font-bold text-white/80">{app.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onMinimize(); }} className="w-6 h-6 hover:bg-white/10 rounded flex items-center justify-center text-white/60"><Minus size={14}/></button>
          <button onClick={() => setIsMaximized(!isMaximized)} className="w-6 h-6 hover:bg-white/10 rounded flex items-center justify-center text-white/60"><Square size={10}/></button>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="w-6 h-6 hover:bg-red-500 rounded flex items-center justify-center text-white/60 hover:text-white"><X size={14}/></button>
        </div>
      </div>
      <div className="flex-1 bg-[#1a1b26] overflow-auto text-slate-300 relative custom-scrollbar">
        {children}
      </div>
    </div>
  );
};

// --- APP MODULES ---

const SnakeGame = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snakeHighScore');
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snakeHighScore', score.toString());
    }
  }, [score, highScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let snake = [{x: 10, y: 10}];
    let food = {x: 15, y: 15};
    let dx = 1;
    let dy = 0;
    const size = 20;
    const grid = 20;
    let gameLoop;

    const resetGame = () => {
      snake = [{x: 10, y: 10}];
      food = {x: 15, y: 15};
      dx = 1;
      dy = 0;
      setScore(0);
      setGameOver(false);
    };

    const gameStep = () => {
      if (gameOver) return;
      const head = {x: snake[0].x + dx, y: snake[0].y + dy};
      
      if (head.x < 0 || head.x >= grid || head.y < 0 || head.y >= grid || snake.some(s => s.x === head.x && s.y === head.y)) {
        setGameOver(true);
        return;
      }

      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        setScore(s => s + 10);
        food = {x: Math.floor(Math.random() * grid), y: Math.floor(Math.random() * grid)};
      } else {
        snake.pop();
      }

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= grid; i++) {
        ctx.beginPath();
        ctx.moveTo(i * size, 0);
        ctx.lineTo(i * size, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * size);
        ctx.lineTo(canvas.width, i * size);
        ctx.stroke();
      }
      
      ctx.fillStyle = '#10b981';
      snake.forEach((s, index) => {
        const gradient = ctx.createRadialGradient(
          s.x * size + size/2, s.y * size + size/2, 0,
          s.x * size + size/2, s.y * size + size/2, size
        );
        gradient.addColorStop(0, index === 0 ? '#34d399' : '#10b981');
        gradient.addColorStop(1, index === 0 ? '#059669' : '#047857');
        ctx.fillStyle = gradient;
        ctx.fillRect(s.x * size, s.y * size, size - 2, size - 2);
      });
      
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(food.x * size + size/2, food.y * size + size/2, size/2 - 2, 0, Math.PI * 2);
      ctx.fill();
    };

    gameLoop = setInterval(gameStep, 150);

    const handleKey = (e) => {
      if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -1; e.preventDefault(); }
      else if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 1; e.preventDefault(); }
      else if (e.key === 'ArrowLeft' && dx === 0) { dx = -1; dy = 0; e.preventDefault(); }
      else if (e.key === 'ArrowRight' && dx === 0) { dx = 1; dy = 0; e.preventDefault(); }
      else if (e.key === ' ' && gameOver) { resetGame(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => { clearInterval(gameLoop); window.removeEventListener('keydown', handleKey); };
  }, [gameOver, highScore]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-900 p-4">
      <div className="flex justify-between w-full max-w-[400px] mb-4 text-white font-mono">
        <div className="flex gap-4">
          <span>SCORE: <span className="text-cyan-400 font-bold">{score}</span></span>
          <span>HIGH: <span className="text-yellow-400 font-bold">{highScore}</span></span>
        </div>
        {gameOver && <span className="text-rose-500 font-bold animate-pulse">GAME OVER</span>}
      </div>
      <canvas ref={canvasRef} width={400} height={400} className="border-4 border-slate-700 rounded-lg shadow-2xl bg-black" />
      {gameOver && (
        <button onClick={() => { setGameOver(false); setScore(0); }} className="mt-4 px-6 py-2 bg-cyan-500 text-white rounded-lg font-bold hover:bg-cyan-600 transition-colors">
          RESTART (Space)
        </button>
      )}
      <div className="mt-4 text-slate-500 text-xs">Use Arrow Keys to move</div>
    </div>
  );
};

const PaintApp = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#06b6d4');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState('brush');
  const [lastPos, setLastPos] = useState(null);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX || e.touches?.[0]?.clientX) - rect.left,
      y: (e.clientY || e.touches?.[0]?.clientY) - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
    
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? '#000000' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    setIsDrawing(true);
    setLastPos(pos);
  };

  const draw = (e) => {
    if (!isDrawing || !lastPos) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPos(null);
  };

  const colors = ['#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="h-full flex flex-col bg-slate-100">
      <div className="h-14 bg-white border-b border-slate-300 flex items-center px-4 gap-4 shadow-sm">
        {/* Color Palette */}
        <div className="flex gap-1">
          {colors.map(c => (
            <button 
              key={c} 
              onClick={() => { setColor(c); setTool('brush'); }}
              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${color === c && tool === 'brush' ? 'border-cyan-500 scale-110' : 'border-slate-300'}`}
              style={{backgroundColor: c}}
            />
          ))}
        </div>
        
        {/* Brush Size */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Size:</span>
          <input 
            type="range" 
            min="1" 
            max="30" 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))} 
            className="w-28 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-500" 
          />
          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
            <div className="rounded-full bg-slate-800" style={{ width: Math.min(brushSize, 20), height: Math.min(brushSize, 20) }} />
          </div>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-2 ml-auto">
          <button 
            onClick={() => setTool('brush')}
            className={`p-2 rounded-lg transition-colors ${tool === 'brush' ? 'bg-cyan-100 text-cyan-600' : 'hover:bg-slate-100 text-slate-600'}`}
            title="Brush"
          >
            <Pen size={18} />
          </button>
          <button 
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-cyan-100 text-cyan-600' : 'hover:bg-slate-100 text-slate-600'}`}
            title="Eraser"
          >
            <Scissors size={18} />
          </button>
          <div className="w-px h-6 bg-slate-300 mx-2" />
          <button 
            onClick={() => {
              const ctx = canvasRef.current.getContext('2d');
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }} 
            className="p-2 hover:bg-rose-100 rounded-lg text-rose-500 transition-colors"
            title="Clear Canvas"
          >
            <Trash2 size={18} />
          </button>
          <button 
            onClick={() => {
              const canvas = canvasRef.current;
              const link = document.createElement('a');
              link.download = 'vibeos-painting.png';
              link.href = canvas.toDataURL();
              link.click();
            }}
            className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition-colors"
            title="Save Image"
          >
            <Download size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden p-4 bg-slate-200">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600} 
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="bg-white shadow-lg rounded-lg cursor-crosshair w-full h-full object-contain touch-none"
        />
      </div>
    </div>
  );
};

const MusicApp = () => {
  const [playing, setPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(0);
  const [progress, setProgress] = useState(33);
  const [volume, setVolume] = useState(75);
  
  const songs = [
    { title: "Midnight City", artist: "M83", cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&h=400&fit=crop", duration: "4:12" },
    { title: "Blinding Lights", artist: "The Weeknd", cover: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=400&h=400&fit=crop", duration: "3:22" },
    { title: "Levitating", artist: "Dua Lipa", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&h=400&fit=crop", duration: "3:45" }
  ];

  useEffect(() => {
    let interval;
    if (playing) {
      interval = setInterval(() => {
        setProgress(p => (p >= 100 ? 0 : p + 0.5));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playing]);

  const nextSong = () => setCurrentSong((currentSong + 1) % songs.length);
  const prevSong = () => setCurrentSong((currentSong - 1 + songs.length) % songs.length);

  return (
    <div className="h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white flex flex-col p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Music className="text-indigo-400" size={24} />
          <span className="font-bold text-lg">Vibe Music</span>
        </div>
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-white/60" />
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={volume} 
            onChange={(e) => setVolume(parseInt(e.target.value))}
            className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Album Art */}
        <div className="w-56 h-56 rounded-2xl shadow-2xl overflow-hidden mb-8 relative group">
          <img 
            src={songs[currentSong].cover} 
            className={`w-full h-full object-cover transition-transform duration-700 ${playing ? 'scale-110' : 'scale-100'}`} 
            alt="cover" 
          />
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${playing ? 'opacity-0' : 'opacity-100'}`}>
            <Music className="text-white animate-pulse" size={48} />
          </div>
          {/* Vinyl Effect */}
          <div className={`absolute inset-0 rounded-2xl border-2 border-white/10 ${playing ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}>
            <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm" />
          </div>
        </div>

        {/* Song Info */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">{songs[currentSong].title}</h2>
          <p className="text-indigo-300 text-lg">{songs[currentSong].artist}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-sm mb-8">
          <div className="h-1.5 bg-white/10 rounded-full relative overflow-hidden cursor-pointer group">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/40 font-mono">
            <span>{Math.floor(progress / 100 * 252 / 60)}:{String(Math.floor(progress / 100 * 252 % 60)).padStart(2, '0')}</span>
            <span>{songs[currentSong].duration}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8">
          <button 
            onClick={prevSong}
            className="text-white/60 hover:text-white transition-colors hover:scale-110 transform"
          >
            <SkipBack size={28} />
          </button>
          <button 
            onClick={() => setPlaying(!playing)}
            className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-lg hover:shadow-indigo-500/50"
          >
            {playing ? <Pause fill="currentColor" size={32} /> : <Play className="ml-1" fill="currentColor" size={32} />}
          </button>
          <button 
            onClick={nextSong}
            className="text-white/60 hover:text-white transition-colors hover:scale-110 transform"
          >
            <SkipForward size={28} />
          </button>
        </div>
      </div>

      {/* Playlist Preview */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <div className="text-xs text-white/40 mb-3 uppercase tracking-wider">Up Next</div>
        <div className="flex gap-4">
          {songs.filter((_, i) => i !== currentSong).slice(0, 2).map((song, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-white/5 rounded-lg p-2 hover:bg-white/10 transition-colors cursor-pointer">
              <img src={song.cover} className="w-10 h-10 rounded object-cover" alt="" />
              <div>
                <div className="text-sm font-medium">{song.title}</div>
                <div className="text-xs text-white/40">{song.artist}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- REUSED APPS ---
const TerminalApp = () => {
  const [history, setHistory] = useState(['Welcome to VibeOS Kernel v1.0.2-stable', 'Type "help" for commands.']);
  const [input, setInput] = useState('');
  const scrollRef = useRef();
  useEffect(() => { scrollRef.current?.scrollIntoView(); }, [history]);
  const handleCmd = (e) => {
    if (e.key === 'Enter') {
      const cmd = input.trim().toLowerCase();
      let res = cmd === 'help' ? 'help, clear, ls, neofetch, date, echo' : 
                cmd === 'neofetch' ? 'VibeOS v1.0\nKernel: React-v18\nShell: vibe-sh' : 
                cmd === 'date' ? new Date().toString() :
                cmd.startsWith('echo ') ? input.slice(5) :
                cmd === 'ls' ? 'Desktop  Documents  Downloads  Music  Pictures  Videos' :
                cmd === 'clear' ? 'CLEAR' : `vibe-sh: command not found: ${cmd}`;
      if (cmd === 'clear') { setHistory([]); setInput(''); return; }
      setHistory([...history, `vibe@os:~$ ${input}`, res]);
      setInput('');
    }
  };
  return (
    <div className="p-4 font-mono text-xs h-full flex flex-col bg-black/90">
      <div className="flex-1 overflow-auto whitespace-pre-wrap">{history.map((line, i) => <div key={i} className="mb-1">{line}</div>)}<div ref={scrollRef} /></div>
      <div className="flex items-center gap-2 mt-2"><span className="text-cyan-500">vibe@os:~$</span><input autoFocus value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleCmd} className="bg-transparent border-none outline-none flex-1 text-white" /></div>
    </div>
  );
};

const CalculatorApp = () => {
  const [val, setVal] = useState('0');
  const buttons = ['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', 'DEL', '='];
  const handleClick = (btn) => {
    if (btn === 'C') setVal('0');
    else if (btn === 'DEL') setVal(val.length > 1 ? val.slice(0, -1) : '0');
    else if (btn === '=') setVal(String(safeEval(val)));
    else setVal(val === '0' ? btn : val + btn);
  };
  return (
    <div className="p-4 h-full flex flex-col bg-slate-900">
      <div className="bg-black/50 p-6 rounded-xl text-right text-3xl font-mono text-cyan-400 mb-4 border border-white/5 truncate">{val}</div>
      <div className="grid grid-cols-4 gap-2 flex-1">
        {buttons.map(b => (
          <button key={b} onClick={() => handleClick(b)} className={`rounded-lg font-bold transition-all active:scale-95 ${b === '=' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>{b}</button>
        ))}
      </div>
    </div>
  );
};

const FilesApp = () => {
  const [currentPath, setCurrentPath] = useState('/home/vibe');
  const folders = [
    { name: 'Documents', icon: Folder, color: 'text-blue-400' },
    { name: 'Downloads', icon: Download, color: 'text-green-400' },
    { name: 'Music', icon: Music, color: 'text-purple-400' },
    { name: 'Pictures', icon: ImgIcon, color: 'text-pink-400' },
    { name: 'Videos', icon: Film, color: 'text-red-400' },
    { name: 'Projects', icon: Code, color: 'text-cyan-400' },
  ];
  
  const files = [
    { name: 'readme.txt', size: '2.4 KB', type: 'text' },
    { name: 'budget.xlsx', size: '15.8 KB', type: 'sheet' },
    { name: 'presentation.pdf', size: '1.2 MB', type: 'pdf' },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-900">
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center px-4 gap-4">
        <button onClick={() => setCurrentPath('/home/vibe')} className="text-slate-400 hover:text-white"><Home size={18}/></button>
        <div className="flex-1 bg-slate-900 rounded-lg px-3 py-1.5 text-sm text-slate-300 font-mono">{currentPath}</div>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <div className="text-slate-400 text-xs mb-4 uppercase tracking-wider">Folders</div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {folders.map(folder => (
            <div key={folder.name} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group">
              <folder.icon size={48} className={`${folder.color} group-hover:scale-110 transition-transform`} />
              <span className="text-sm text-slate-300">{folder.name}</span>
            </div>
          ))}
        </div>
        <div className="text-slate-400 text-xs mb-4 uppercase tracking-wider">Files</div>
        <div className="space-y-2">
          {files.map(file => (
            <div key={file.name} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
              <FileText size={20} className="text-slate-400" />
              <div className="flex-1">
                <div className="text-sm text-slate-300">{file.name}</div>
                <div className="text-xs text-slate-500">{file.size}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SettingsApp = () => {
  const [activeTab, setActiveTab] = useState('general');
  
  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'display', label: 'Display', icon: Monitor },
    { id: 'sound', label: 'Sound', icon: Volume2 },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="h-full flex bg-slate-900">
      <div className="w-48 bg-slate-800 border-r border-slate-700 p-4">
        <div className="space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === tab.id ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 p-6 overflow-auto">
        <h2 className="text-xl font-bold text-white mb-6 capitalize">{activeTab} Settings</h2>
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-300">Dark Mode</span>
              <div className="w-12 h-6 bg-cyan-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-300">Notifications</span>
              <div className="w-12 h-6 bg-cyan-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Auto-update</span>
              <div className="w-12 h-6 bg-slate-600 rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- APP REGISTRY ---
const APP_REGISTRY = [
  { id: 'term', title: 'Terminal', icon: <Terminal size={18} className="text-green-400"/>, component: <TerminalApp />, width: 650, height: 400 },
  { id: 'calc', title: 'Calculator', icon: <CalcIcon size={18} className="text-orange-400"/>, component: <CalculatorApp />, width: 320, height: 450 },
  { id: 'music', title: 'Music Player', icon: <Music size={18} className="text-indigo-400"/>, component: <MusicApp />, width: 450, height: 600 },
  { id: 'snake', title: 'Snake Game', icon: <Zap size={18} className="text-emerald-400"/>, component: <SnakeGame />, width: 450, height: 550 },
  { id: 'paint', title: 'Paint Studio', icon: <Palette size={18} className="text-rose-400"/>, component: <PaintApp />, width: 850, height: 650 },
  { id: 'files', title: 'Files', icon: <Folder size={18} className="text-cyan-400"/>, component: <FilesApp />, width: 700, height: 450 },
  { id: 'settings', title: 'Settings', icon: <Settings size={18} className="text-slate-400"/>, component: <SettingsApp />, width: 700, height: 500 },
];

export default function App() {
  const [openApps, setOpenApps] = useState([]);
  const [focusedId, setFocusedId] = useState(null);
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [booting, setBooting] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 1500);
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, []);

  const launch = (app) => {
    if (!openApps.find(a => a.id === app.id)) setOpenApps([...openApps, app]);
    setFocusedId(app.id);
    setLauncherOpen(false);
  };

  if (booting) return (
    <div className="h-screen w-screen bg-[#020408] flex flex-col items-center justify-center font-mono">
      <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
      <div className="mt-6 text-cyan-500 text-[10px] tracking-widest uppercase animate-pulse">VibeOS Booting</div>
    </div>
  );

  return (
    <div className="h-screen w-screen flex flex-col relative overflow-hidden select-none" style={{ background: WALLPAPERS[0], backgroundSize: 'cover' }}>
      
      {/* Top Panel */}
      <div className="h-8 bg-black/30 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-[1000]">
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-bold text-white/80 flex items-center gap-2">
            <Zap size={12} className="text-cyan-500" /> VibeOS
          </div>
        </div>
        <div className="text-[10px] font-bold text-white/80">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="flex items-center gap-3 text-white/40">
          <Wifi size={12} />
          <Volume2 size={12} />
        </div>
      </div>

      <div className="flex-1 relative" onClick={() => setLauncherOpen(false)}>
        {/* Desktop Icons */}
        <div className="absolute top-4 left-4 grid grid-flow-row gap-6">
          {APP_REGISTRY.slice(0, 3).map(app => (
            <div key={app.id} onDoubleClick={() => launch(app)} className="flex flex-col items-center gap-1 group cursor-pointer">
              <div className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-all border border-white/5">
                {React.cloneElement(app.icon, { size: 24 })}
              </div>
              <span className="text-[10px] font-bold text-white drop-shadow-md">{app.title}</span>
            </div>
          ))}
        </div>

        {/* Windows */}
        {openApps.map(app => (
          <Window 
            key={app.id} 
            app={app} 
            isFocused={focusedId === app.id}
            onFocus={() => setFocusedId(app.id)}
            onClose={() => setOpenApps(openApps.filter(a => a.id !== app.id))}
            onMinimize={() => setFocusedId(null)}
          >
            {app.component}
          </Window>
        ))}

        {/* Launcher */}
        {launcherOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-20 w-[600px] bg-black/70 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 grid grid-cols-6 gap-4 z-[2000] animate-in fade-in slide-in-from-bottom-10">
            {APP_REGISTRY.map(app => (
              <div key={app.id} onClick={() => launch(app)} className="flex flex-col items-center gap-2 group cursor-pointer">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-white/10 transition-all group-hover:scale-110 border border-white/5">
                  {React.cloneElement(app.icon, { size: 32 })}
                </div>
                <span className="text-[10px] text-white/80 font-medium text-center">{app.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dock */}
      <div className="h-14 bg-white/5 backdrop-blur-2xl border-t border-white/5 flex items-center justify-center px-4 z-[1000]">
        <div className="flex items-center gap-2 p-1 px-3 bg-black/20 rounded-2xl border border-white/5 shadow-2xl">
          <button 
            onClick={(e) => { e.stopPropagation(); setLauncherOpen(!launcherOpen); }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${launcherOpen ? 'bg-cyan-500 text-white' : 'hover:bg-white/10 text-cyan-400'}`}
          >
            <Grid size={22} />
          </button>
          <div className="w-[1px] h-6 bg-white/10 mx-1" />
          {openApps.map(app => (
            <button 
              key={app.id}
              onClick={() => setFocusedId(app.id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${focusedId === app.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              {app.icon}
              <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-500 transition-opacity ${focusedId === app.id ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
