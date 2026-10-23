import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Toast() {
  const { toastState } = useApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toastState.key) return undefined;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(timer);
  }, [toastState.key]);

  return <div className={`toast${visible ? ' show' : ''}`}>{toastState.message}</div>;
}
