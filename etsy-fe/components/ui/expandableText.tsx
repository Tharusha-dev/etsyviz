import { useState } from "react";



const ExpandableText = ({ text }: { text: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    text = text ? text : "N/A"
    
    if (text.length < 100) return <span>{text}</span>;
    
    return (
      <div>
        <div className={`${!isExpanded ? "line-clamp-2" : ""}`}>
          {text}
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:underline mt-1"
        >
          {isExpanded ? "Show Less" : "Read More"}
        </button>
      </div>
    );
  };


export default ExpandableText;
