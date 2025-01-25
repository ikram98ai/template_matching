import React, { useState, useEffect } from 'react';
import {  Filter, Check, X, Edit2, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const FeedbackPanel = ({children, selectedSymbol, onSymbolUpdate, onSymbolSelect }) => {
  const [symbols, setSymbols] = useState([]);
  const [filteredSymbols, setFilteredSymbols] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingSymbol, setEditingSymbol] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Symbol type options - can be extended based on requirements
  const symbolTypes = [
    'resistor',
    'capacitor',
    'inductor',
    'diode',
    'transistor',
    'unknown'
  ];

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

  const handleSymbolUpdate = async (symbolId, updates) => {
    setIsLoading(true);
    try {
      const response = await axios.put(`/api/symbols/${symbolId}`, updates);
      if (response.data.success) {
        setSymbols(prevSymbols => 
          prevSymbols.map(symbol => 
            symbol.id === symbolId ? { ...symbol, ...updates } : symbol
          )
        );
        onSymbolUpdate(response.data.symbol);
      }
    } catch (error) {
      console.error('Error updating symbol:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (symbolId, isCorrect) => {
    try {
      await axios.post(`/api/feedback`, {
        symbolId,
        feedback: isCorrect ? 'correct' : 'incorrect'
      });
      
      setSymbols(prevSymbols =>
        prevSymbols.map(symbol =>
          symbol.id === symbolId
            ? { ...symbol, status: isCorrect ? 'verified' : 'rejected' }
            : symbol
        )
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const renderSymbolCard = (symbol) => {
    const isEditing = editingSymbol?.id === symbol.id;

    return (
      <div 
        key={symbol.id}
        className={`p-4 border rounded-lg mb-2 ${
          isEditing ? 'border-blue-500' : 'border-gray-200'
        } hover:shadow-md transition-shadow`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Symbol {symbol.id}</span>
              {symbol.status === 'verified' && (
                <Check className="w-4 h-4 text-green-500" />
              )}
              {symbol.status === 'rejected' && (
                <X className="w-4 h-4 text-red-500" />
              )}
              {symbol.confidence < 0.7 && (
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              )}
            </div>

            {isEditing ? (
              <select
                value={symbol.type}
                onChange={(e) => handleSymbolUpdate(symbol.id, { type: e.target.value })}
                className="mt-2 w-full p-2 border rounded"
              >
                {symbolTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-600 mt-1">
                Type: {symbol.type.charAt(0).toUpperCase() + symbol.type.slice(1)}
              </p>
            )}

            <div className="text-sm text-gray-500 mt-1">
              Page {symbol.page_number} • Confidence: {(symbol.confidence * 100).toFixed(1)}%
            </div>

            {isEditing && (
              <div className="mt-2">
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={symbol.x}
                    onChange={(e) => handleSymbolUpdate(symbol.id, { x: parseFloat(e.target.value) })}
                    className="w-20 p-1 border rounded"
                    placeholder="X"
                  />
                  <input
                    type="number"
                    value={symbol.y}
                    onChange={(e) => handleSymbolUpdate(symbol.id, { y: parseFloat(e.target.value) })}
                    className="w-20 p-1 border rounded"
                    placeholder="Y"
                  />
                </div>
                <div className="flex space-x-2 mt-2">
                  <input
                    type="number"
                    value={symbol.width}
                    onChange={(e) => handleSymbolUpdate(symbol.id, { width: parseFloat(e.target.value) })}
                    className="w-20 p-1 border rounded"
                    placeholder="Width"
                  />
                  <input
                    type="number"
                    value={symbol.height}
                    onChange={(e) => handleSymbolUpdate(symbol.id, { height: parseFloat(e.target.value) })}
                    className="w-20 p-1 border rounded"
                    placeholder="Height"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => handleFeedback(symbol.id, true)}
              className="p-2 rounded hover:bg-green-100"
              title="Mark as correct"
            >
              <Check className="w-5 h-5 text-green-600" />
            </button>
            <button
              onClick={() => handleFeedback(symbol.id, false)}
              className="p-2 rounded hover:bg-red-100"
              title="Mark as incorrect"
            >
              <X className="w-5 h-5 text-red-600" />
            </button>
            <button
              onClick={() => {
                setEditingSymbol(isEditing ? null : symbol);
                onSymbolSelect(symbol);
              }}
              className="p-2 rounded hover:bg-blue-100"
              title="Edit symbol"
            >
              <Edit2 className="w-5 h-5 text-blue-600" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full sticky top-0 wx-auto max-w-md bg-white rounded-r-xl rounded-lg shadow-lg p-6 flex flex-col min-h-screen max-h-screen">
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
  
      {/* Symbol List */}
      <div className="flex-1 overflow-y-auto space-y-2">
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
  
      {/* Summary */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex gap-10 text-sm text-gray-600">
          <span>Total: {symbols.length}</span>
          <span>Verified: {symbols.filter(s => s.status === 'verified').length}</span>
          <span>Pending: {symbols.filter(s => s.status === 'pending').length}</span>
        </div>
      </div>
    </div>
  </div>
  );
};

export default FeedbackPanel;