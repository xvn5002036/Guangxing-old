import React from 'react';

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
};

const Container: React.FC<ContainerProps> = ({ children, className = '', as = 'div' }) => {
  const Comp = as as any;
  return (
    <Comp className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`.trim()}>
      {children}
    </Comp>
  );
};

export default Container;

