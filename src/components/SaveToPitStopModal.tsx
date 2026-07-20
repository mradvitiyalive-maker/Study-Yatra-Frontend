import React, { useState, useEffect } from 'react';
import { X, Plus, Folder, Loader2, Check, Compass, AlertCircle } from 'lucide-react';
import { auth } from '../lib/firebase';
import { getAuthToken } from '../utils/firebaseAuth';
import { Question, PitStop } from '../types';
import { API_BASE_URL } from '../config';

interface SaveToPitStopModalProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
}

export default function SaveToPitStopModal({
  question,
  isOpen,
  onClose
}: SaveToPitStopModalProps) {
  const [pitStops, setPitStops] = useState<PitStop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Flow State: 'select' | 'create'
  const [flow, setFlow] = useState<'select' | 'create'>('select');

  // Create form inputs
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [selectedStopId, setSelectedStopId] = useState<number | null>(null);

  // Popular Examples auto fill
  const examples = [
    'Weak Electrostatics',
    'Revision Before Mock',
    'Important PYQs',
    'Formula Revision'
  ];

  useEffect(() => {
    if (isOpen) {
      fetchPitStops();
      setSuccessMessage(null);
      setError(null);
      setNewTitle('');
      setNewDescription('');
    }
  }, [isOpen]);

  const fetchPitStops = async () => {
    setLoading(true);
    try {
      const idToken = await getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/pit-stops`, { headers });
      if (res.ok) {
        const data = await res.json();
        const list = data.pitStops || [];
        setPitStops(list);
        if (list.length > 0) {
          setSelectedStopId(list[0].id);
          setFlow('select');
        } else {
          setFlow('create');
        }
      } else {
        setError('Failed to fetch collections. Make sure you are signed in.');
      }
    } catch (err: any) {
      console.error('Error fetching pit stops:', err);
      setError('Connection failure. Could not load collections.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToExisting = async () => {
    if (!selectedStopId) return;
    setSaving(true);
    setError(null);

    try {
      const idToken = await getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/pit-stops/${selectedStopId}/questions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ questionId: question.id })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const matchingStop = pitStops.find(s => s.id === selectedStopId);
        setSuccessMessage(`Successfully saved to "${matchingStop?.title || 'collection'}"!`);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Could not bookmark the question.');
      }
    } catch (err) {
      console.error('Save to collection failed:', err);
      setError('Failed to reach backend.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAndSave = async () => {
    if (!newTitle.trim()) {
      setError('Collection title is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const idToken = await getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      // 1. Create the Pit Stop
      const createRes = await fetch(`${API_BASE_URL}/api/pit-stops`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: newTitle.trim(), description: newDescription.trim() })
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.success) {
        setError(createData.error || 'Failed to create collection.');
        setSaving(false);
        return;
      }

      const newStopId = createData.pitStop.id;

      // 2. Add question to newly created Pit Stop
      const addRes = await fetch(`${API_BASE_URL}/api/pit-stops/${newStopId}/questions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ questionId: question.id })
      });

      const addData = await addRes.json();
      if (addRes.ok && addData.success) {
        setSuccessMessage(`Created and saved to "${newTitle.trim()}" successfully!`);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(addData.error || 'Collection created, but failed to save question inside it.');
      }
    } catch (err) {
      console.error('Create and save flow error:', err);
      setError('Connection failure.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-fade-in text-left">
        
        {/* Header decoration */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-blue-105 bg-blue-50 dark:bg-blue-950/60 rounded-lg text-blue-600 dark:text-blue-400">
              <Compass className="h-5 w-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h3 className="text-sm font-black font-poppins text-slate-800 dark:text-white uppercase tracking-wider">
                compass: Pit Stops
              </h3>
              <p className="text-[10px] text-slate-505 dark:text-slate-400 mt-0.5">
                Save active question to custom collections
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="p-6 space-y-5">
          {successMessage ? (
            <div className="py-8 flex flex-col items-center text-center space-y-3 animate-scale-up">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Check className="h-6 w-6 stroke-[3px]" />
              </div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{successMessage}</p>
              <p className="text-xs text-slate-420 dark:text-slate-500">Pit stop safely logged!</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border-l-2 border-red-505 text-red-700 dark:text-red-400 rounded-r-xl flex items-center space-x-2 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Minimal preview of question */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Question Preview</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {question.questionText}
                </p>
              </div>

              {loading ? (
                <div className="py-8 flex flex-col items-center text-center space-y-2 text-slate-400">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
                  <span className="text-xs font-medium">Inspecting existing Pit Stops...</span>
                </div>
              ) : (
                <>
                  {/* Selector tabs */}
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      disabled={pitStops.length === 0}
                      onClick={() => setFlow('select')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        flow === 'select'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-205 disabled:opacity-40'
                      }`}
                    >
                      <Folder className="h-3 w-3 inline mr-1.5" />
                      Select Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlow('create')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        flow === 'create'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-205'
                      }`}
                    >
                      <Plus className="h-3 w-3 inline mr-1.5" />
                      Create New Stop
                    </button>
                  </div>

                  {flow === 'select' ? (
                    <div className="space-y-3.5">
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Select Pit Stop Collection
                        </label>
                        <select
                          value={selectedStopId || ''}
                          onChange={(e) => setSelectedStopId(Number(e.target.value))}
                          className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200 focus:outline-none"
                        >
                          {pitStops.map((stop) => (
                            <option key={stop.id} value={stop.id}>
                              {stop.title} ({stop.questionCount} solved bookmarks)
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveToExisting}
                        disabled={saving || !selectedStopId}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold font-poppins flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Saving Bookmark...</span>
                          </>
                        ) : (
                          <span>Save Bookmarked Question</span>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Create Stop Form */}
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                            Pit Stop Title
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Weak Electrostatics, Revision..."
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            maxLength={50}
                            className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200 focus:outline-none"
                          />
                        </div>

                        {/* Description field */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                            Optional Description
                          </label>
                          <textarea
                            placeholder="Detail what concepts or revisions this collection of bookmarks is for..."
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            maxLength={200}
                            rows={2}
                            className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200 focus:outline-none resize-none"
                          />
                        </div>
                      </div>

                      {/* Example Auto Fills */}
                      <div className="text-left">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Popular Example Suggestions:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {examples.map((ex) => (
                            <button
                              key={ex}
                              type="button"
                              onClick={() => setNewTitle(ex)}
                              className="text-[10px] py-1 px-2.5 border border-slate-200 dark:border-slate-805 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 cursor-pointer"
                            >
                              {ex}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCreateAndSave}
                        disabled={saving || !newTitle.trim()}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold font-poppins flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Creating Collection & Saving...</span>
                          </>
                        ) : (
                          <span>Create Collection & Save</span>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
