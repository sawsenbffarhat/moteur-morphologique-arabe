
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

  const renderNode = (node: any, x: number, y: number, offset: number) => {
    const isSelected = selectedRoot === node.root;

    return (
      <g key={node.root}>
        {node.left && (
          <path 
            d={`M ${x} ${y} C ${x} ${y + 40}, ${x - offset} ${y + 40}, ${x - offset} ${y + 80}`} 
            fill="none" 
            stroke="#e2e8f0" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
        )}
        {node.right && (
          <path 
            d={`M ${x} ${y} C ${x} ${y + 40}, ${x + offset} ${y + 40}, ${x + offset} ${y + 80}`} 
            fill="none" 
            stroke="#e2e8f0" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
        )}

        <g className="cursor-pointer group" onClick={() => onNodeClick(node)}>
          {isSelected && (
            <circle 
              cx={x} cy={y} r="45" 
              fill="rgba(16, 185, 129, 0.2)"
              className="animate-pulse"
            />
          )}
          <circle 
            cx={x} cy={y} r="32" 
            fill={isSelected ? "#10b981" : "white"} 
            stroke="#10b981"
            strokeWidth="4"
            className="group-hover:fill-emerald-50 transition-all duration-300"
          />
          <text 
            x={x} y={y + 8} 
            textAnchor="middle" 
            fill={isSelected ? "white" : "#064e3b"} 
            className="arabic-font text-2xl font-bold pointer-events-none transition-all duration-300 group-hover:scale-110"
          >
            {node.root}
          </text>
        </g>

        {node.left && renderNode(node.left, x - offset, y + 80, offset / 1.6)}
        {node.right && renderNode(node.right, x + offset, y + 80, offset / 1.6)}
      </g>
    );
  };

  return (
    <div className="w-full h-full overflow-auto rounded-[2rem] bg-white no-scrollbar">
      <svg width="1000" height="800" viewBox="0 0 1000 800" className="mx-auto">
        <g transform="translate(0, 60)">
          {renderNode(root, 500, 40, 220)}
        </g>
      </svg>
    </div>
  );
};

export default TreeVisualizer;
