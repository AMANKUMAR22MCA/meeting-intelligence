import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  FileAudio, 
  CheckCircle2, 
  Clock, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  CheckSquare, 
  AlertCircle,
  FileText,
  Mail,
  Moon,
  Sun
} from 'lucide-react';

const API_BASE = 'http://50.19.61.16:8000/api/v1';

// Custom Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-bounce-in z-50`}>
      {type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
      <span>{message}</span>
    </div>
  );
};

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, processing, success, error
  const [jobId, setJobId] = useState(null);
  
  const [meetings, setMeetings] = useState([]);
  const [allMeetings, setAllMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    fetchAllMeetings();
    fetchMeetings(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchAllMeetings = async () => {
    try {
      const res = await fetch(`${API_BASE}/meetings?skip=0&limit=1000`);
      if (res.ok) {
        const data = await res.json();
        setAllMeetings(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMeetings = async (page) => {
    try {
      setMeetingsLoading(true);
      const skip = (page - 1) * itemsPerPage;
      const res = await fetch(`${API_BASE}/meetings?skip=${skip}&limit=${itemsPerPage}`);
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
      } else {
        throw new Error('Failed to fetch meetings');
      }
    } catch (error) {
      console.error(error);
      showToast('Could not load meetings', 'error');
    } finally {
      setMeetingsLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'video/mp4', 'audio/mp4'];
    if (validTypes.includes(selectedFile.type) || /\.(mp3|wav|m4a|mp4)$/i.test(selectedFile.name)) {
      setFile(selectedFile);
    } else {
      showToast('Unsupported file format. Please upload MP3, WAV, M4A, or MP4.', 'error');
    }
  };

  const handleProcess = async () => {
    if (!file) {
      showToast('Please select a file first', 'error');
      return;
    }
    if (!email) {
      showToast('Please enter an email address', 'error');
      return;
    }

    setUploadStatus('uploading');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', email);

    try {
      const res = await fetch(`${API_BASE}/upload-async`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      
      const data = await res.json();
      setJobId(data.job_id);
      setUploadStatus('processing');
      pollJobStatus(data.job_id);

    } catch (error) {
      console.error(error);
      setUploadStatus('idle');
      showToast('Failed to upload file', 'error');
    }
  };

  const pollJobStatus = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/jobs/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'SUCCESS') {
          setUploadStatus('success');
          showToast('Meeting processed successfully!');
          setFile(null);
          setJobId(null);
          fetchMeetings(currentPage); // Refresh list
          fetchAllMeetings();
          setTimeout(() => setUploadStatus('idle'), 3000);
        } else if (data.status === 'FAILED') {
          setUploadStatus('error');
          showToast('Processing failed', 'error');
          setTimeout(() => setUploadStatus('idle'), 3000);
        } else {
          // Still processing, poll again
          setTimeout(() => pollJobStatus(id), 3000);
        }
      } else {
        throw new Error('Failed to fetch job status');
      }
    } catch (error) {
      console.error(error);
      // Keep polling despite network error just in case, or abort.
      setTimeout(() => pollJobStatus(id), 3000);
    }
  };

  // Stats calculations
  const totalMeetings = allMeetings.length;
  const avgProcessingTime = allMeetings.length 
    ? (allMeetings.reduce((acc, curr) => acc + (curr.processing_time || 0), 0) / allMeetings.length).toFixed(1) 
    : 0;
  
  const sentiments = allMeetings.map(m => m.sentiment).filter(Boolean);
  const mostCommonSentiment = sentiments.length 
    ? sentiments.sort((a,b) => sentiments.filter(v => v===a).length - sentiments.filter(v => v===b).length).pop()
    : 'N/A';

  const totalPages = Math.ceil(totalMeetings / itemsPerPage) || 1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200 selection:bg-indigo-500 selection:text-white">
      
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
              MI
            </div>
            <span className="font-semibold text-lg tracking-tight">Meeting Intelligence</span>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <Sun size={20} className="text-gray-400" /> : <Moon size={20} className="text-gray-600" />}
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* Hero Section */}
        <section className="text-center space-y-4 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Upload your meeting audio <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
              AI transcribes, summarizes & emails you
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Transform hours of meetings into concise summaries and actionable items in minutes.
          </p>
        </section>

        {/* Stats Bar */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
              <FileAudio size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Meetings</p>
              <p className="text-2xl font-bold">{totalMeetings}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Processing Time</p>
              <p className="text-2xl font-bold">{avgProcessingTime}s</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Common Sentiment</p>
              <p className="text-2xl font-bold capitalize">{mostCommonSentiment}</p>
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-8 md:p-12 space-y-8">
            <div 
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ease-in-out ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' 
                  : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                className="hidden" 
                accept=".mp3,.wav,.m4a,.mp4"
              />
              <div className="flex flex-col items-center space-y-4 cursor-pointer">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full">
                  <UploadCloud size={32} className="text-gray-400 dark:text-gray-500" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {file ? file.name : "Click or drag file to this area to upload"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-md">
                  <span>MP3</span>
                  <span>•</span>
                  <span>WAV</span>
                  <span>•</span>
                  <span>M4A</span>
                  <span>•</span>
                  <span>MP4</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Delivery Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    placeholder="you@company.com"
                  />
                </div>
              </div>
              <button 
                onClick={handleProcess}
                disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {uploadStatus === 'uploading' && <Loader2 size={18} className="animate-spin" />}
                {uploadStatus === 'processing' && <Loader2 size={18} className="animate-spin" />}
                <span>
                  {uploadStatus === 'idle' && "Process Meeting"}
                  {uploadStatus === 'uploading' && "Uploading..."}
                  {uploadStatus === 'processing' && "Processing AI..."}
                  {uploadStatus === 'success' && "Done!"}
                  {uploadStatus === 'error' && "Retry"}
                </span>
              </button>
            </div>

            {uploadStatus === 'processing' && (
              <div className="flex items-center p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                <Loader2 size={20} className="animate-spin mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Processing your meeting</p>
                  <p className="text-xs opacity-80">Job ID: {jobId} — This might take a minute.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* History Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Recent Meetings</h2>
          </div>

          {meetingsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 border-dashed">
              <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No meetings yet</h3>
              <p className="text-gray-500 dark:text-gray-400">Upload your first audio file above to get started.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 pt-8">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === i + 1 
                          ? 'bg-indigo-600 text-white' 
                          : 'border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function MeetingCard({ meeting }) {
  const [expanded, setExpanded] = useState(false);

  const sentimentColor = {
    positive: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-500/30',
    neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    negative: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30',
  }[meeting.sentiment?.toLowerCase()] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';

  const statusColor = {
    completed: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-500/30',
    processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30',
    pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    failed: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30',
  }[meeting.status?.toLowerCase()] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-all hover:border-indigo-300 dark:hover:border-indigo-700">
      <div 
        className="p-6 cursor-pointer flex flex-col md:flex-row md:items-start justify-between gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="space-y-4 flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {meeting.filename}
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor} capitalize`}>
              {meeting.status || 'unknown'}
            </span>
            {meeting.sentiment && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${sentimentColor} capitalize`}>
                {meeting.sentiment}
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {meeting.summary || "No summary available."}
          </p>

          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500 font-medium">
            <span className="flex items-center">
              <Clock size={14} className="mr-1" /> 
              {meeting.created_at ? `${new Date(meeting.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})} ${new Date(meeting.created_at).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'})}` : 'Invalid Date'}
            </span>
            <span className="flex items-center">
              <Activity size={14} className="mr-1" /> 
              {meeting.processing_time != null ? `${Number(meeting.processing_time).toFixed(2)}s` : '—'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between md:flex-col md:items-end md:justify-start gap-4">
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-6 animate-fade-in-down">
          
          {meeting.action_items && meeting.action_items.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Action Items</h4>
              <ul className="space-y-2">
                {meeting.action_items.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-sm">
                    <CheckSquare size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {typeof item === 'string' ? item : `${item.task || ''} ${item.owner ? `(Owner: ${item.owner})` : ''} ${item.deadline ? `- Due: ${item.deadline}` : ''}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Full Transcript</h4>
            <div className="p-4 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-h-60 overflow-y-auto font-mono whitespace-pre-wrap">
              {meeting.transcript || "Transcript not available."}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
