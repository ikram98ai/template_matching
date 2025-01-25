const Symbol = ({ id, src, color }) => {
    return (
      <div 
        className="relative w-16 h-16 group transition-transform duration-200 hover:scale-105"
        style={{
          border: `3px solid ${color}`,
          borderRadius: '6px',
          boxShadow: `0 2px 6px ${color}33`
        }}
      >
        {/* Label container with single line constraints */}
        <div 
          className="absolute -top-2 left-1 px-2 py-[2px] text-[10px] font-medium text-white rounded-sm z-10"
          style={{
            backgroundColor: `${color}cc`,
            transform: 'skew(-12deg)',
            maxWidth: 'calc(100% - 0.5rem)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          <span className="inline-block transform skew-x-12">
            {id}
          </span>
        </div>
  
        {/* Image container with fixed size */}
        <div className="w-full h-full p-[2px] overflow-hidden">
          <img
            src={src}
            alt={`Symbol ${id}`}
            className="w-full h-full object-contain bg-gray-50 rounded-sm"
          />
        </div>
      </div>
    );
  };

  export default Symbol