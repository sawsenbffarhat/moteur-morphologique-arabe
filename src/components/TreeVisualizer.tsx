import React from 'react';

interface TreeVisualizerProps {
  root: any;
  selectedRoot?: string;
  onNodeClick: (node: any) => void;
}

const TreeVisualizer: React.FC<TreeVisualizerProps> = ({ root, selectedRoot, onNodeClick }) => {
  if (!root) return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center opacity-20">
        <span className="text-8xl block mb-4">🔍</span>
        <p className="arabic-font text-2xl font-bold">جاري تحميل البيانات...</p>
      </div>
    </div>
  );

  // Calculate tree dimensions
  const calculateDimensions = (node: any): { width: number, height: number } => {
    if (!node) return { width: 0, height: 0 };
    
    const leftDims = node.left ? calculateDimensions(node.left) : { width: 0, height: 0 };
    const rightDims = node.right ? calculateDimensions(node.right) : { width: 0, height: 0 };
    
    return {
      width: leftDims.width + rightDims.width + 120,
      height: Math.max(leftDims.height, rightDims.height) + 100
    };
  };

  const dimensions = calculateDimensions(root);
  const svgWidth = Math.max(dimensions.width, 1000);
  const svgHeight = Math.max(dimensions.height + 100, 600);

  const renderNode = (node: any, x: number, y: number, offset: number) => {
    const isSelected = selectedRoot === node.root;

    return (
      <g key={node.root}>
        {/* Draw lines to children - SOLID LINES (no strokeDasharray) */}
        {node.left && (
          <path 
            d={`M ${x} ${y} C ${x} ${y + 40}, ${x - offset} ${y + 40}, ${x - offset} ${y + 80}`} 
            fill="none" 
            stroke="#94a3b8" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
        )}
        {node.right && (
          <path 
            d={`M ${x} ${y} C ${x} ${y + 40}, ${x + offset} ${y + 40}, ${x + offset} ${y + 80}`} 
            fill="none" 
            stroke="#94a3b8" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
        )}

        {/* Node circle */}
        <g onClick={() => onNodeClick(node)} style={{ cursor: 'pointer' }}>
          {isSelected && (
            <circle 
              cx={x} cy={y} r="38" 
              fill="rgba(16, 185, 129, 0.2)"
              className="animate-pulse"
            />
          )}
          <circle 
            cx={x} cy={y} 
            r="32" 
            fill={isSelected ? "#10b981" : "white"} 
            stroke="#10b981"
            strokeWidth="3"
            className="transition-all duration-200 hover:stroke-4"
          />
          <text 
            x={x} y={y + 8} 
            textAnchor="middle" 
            fill={isSelected ? "white" : "#064e3b"} 
            className="arabic-font text-2xl font-bold pointer-events-none select-none"
          >
            {node.root}
          </text>
        </g>

        {/* Render children */}
        {node.left && renderNode(node.left, x - offset, y + 80, offset / 1.6)}
        {node.right && renderNode(node.right, x + offset, y + 80, offset / 1.6)}
      </g>
    );
  };

  return (
    <div className="w-full h-full overflow-auto bg-white rounded-2xl border border-slate-200">
      <div className="min-w-full min-h-full p-8" style={{ width: svgWidth, height: svgHeight }}>
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          preserveAspectRatio="xMidYMid meet"
          className="mx-auto"
        >
          {/* Background */}
          <rect width={svgWidth} height={svgHeight} fill="white" />
          
          {/* Render tree centered */}
          <g transform={`translate(${svgWidth / 2}, 60)`}>
            {renderNode(root, 0, 40, 200)}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default TreeVisualizer;