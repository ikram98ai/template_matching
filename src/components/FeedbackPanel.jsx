import React, { useState, useEffect } from 'react';
import {  Filter, Check, X } from 'lucide-react';
import Symbol from './Symbol';


// const FeedbackPanel = ({children, selectedSymbol, onSymbolUpdate, onSymbolSelect }) => {
const FeedbackPanel = ({ 
    detectedSymbols=[],
    selectedSymbol,
    onSymbolSelect,
    onSymbolUpdate,
    children 
  }) => {
  // const [symbols, setSymbols] = useState([]);
  const [filteredSymbols, setFilteredSymbols] = useState([]);
  // const [filterStatus, setFilterStatus] = useState('all');
  // const [editingSymbol, setEditingSymbol] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [symbols, setSymbols] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (detectedSymbols.length > 0) {
      const newSymbols = detectedSymbols.map(sym => ({
        ...sym,
        status: 'pending',
        confidence: sym.confidence || 0.9 // default confidence
      }));
      // setSymbols(prev => [...prev, ...newSymbols]);
      setSymbols(newSymbols)
    }
  }, [detectedSymbols]);

  const handleFeedback = async (symbolId, isCorrect) => {
    setSymbols(prev =>
      prev.map(sym => 
        sym.id === symbolId 
          ? { ...sym, status: isCorrect ? 'verified' : 'rejected' } 
          : sym
      )
    );
  };

  const handleSymbolEdit = (symbolId, updates) => {
    const updated = symbols.map(sym => 
      sym.id === symbolId ? { ...sym, ...updates } : sym
    );
    setSymbols(updated);
    onSymbolUpdate(updated.find(sym => sym.id === symbolId));
  };


  useEffect(() => {
    if (selectedSymbol) {
      setEditingSymbol(selectedSymbol);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    filterSymbols();
  }, [symbols, filterStatus]);

  const filterSymbols = () => {
    let filtered = [...symbols]

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(symbol => symbol.status === filterStatus);
    }

    setFilteredSymbols(filtered);
  };

  



   
  const renderSymbolCard = (symbol) => {
    return (
      <div 
        key={symbol.id}
        className={`p-4 border rounded-lg mb-2 ${symbol.status === 'verified' ? 'bg-green-50' : ''}`}
        style={{ borderColor: symbol.color }}
      >
        <div className="flex items-center gap-4">
          
          <Symbol id={symbol.id} src={symbol.symbolImage} color={symbol.color} />
          <div className="flex-1">
            <div className="font-semibold">{symbol.id}</div>
            <div className="text-sm">Confidence: {(symbol.confidence * 100).toFixed(1)}%</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleFeedback(symbol.id, true)}>
              <Check className="text-green-600" />
            </button>
            <button onClick={() => handleFeedback(symbol.id, false)}>
              <X className="text-red-600" />
            </button>
          </div>
        </div>
        {selectedSymbol?.id === symbol.id && (
          <div className="mt-4 space-y-2">
            <input
              type="text"
              value={symbol.label}
              onChange={(e) => handleSymbolEdit(symbol.id, { label: e.target.value })}
              className="w-full p-2 border rounded"
            />
            <input
              type="color"
              value={symbol.color}
              onChange={(e) => handleSymbolEdit(symbol.id, { color: e.target.value })}
              className="w-full"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full sticky top-0  overflow-y-auto wx-auto max-w-md bg-white rounded-r-xl rounded-lg shadow-lg p-6 flex flex-col min-h-screen max-h-screen">
      {children}
  
    {/* Symbol Feedback Section */}
    <div className="flex-1 flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Symbol Feedback</h2>
      
      {/* Filter */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg p-2 flex-1"
          >
            <option value="all">All Symbols</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
  
      {/* Summary */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex gap-10 text-sm text-gray-600">
          <span>Total: {symbols.length}</span>
          <span>Verified: {symbols.filter(s => s.status === 'verified').length}</span>
          <span>Pending: {symbols.filter(s => s.status === 'pending').length}</span>
        </div>
      </div>
      {/* Symbol List */}
      <div className="flex-1  space-y-2">
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : filteredSymbols.length > 0 ? (
          filteredSymbols.map(renderSymbolCard)
        ) : (
          <div className="text-center py-4 text-gray-500">
            No symbols found matching your criteria
          </div>
        )}
      </div>
  
    </div>
  </div>
  );
};

export default FeedbackPanel;