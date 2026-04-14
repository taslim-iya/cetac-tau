import { useState } from 'react';
import { Check, Clock, Users, Mic, Building2, UtensilsCrossed, Monitor, Trophy, CalendarClock } from 'lucide-react';
import EditableCell from '../components/EditableCell';
import { id } from '../lib/utils';

interface RunsheetItem { id: string; time: string; activity: string; owner: string; notes: string; done: boolean; }
interface Speaker { id: string; name: string; org: string; topic: string; confirmed: boolean; notes: string; }
interface CompTeam { id: string; name: string; members: string; company: string; score: string; }

const INITIAL_RUNSHEET: RunsheetItem[] = [
  { id: id(), time: '09:00', activity: 'Doors open & registration', owner: 'Masa', notes: 'Name badges, welcome packs', done: false },
  { id: id(), time: '09:30', activity: 'Opening remarks by CETAC President', owner: 'Taslim', notes: '', done: false },
  { id: id(), time: '09:45', activity: 'Keynote: The State of ETA in 2026', owner: '', notes: 'TBC — Spectra Search or 9T Capital', done: false },
  { id: id(), time: '10:30', activity: 'Panel: Investor Perspectives on Search', owner: 'Taslim', notes: 'Spectra, Aven, 9T Capital', done: false },
  { id: id(), time: '11:15', activity: 'Coffee break & networking', owner: 'Masa', notes: 'Catering setup', done: false },
  { id: id(), time: '11:45', activity: 'Workshop: Deal Structuring & Diligence', owner: '', notes: 'Saffery + debtadvisory.ai', done: false },
  { id: id(), time: '12:30', activity: 'Lunch', owner: 'Masa', notes: 'Dietary requirements', done: false },
  { id: id(), time: '13:30', activity: 'Competition: Deal Evaluation Challenge', owner: 'Taslim', notes: 'Teams present to judges', done: false },
  { id: id(), time: '15:00', activity: 'Judges deliberation & awards', owner: '', notes: 'Prizes TBC', done: false },
  { id: id(), time: '15:30', activity: 'Closing remarks', owner: 'Taslim', notes: '', done: false },
  { id: id(), time: '16:00', activity: 'Networking drinks', owner: 'Isbah', notes: 'Sponsor bar', done: false },
];

const INITIAL_SPEAKERS: Speaker[] = [
  { id: id(), name: 'Spectra Search', org: 'Spectra Search', topic: 'Investor perspective on ETA', confirmed: false, notes: 'Week 2 event host' },
  { id: id(), name: 'Aven Capital', org: 'Aven Capital', topic: 'Roll-up strategy', confirmed: false, notes: 'Week 4 event host' },
  { id: id(), name: 'Gustavo (9T Capital)', org: '9T Capital', topic: 'Case studies + competition judge', confirmed: false, notes: 'Message pending' },
  { id: id(), name: 'Saffery', org: 'Saffery', topic: 'Financial diligence', confirmed: false, notes: 'Sponsor + speaker' },
  { id: id(), name: 'Darren Coyne', org: 'debtadvisory.ai', topic: 'Acquisition finance', confirmed: false, notes: '' },
];

export default function SearchDay() {
  const [runsheet, setRunsheet] = useState(INITIAL_RUNSHEET);
  const [speakers, setSpeakers] = useState(INITIAL_SPEAKERS);
  const [teams, setTeams] = useState<CompTeam[]>([]);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [rsvpTarget, setRsvpTarget] = useState(60);
  const [catering, setCatering] = useState({ booked: false, dietary: '', headcount: '' });
  const [av, setAv] = useState({ booked: false, projector: true, mics: '2', recording: false });

  const toggleRunsheet = (itemId: string) => setRunsheet(rs => rs.map(r => r.id === itemId ? { ...r, done: !r.done } : r));
  const toggleSpeaker = (speakerId: string) => setSpeakers(ss => ss.map(s => s.id === speakerId ? { ...s, confirmed: !s.confirmed } : s));
  const confirmed = speakers.filter(s => s.confirmed).length;

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Search Day Command Centre</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 2 }}>Week 8 — Flagship half-day conference at CJBS</p>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { icon: Mic, label: 'Speakers Confirmed', value: `${confirmed}/${speakers.length}`, color: confirmed === speakers.length ? 'var(--green)' : 'var(--orange)' },
          { icon: Users, label: 'RSVPs', value: `${rsvpCount}/${rsvpTarget}`, color: rsvpCount >= rsvpTarget ? 'var(--green)' : 'var(--blue)' },
          { icon: UtensilsCrossed, label: 'Catering', value: catering.booked ? 'Booked' : 'Pending', color: catering.booked ? 'var(--green)' : 'var(--red)' },
          { icon: Monitor, label: 'AV Setup', value: av.booked ? 'Booked' : 'Pending', color: av.booked ? 'var(--green)' : 'var(--red)' },
        ].map(s => (
          <div key={s.label} style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: 8 }}>
            <s.icon size={16} color={s.color} style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Runsheet */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <CalendarClock size={16} color="var(--accent)" />
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Day-of Runsheet</h3>
          </div>
          {runsheet.map(r => (
            <div key={r.id} onClick={() => toggleRunsheet(r.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${r.done ? 'var(--green)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: r.done ? 'var(--green-light)' : 'transparent', flexShrink: 0 }}>
                {r.done && <Check size={11} color="var(--green)" />}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', minWidth: 42 }}>{r.time}</span>
              <span style={{ fontSize: 12, color: r.done ? 'var(--text-3)' : 'var(--text)', textDecoration: r.done ? 'line-through' : 'none', flex: 1 }}>{r.activity}</span>
              {r.owner && <span style={{ fontSize: 10, color: 'var(--text-3)', background: 'var(--bg-3)', padding: '1px 6px', borderRadius: 6 }}>{r.owner}</span>}
            </div>
          ))}
        </div>

        {/* Speakers */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Mic size={16} color="var(--accent)" />
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Speakers & Judges</h3>
          </div>
          {speakers.map(s => (
            <div key={s.id} onClick={() => toggleSpeaker(s.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${s.confirmed ? 'var(--green)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.confirmed ? 'var(--green-light)' : 'transparent', flexShrink: 0 }}>
                {s.confirmed && <Check size={11} color="var(--green)" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.topic}</div>
              </div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: s.confirmed ? 'var(--green-light)' : 'var(--red-light)', color: s.confirmed ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                {s.confirmed ? 'Confirmed' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* RSVP + Logistics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>RSVP Tracking</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Count</label>
              <input type="number" value={rsvpCount} onChange={e => setRsvpCount(Number(e.target.value))} className="edit-cell" style={{ width: 80 }} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>Target</label>
              <input type="number" value={rsvpTarget} onChange={e => setRsvpTarget(Number(e.target.value))} className="edit-cell" style={{ width: 80 }} />
            </div>
          </div>
          <div style={{ height: 8, background: 'var(--bg-3)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (rsvpCount / rsvpTarget) * 100)}%`, height: '100%', background: rsvpCount >= rsvpTarget ? 'var(--green)' : 'var(--accent)', borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{Math.round((rsvpCount / rsvpTarget) * 100)}% of target</div>
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Logistics</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={catering.booked} onChange={e => setCatering({ ...catering, booked: e.target.checked })} style={{ accentColor: 'var(--accent)' }} />
            Catering booked
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={av.booked} onChange={e => setAv({ ...av, booked: e.target.checked })} style={{ accentColor: 'var(--accent)' }} />
            AV / Projector booked
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={av.recording} onChange={e => setAv({ ...av, recording: e.target.checked })} style={{ accentColor: 'var(--accent)' }} />
            Recording arranged
          </label>
        </div>
      </div>
    </div>
  );
}
