import { Tooltip } from '@mui/material';

function Slot({ num, student, color }) {
  const occupied = Boolean(student);
  const label = occupied
    ? `${student.studentName || 'Occupied'} · ${student.humanId || ''}`
    : 'Available';

  return (
    <Tooltip title={label} arrow placement="top">
      <div
        className={`
          w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold
          select-none cursor-default transition-all duration-150 hover:scale-110 hover:z-10
          ${occupied ? `${color} text-white shadow-md` : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}
        `}
      >
        {num}
      </div>
    </Tooltip>
  );
}

function OccupancySection({ title, numbers, occupiedMap, color, gradientBar, pctColor }) {
  const occupied = Array.from(occupiedMap.keys()).filter(k => numbers.includes(k)).length;
  const pct = numbers.length > 0 ? Math.round((occupied / numbers.length) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-extrabold text-slate-800 text-base">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{occupied} of {numbers.length} occupied</p>
        </div>
        <span className={`text-3xl font-black tabular-nums ${pctColor}`}>{pct}%</span>
      </div>

      <div className="h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${gradientBar}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {numbers.map(n => (
          <Slot key={n} num={n} student={occupiedMap.get(n)} color={color} />
        ))}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <span className={`w-2.5 h-2.5 rounded-sm inline-block ${pctColor.replace('text-', 'bg-')}`} />
          Occupied ({occupied})
        </span>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <span className="w-2.5 h-2.5 rounded-sm inline-block bg-slate-100" />
          Free ({numbers.length - occupied})
        </span>
      </div>
    </div>
  );
}

export default function OccupancyMap({ activeStudents }) {
  const seatStudents = activeStudents.filter(s => s.seatReserved && s.seatNumber);
  const seatMap = new Map(seatStudents.map(s => [Number(s.seatNumber), s]));
  const maxSeat = seatStudents.length > 0 ? Math.max(...seatStudents.map(s => Number(s.seatNumber)), 20) : 20;
  const seatNumbers = Array.from({ length: maxSeat }, (_, i) => i + 1);

  const lockerStudents = activeStudents.filter(s => s.locker && s.lockerNumber);
  const lockerMap = new Map(lockerStudents.map(s => [Number(s.lockerNumber), s]));
  const maxLocker = lockerStudents.length > 0 ? Math.max(...lockerStudents.map(s => Number(s.lockerNumber)), 10) : 10;
  const lockerNumbers = Array.from({ length: maxLocker }, (_, i) => i + 1);

  return (
    <div className="w-full mb-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1.5 h-7 rounded-full bg-blue-500 shrink-0" />
        <h2 className="text-base font-black text-slate-700 uppercase tracking-[0.08em] whitespace-nowrap">Occupancy Map</h2>
        <div className="flex-1 h-[2px] bg-slate-200 rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="lg:col-span-2">
          <OccupancySection
            title="Seat Map"
            numbers={seatNumbers}
            occupiedMap={seatMap}
            color="bg-blue-500"
            gradientBar="bg-gradient-to-r from-blue-500 to-indigo-500"
            pctColor="text-blue-500"
          />
        </div>
        <OccupancySection
          title="Locker Map"
          numbers={lockerNumbers}
          occupiedMap={lockerMap}
          color="bg-violet-500"
          gradientBar="bg-gradient-to-r from-violet-500 to-purple-600"
          pctColor="text-violet-500"
        />
      </div>
    </div>
  );
}
