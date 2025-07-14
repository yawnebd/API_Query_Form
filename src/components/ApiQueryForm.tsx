import React, { useState } from 'react';
import { Send, Copy, Check, AlertCircle, Loader2, History } from 'lucide-react';

interface ApiRequest {
  baseUrl: string;
  endpoint: string;
  apiKey: string;
  method: string;
}

interface ApiResponse {
  success: boolean;
  status?: number;
  statusText?: string;
  data?: any;
  headers?: Record<string, string>;
  error?: string;
}

interface RequestHistory {
  id: string;
  timestamp: Date;
  request: ApiRequest;
  response: ApiResponse;
}

export default function ApiQueryForm() {
  const [formData, setFormData] = useState<ApiRequest>({
    baseUrl: '',
    endpoint: '',
    apiKey: '',
    method: 'GET'
  });
  
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.baseUrl.trim() || !formData.endpoint.trim()) {
      setResponse({
        success: false,
        error: 'Base URL and Endpoint are required'
      });
      return;
    }

    setLoading(true);
    setResponse(null);
    console.log("Step 1");
    try {
      const response = await fetch('http://localhost:3001/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result: ApiResponse = await response.json();
      setResponse(result);

      // Add to history
      const historyItem: RequestHistory = {
        id: Date.now().toString(),
        timestamp: new Date(),
        request: { ...formData },
        response: result
      };
      
      setHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Keep last 10

    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Request failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (response) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const loadFromHistory = (item: RequestHistory) => {
    setFormData(item.request);
    setResponse(item.response);
    setShowHistory(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">API Query Tool</h1>
          <p className="text-slate-300">Securely test API endpoints with server-side requests</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">API Request</h2>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-200 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                <History size={16} />
                History
              </button>
            </div>

            {showHistory && (
              <div className="mb-6 bg-black/20 rounded-lg p-4 max-h-64 overflow-y-auto">
                <h3 className="text-white font-medium mb-3">Request History</h3>
                {history.length === 0 ? (
                  <p className="text-slate-400 text-sm">No history yet</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => loadFromHistory(item)}
                        className="w-full text-left p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <div className="text-white text-sm font-medium">
                          {item.request.method} {item.request.baseUrl}/{item.request.endpoint}
                        </div>
                        <div className="text-slate-400 text-xs">
                          {item.timestamp.toLocaleString()} • 
                          <span className={`ml-1 ${item.response.success ? 'text-green-400' : 'text-red-400'}`}>
                            {item.response.success ? 'Success' : 'Error'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">HTTP Method</label>
                <select
                  name="method"
                  value={formData.method}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Base URL</label>
                <input
                  type="text"
                  name="baseUrl"
                  value={formData.baseUrl}
                  onChange={handleInputChange}
                  placeholder="https://api.example.com"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Endpoint</label>
                <input
                  type="text"
                  name="endpoint"
                  value={formData.endpoint}
                  onChange={handleInputChange}
                  placeholder="users/123"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">API Key (Optional)</label>
                <input
                  type="password"
                  name="apiKey"
                  value={formData.apiKey}
                  onChange={handleInputChange}
                  placeholder="Your API key or Bearer token"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
                {loading ? 'Sending Request...' : 'Send Request'}
              </button>
            </form>
          </div>

          {/* Response Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">Response</h2>
              {response && (
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-200 rounded-lg hover:bg-green-500/30 transition-colors"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>

            {!response ? (
              <div className="flex items-center justify-center h-64 text-slate-400">
                <div className="text-center">
                  <Send size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No response yet. Send a request to see results.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center gap-3">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    response.success 
                      ? 'bg-green-500/20 text-green-200' 
                      : 'bg-red-500/20 text-red-200'
                  }`}>
                    {response.success ? (
                      <Check size={16} />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                    {response.success ? 'Success' : 'Error'}
                  </div>
                  
                  {response.status && (
                    <span className="text-slate-300 text-sm">
                      {response.status} {response.statusText}
                    </span>
                  )}
                </div>

                {/* Response Content */}
                <div className="bg-black/30 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-slate-200 whitespace-pre-wrap break-words">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}