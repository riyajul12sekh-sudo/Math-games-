import React from 'react';

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  className?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  children, 
  variant = 'primary', 
  className = '',
  disabled = false
}) => {
  const baseStyles = "px-8 py-4 rounded-[32px] font-black text-lg transition-all duration-150 transform active:translate-y-2 active:shadow-none bubbly-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-4 border-white select-none";
  
  const variants = {
    primary: "bg-[#FFD670] hover:bg-[#FFC94D] text-[#7D5A00] border-b-[12px] border-[#D4A100]",
    secondary: "bg-[#70D6FF] hover:bg-[#5BB8E0] text-[#005F73] border-b-[12px] border-[#0A9396]",
    success: "bg-[#99FFD3] hover:bg-[#7DFFC4] text-[#006D44] border-b-[12px] border-[#00A36C]",
    danger: "bg-[#FF85B3] hover:bg-[#FF5C99] text-[#800033] border-b-[12px] border-[#D6286B]",
    ghost: "bg-white/80 hover:bg-white text-slate-500 border-b-[8px] border-slate-200"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;