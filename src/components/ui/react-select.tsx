import React, { createContext, useContext, useState } from "react";

// Create a context for the select component
const SelectContext = createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
} | null>(null);

// Root component
export const Root: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  return (
    <SelectContext.Provider value={{ open, setOpen, value, setValue }}>
      {children}
    </SelectContext.Provider>
  );
};

// Trigger component
export const Trigger: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error("Trigger must be used within a Select");

  return (
    <button onClick={() => context.setOpen(!context.open)}>{children}</button>
  );
};

// Content component
export const Content: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error("Content must be used within a Select");

  if (!context.open) return null;

  return <div>{children}</div>;
};

// Item component
export const Item: React.FC<{ value: string; children: React.ReactNode }> = ({
  value,
  children,
}) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error("Item must be used within a Select");

  return (
    <div
      onClick={() => {
        context.setValue(value);
        context.setOpen(false);
      }}
    >
      {children}
    </div>
  );
};

// Value component
export const Value: React.FC = () => {
  const context = useContext(SelectContext);
  if (!context) throw new Error("Value must be used within a Select");

  return <span>{context.value}</span>;
};

// Group component
export const Group: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div>{children}</div>;
};

// Label component
export const Label: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <span>{children}</span>;
};

// Icon component
export const Icon: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <span>{children}</span>;
};

// ItemIndicator component
export const ItemIndicator: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <span>{children}</span>;
};

// Portal component (simplified)
export const Portal: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};

// Viewport component
export const Viewport: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div>{children}</div>;
};

// Separator component
export const Separator: React.FC = () => {
  return <hr />;
};
