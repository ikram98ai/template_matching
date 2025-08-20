import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Text } from 'react-konva';
import { Button } from './Button';
import { Pen, Undo, Redo} from 'lucide-react';

const SymbolCanvas = ({ nextSymbolNumber, setNextSymbolNumber, onSymbolAdd }) => {
  const [tool, setTool] = useState('pen');
  const [lines, setLines] = useState([]);
  const [cropRect, setCropRect] = useState(null);
  const [tempLine, setTempLine] = useState([]);
  const [history, setHistory] = useState([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [label, setLabel] = useState('');
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const isDrawing = useRef(false);
  const symbolCounter = useRef(1);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 400, // Keep height fixed or make it responsive as well
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // History management
  const updateHistory = useCallback((newLines) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newLines);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  }, [history, historyStep]);

  const handleUndo = () => {
    setHistoryStep(prev => Math.max(0, prev - 1));
  };

  const handleRedo = () => {
    setHistoryStep(prev => Math.min(history.length - 1, prev + 1));
  };

  useEffect(() => {
    setLines(history[historyStep]);
  }, [historyStep]);

  // Drawing handlers
  const handleMouseDown = (e) => {
    if (tool !== 'pen') return;
    
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setTempLine([pos.x, pos.y]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || tool !== 'pen') return;
    
    const pos = e.target.getStage().getPointerPosition();
    setTempLine(prev => [...prev, pos.x, pos.y]);
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;
    
    isDrawing.current = false;
    if (tempLine.length >= 4) {
      const newLine = {
        points: tempLine,
        color: selectedColor,
        // label: label || `Drawn Symbol ${symbolCounter.current++}`,
        id: Date.now().toString()
      };
      const newLines = [...lines, newLine];
      setLines(newLines);
      updateHistory(newLines);
    }
    setTempLine([]);
  };

  // Crop handlers
  const handleCropStart = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    setCropRect({
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      color: selectedColor,
      label: label || `Cropped Symbol ${symbolCounter.current++}`,
      id: Date.now().toString()
    });
  };

  const handleCropMove = (e) => {
    if (!cropRect) return;
    
    const pos = e.target.getStage().getPointerPosition();
    setCropRect({
      ...cropRect,
      width: pos.x - cropRect.x,
      height: pos.y - cropRect.y
    });
  };

  // Export symbol
  const handleAddSymbol = () => {
    const stage = stageRef.current;
    let exportRect;
    
    if (cropRect) {
      exportRect = cropRect;
    } else {
      const bounds = getLinesBoundingBox();
      if (!bounds) return;
      exportRect = { ...bounds, color: selectedColor, label };
    }

    const dataUrl = stage.toDataURL({
      x: exportRect.x,
      y: exportRect.y,
      width: exportRect.width,
      height: exportRect.height,
      pixelRatio: 2
    });
    console.log("running")

    console.log("Label:",exportRect.label || `symbol${nextSymbolNumber}`)
    onSymbolAdd({
      image: dataUrl,
      color:  exportRect.color,
      label:  exportRect.label || `symbol${nextSymbolNumber}` ,
    });
    if (!exportRect.label ) setNextSymbolNumber(prev => prev + 1);
    console.log(`symbol${nextSymbolNumber}`)
    setCropRect(null);
    setLines([]);
    setLabel('');
    updateHistory([]);
  };

  // Helper to calculate drawing bounds
  const getLinesBoundingBox = () => {
    if (lines.length === 0 && tempLine.length === 0) return null;
    
    const allPoints = [
      ...lines.flatMap(line => line.points),
      ...tempLine
    ];
    
    const xValues = allPoints.filter((_, i) => i % 2 === 0);
    const yValues = allPoints.filter((_, i) => i % 2 === 1);
    
    return {
      x: Math.min(...xValues),
      y: Math.min(...yValues),
      width: Math.max(...xValues) - Math.min(...xValues),
      height: Math.max(...yValues) - Math.min(...yValues)
    };
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm" ref={containerRef}>
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex gap-2 items-center">
          <Button
            variant={tool === 'pen' ? 'default' : 'outline'}
            onClick={() => setTool('pen')}
            size="sm"
          >
            <Pen className="w-4 h-4 mr-2" /> Draw
          </Button>
          {/* <Button
            variant={tool === 'crop' ? 'default' : 'outline'}
            onClick={() => setTool('crop')}
            size="sm"
          >
            <Crop className="w-4 h-4 mr-2" /> Crop
          </Button> */}
        </div>

        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Symbol label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm w-32"
          />
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="w-4 h-8 rounded cursor-pointer"
            title="Select color"
          />
           <Button
            onClick={handleAddSymbol}
            size="sm"
            disabled={!lines.length && !cropRect}
            variant="outline"
          >
            Add Symbol
          </Button>
        
        </div>

        <div className="flex gap-2 items-center ml-auto">
          <Button
            onClick={handleUndo}
            disabled={historyStep === 0}
            variant="outline"
            size="sm"
          >
            <Undo className="w-4 h-4 mr-2" /> Undo
          </Button>
          <Button
            onClick={handleRedo}
            disabled={historyStep >= history.length - 1}
            variant="outline"
            size="sm"
          >
            <Redo className="w-4 h-4 mr-2" /> Redo
          </Button>
          <Button
            onClick={() => {
              setLines([]);
              setCropRect(null);
              setLabel('');
              updateHistory([]);
            }}
            variant="outline"
            size="sm"
          >
            Clear
          </Button>
         
        </div>
      </div>

      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={tool === 'crop' ? handleCropStart : handleMouseDown}
        onMousemove={tool === 'crop' ? handleCropMove : handleMouseMove}
        onMouseup={tool === 'crop' ? () => {} : handleMouseUp}
        className="border rounded bg-gray-50"
      >
        <Layer>
          {/* Existing drawings */}
          {lines.map((line) => (
            <React.Fragment key={line.id}>
              <Line
                points={line.points}
                stroke={line.color}
                strokeWidth={2}
                lineCap="round"
                lineJoin="round"
              />
              <Text
                x={line.points[0]}
                y={line.points[1] - 20}
                text={line.label}
                fontSize={14}
                fill={line.color}
              />
            </React.Fragment>
          ))}

          {/* Current drawing */}
          {tempLine.length > 0 && (
            <Line
              points={tempLine}
              stroke={selectedColor}
              strokeWidth={2}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Crop rectangle */}
          {cropRect && (
            <React.Fragment>
              <Rect
                x={cropRect.x}
                y={cropRect.y}
                width={cropRect.width}
                height={cropRect.height}
                stroke={cropRect.color}
                strokeWidth={2}
                dash={[5, 5]}
              />
              <Text
                x={cropRect.x}
                y={cropRect.y - 20}
                text={cropRect.label}
                fontSize={14}
                fill={cropRect.color}
              />
            </React.Fragment>
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default SymbolCanvas;