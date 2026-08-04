import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, sendManualWhatsAppFn } from '../firebase';
import { MessageCircle, Send, Calendar, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface WhatsAppPanelProps {
  garageId: string;
}

interface ScheduledMessage {
  id: string;
  title: string;
  message: string;
  sendDate: string;
  status: 'pending' | 'sent' | 'cancelled';
  sentCount?: number;
}

export default function WhatsAppPanel({ garageId }: WhatsAppPanelProps) {
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(1000);

  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [schedTitle, setSchedTitle] = useState('');
  const [schedMessage, setSchedMessage] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);

  useEffect(() => {
    if (!garageId) return;
    const unsubGarage = onSnapshot(doc(db, 'garages', garageId), (snap) => {
      const data = snap.data();
      if (data) {
        setUsed(data.whatsappMessagesUsed || 0);
        setLimit(data.whatsappMessagesLimit ?? 1000);
      }
    });
    const unsubSched = onSnapshot(
      collection(db, 'garages', garageId, 'scheduledMessages'),
      (snap) => {
        setScheduledMessages(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ScheduledMessage, 'id'>) }))
        );
      }
    );
    return () => {
      unsubGarage();
      unsubSched();
    };
  }, [garageId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !message) return;
    setSending(true);
    setSendResult(null);
    try {
      await sendManualWhatsAppFn({ garageId, phoneNumber: phone, message });
      setSendResult({ type: 'success', text: 'Message sent successfully.' });
      setPhone('');
      setMessage('');
    } catch (err: any) {
      setSendResult({ type: 'error', text: err.message || 'Send failed.' });
    } finally {
      setSending(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedTitle || !schedMessage || !schedDate) return;
    setScheduling(true);
    try {
      await addDoc(collection(db, 'garages', garageId, 'scheduledMessages'), {
        title: schedTitle,
        message: schedMessage,
        sendDate: schedDate,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setSchedTitle('');
      setSchedMessage('');
      setSchedDate('');
    } catch (err) {
      console.error(err);
    } finally {
      setScheduling(false);
    }
  };

  const handleCancelScheduled = async (id: string) => {
    if (!confirm('Cancel this scheduled message?')) return;
    await deleteDoc(doc(db, 'garages', garageId, 'scheduledMessages', id));
  };

  const percentUsed = Math.min(100, Math.round((used / limit) * 100));
  const quotaLow = used >= limit * 0.9;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">WhatsApp Messaging</h1>
        <p className="text-sm text-gray-500 font-medium">Send messages and schedule holiday greetings to your clients</p>
      </div>

      {/* Quota Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-wide text-gray-700">Message Quota</span>
          </div>
          <span className={`text-xs font-bold ${quotaLow ? 'text-rose-600' : 'text-gray-500'}`}>
            {used} / {limit} used
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${quotaLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
        {quotaLow && (
          <p className="text-xs text-rose-600 font-medium mt-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> Running low on messages. Contact your provider to top up.
          </p>
        )}
      </div>

      {/* Manual Send */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Send a Message</h3>
        </div>
        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Client Phone Number</label>
            <input
              type="tel"
              required
              placeholder="+250 788 000 000"
              className="w-full mt-1 p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Message</label>
            <textarea
              required
              rows={3}
              className="w-full mt-1 p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          {sendResult && (
            <div className={`flex items-center gap-2 text-xs font-medium p-2.5 rounded-lg ${
              sendResult.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {sendResult.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {sendResult.text}
            </div>
          )}
          <button
            type="submit"
            disabled={sending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>

      {/* Schedule Holiday Message */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Schedule a Holiday Message</h3>
        </div>
        <p className="text-xs text-gray-500">
          Sends automatically to all clients on the chosen date, at 8:00 AM Kigali time.
        </p>
        <form onSubmit={handleSchedule} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Christmas Greeting"
                className="w-full mt-1 p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                value={schedTitle}
                onChange={(e) => setSchedTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Send Date</label>
              <input
                type="date"
                required
                className="w-full mt-1 p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                value={schedDate}
                onChange={(e) => setSchedDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Message</label>
            <textarea
              required
              rows={3}
              placeholder="Happy holidays from C&V Smart Garage & Carwash Ltd!"
              className="w-full mt-1 p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm resize-none"
              value={schedMessage}
              onChange={(e) => setSchedMessage(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={scheduling}
            className="bg-amber-500 hover:bg-amber-600 text-gray-900 text-xs font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-50"
          >
            {scheduling ? 'Scheduling...' : 'Schedule Message'}
          </button>
        </form>
      </div>

      {/* Scheduled List */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-4">Scheduled Messages</h3>
        {scheduledMessages.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No scheduled messages yet.</p>
        ) : (
          <div className="space-y-2">
            {scheduledMessages
              .sort((a, b) => a.sendDate.localeCompare(b.sendDate))
              .map((sm) => (
                <div key={sm.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{sm.title}</p>
                    <p className="text-xs text-gray-500">{sm.sendDate} &middot; {sm.message.slice(0, 60)}{sm.message.length > 60 ? '...' : ''}</p>
                    <span className={`inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      sm.status === 'sent' ? 'bg-emerald-50 text-emerald-700' :
                      sm.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {sm.status}{sm.status === 'sent' && sm.sentCount != null ? ` (${sm.sentCount} sent)` : ''}
                    </span>
                  </div>
                  {sm.status === 'pending' && (
                    <button
                      onClick={() => handleCancelScheduled(sm.id)}
                      className="text-rose-500 hover:text-rose-700 p-2"
                      title="Cancel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
